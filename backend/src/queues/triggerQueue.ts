import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config/env';
import prisma from '../config/database';
import axios from 'axios';
import { Trigger } from '@prisma/client';

// Create queue
export const triggerQueue = new Queue('trigger-execution', {
  connection: {
    host: config.redis.url.includes('://') ? new URL(config.redis.url).hostname : 'localhost',
    port: config.redis.url.includes('://') ? parseInt(new URL(config.redis.url).port) || 6379 : 6379,
  },
});

// Worker to process jobs
export const triggerWorker = new Worker(
  'trigger-execution',
  async (job: Job) => {
    const { triggerId } = job.data;

    const trigger = await prisma.trigger.findUnique({
      where: { id: triggerId },
    });

    if (!trigger || !trigger.enabled) {
      return;
    }

    // Execute webhook
    try {
      const response = await axios.post(
        trigger.webhookUrl,
        trigger.payload,
        {
          timeout: 30000, // 30 second timeout
          validateStatus: () => true, // Accept any status
        }
      );

      // Record successful execution
      await prisma.triggerExecution.create({
        data: {
          triggerId: trigger.id,
          status: 'success',
          responseCode: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 1000),
        },
      });

      // Update execution count
      const newCount = trigger.executionCount + 1;
      await prisma.trigger.update({
        where: { id: trigger.id },
        data: { executionCount: newCount },
      });

      // Handle recurring triggers
      if (trigger.scheduleType === 'recurring' && trigger.enabled) {
        // Check if max executions reached
        if (trigger.maxExecutions && newCount >= trigger.maxExecutions) {
          await prisma.trigger.update({
            where: { id: trigger.id },
            data: { enabled: false },
          });
          return;
        }

        // Schedule next execution
        if (trigger.interval) {
          await addTriggerJob(trigger, newCount);
        }
      }

      return {
        success: true,
        status: response.status,
      };
    } catch (error: any) {
      // Record failed execution
      await prisma.triggerExecution.create({
        data: {
          triggerId: trigger.id,
          status: 'failure',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  },
  {
    connection: {
      host: config.redis.url.includes('://') ? new URL(config.redis.url).hostname : 'localhost',
      port: config.redis.url.includes('://') ? parseInt(new URL(config.redis.url).port) || 6379 : 6379,
    },
    maxStalledCount: 2,
    stalledInterval: 30000,
  }
);

// Add a trigger job to the queue
export const addTriggerJob = async (trigger: Trigger, existingCount: number = 0) => {
  let delay = 0;

  if (trigger.scheduleType === 'one-time') {
    if (trigger.triggerTime) {
      const triggerTime = new Date(trigger.triggerTime).getTime();
      const now = Date.now();
      delay = Math.max(0, triggerTime - now);
    }
  } else if (trigger.scheduleType === 'recurring' && trigger.interval) {
    delay = trigger.interval * 60 * 1000; // Convert minutes to milliseconds
  } else if (trigger.scheduleType === 'interval' && trigger.delayMinutes) {
    delay = trigger.delayMinutes * 60 * 1000; // Convert minutes to milliseconds
  }

  const jobOptions = {
    jobId: trigger.id,
    delay,
    attempts: 3, // Retry 3 times
    backoff: {
      type: 'exponential' as const,
      delay: 5000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  };

  await triggerQueue.add(
    'execute',
    {
      triggerId: trigger.id,
      executionCount: existingCount,
    },
    jobOptions
  );
};

// Initialize: Schedule all enabled triggers
export const initializeTriggers = async () => {
  const triggers = await prisma.trigger.findMany({
    where: { enabled: true },
  });

  for (const trigger of triggers) {
    await addTriggerJob(trigger, trigger.executionCount);
  }

  console.log(`Initialized ${triggers.length} triggers`);
};

