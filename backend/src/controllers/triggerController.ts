import { Request, Response } from 'express';
import prisma from '../config/database';
import { triggerSchema } from '../utils/validation';
import { AppError } from '../utils/errors';
import { addTriggerJob } from '../queues/triggerQueue';

export const listTriggers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [triggers, total] = await Promise.all([
      prisma.trigger.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          webhookUrl: true,
          scheduleType: true,
          triggerTime: true,
          interval: true,
          executionCount: true,
          maxExecutions: true,
          enabled: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.trigger.count({ where: { userId } }),
    ]);

    res.json({
      triggers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch triggers' });
  }
};

export const getTrigger = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const trigger = await prisma.trigger.findFirst({
      where: {
        id,
        userId, // Ensure ownership
      },
    });

    if (!trigger) {
      throw new AppError('Trigger not found', 404);
    }

    res.json({ trigger });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch trigger' });
  }
};

export const createTrigger = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const validatedData = triggerSchema.parse(req.body);

    // Validate schedule-specific fields
    if (validatedData.scheduleType === 'one-time' && !validatedData.triggerTime) {
      throw new AppError('triggerTime is required for one-time triggers', 400);
    }

    if (validatedData.scheduleType === 'recurring' && !validatedData.interval) {
      throw new AppError('interval is required for recurring triggers', 400);
    }

    if (validatedData.scheduleType === 'interval' && !validatedData.delayMinutes) {
      throw new AppError('delayMinutes is required for interval triggers', 400);
    }

    const trigger = await prisma.trigger.create({
      data: {
        userId,
        name: validatedData.name,
        webhookUrl: validatedData.webhookUrl,
        payload: validatedData.payload,
        scheduleType: validatedData.scheduleType,
        triggerTime: validatedData.triggerTime ? new Date(validatedData.triggerTime) : null,
        interval: validatedData.interval,
        maxExecutions: validatedData.maxExecutions,
        delayMinutes: validatedData.delayMinutes,
        enabled: validatedData.enabled ?? true,
      },
    });

    // Schedule the trigger if enabled
    if (trigger.enabled) {
      await addTriggerJob(trigger);
    }

    res.status(201).json({ trigger });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create trigger' });
  }
};

export const updateTrigger = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Check ownership
    const existingTrigger = await prisma.trigger.findFirst({
      where: { id, userId },
    });

    if (!existingTrigger) {
      throw new AppError('Trigger not found', 404);
    }

    const validatedData = triggerSchema.partial().parse(req.body);

    const trigger = await prisma.trigger.update({
      where: { id },
      data: {
        name: validatedData.name,
        webhookUrl: validatedData.webhookUrl,
        payload: validatedData.payload,
        scheduleType: validatedData.scheduleType,
        triggerTime: validatedData.triggerTime ? new Date(validatedData.triggerTime) : undefined,
        interval: validatedData.interval,
        maxExecutions: validatedData.maxExecutions,
        delayMinutes: validatedData.delayMinutes,
        enabled: validatedData.enabled,
      },
    });

    // Reschedule if enabled
    if (trigger.enabled) {
      await addTriggerJob(trigger);
    }

    res.json({ trigger });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update trigger' });
  }
};

export const deleteTrigger = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Check ownership
    const trigger = await prisma.trigger.findFirst({
      where: { id, userId },
    });

    if (!trigger) {
      throw new AppError('Trigger not found', 404);
    }

    await prisma.trigger.delete({
      where: { id },
    });

    res.json({ message: 'Trigger deleted' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete trigger' });
  }
};

export const pauseTrigger = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const trigger = await prisma.trigger.findFirst({
      where: { id, userId },
    });

    if (!trigger) {
      throw new AppError('Trigger not found', 404);
    }

    const updatedTrigger = await prisma.trigger.update({
      where: { id },
      data: { enabled: false },
    });

    res.json({ trigger: updatedTrigger });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to pause trigger' });
  }
};

export const resumeTrigger = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const trigger = await prisma.trigger.findFirst({
      where: { id, userId },
    });

    if (!trigger) {
      throw new AppError('Trigger not found', 404);
    }

    const updatedTrigger = await prisma.trigger.update({
      where: { id },
      data: { enabled: true },
    });

    // Reschedule
    await addTriggerJob(updatedTrigger);

    res.json({ trigger: updatedTrigger });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to resume trigger' });
  }
};

export const getTriggerExecutions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Verify ownership
    const trigger = await prisma.trigger.findFirst({
      where: { id, userId },
    });

    if (!trigger) {
      throw new AppError('Trigger not found', 404);
    }

    const [executions, total] = await Promise.all([
      prisma.triggerExecution.findMany({
        where: { triggerId: id },
        skip,
        take: limit,
        orderBy: { executedAt: 'desc' },
      }),
      prisma.triggerExecution.count({ where: { triggerId: id } }),
    ]);

    res.json({
      executions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
};

