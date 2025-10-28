import { Request, Response } from 'express';
import prisma from '../config/database';
import { triggerSchema } from '../utils/validation';
import { AppError } from '../utils/errors';
import { addTriggerJob } from '../queues/triggerQueue';

// MCP endpoints for AI agents to manage triggers
export const mcpListTriggers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const triggers = await prisma.trigger.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        webhookUrl: true,
        scheduleType: true,
        enabled: true,
        executionCount: true,
        createdAt: true,
      },
    });

    res.json({ triggers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch triggers' });
  }
};

export const mcpCreateTrigger = async (req: Request, res: Response) => {
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

export const mcpUpdateTrigger = async (req: Request, res: Response) => {
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

export const mcpDeleteTrigger = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const trigger = await prisma.trigger.findFirst({
      where: { id, userId },
    });

    if (!trigger) {
      throw new AppError('Trigger not found', 404);
    }

    await prisma.trigger.delete({
      where: { id },
    });

    res.json({ message: 'Trigger deleted', triggerId: id });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete trigger' });
  }
};

