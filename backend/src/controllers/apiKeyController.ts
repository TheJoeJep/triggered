import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export const listApiKeys = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ apiKeys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

export const createApiKey = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError('API key name is required', 400);
    }

    // Generate API key
    const apiKey = `tr_${crypto.randomBytes(32).toString('base64url')}`;

    // Hash the key for storage
    const keyHash = await bcrypt.hash(apiKey, 10);

    // Store in database
    const storedKey = await prisma.apiKey.create({
      data: {
        userId,
        name: name.trim(),
        keyHash,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    // Return the plain key only once
    res.status(201).json({
      apiKey: {
        ...storedKey,
        key: apiKey, // Only returned on creation
      },
      message: 'Save this key securely. It will not be shown again.',
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create API key' });
  }
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Check ownership
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new AppError('API key not found', 404);
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    res.json({ message: 'API key deleted' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete API key' });
  }
};

