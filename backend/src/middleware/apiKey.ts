import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';

export interface ApiKeyRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Find the API key in the database
    const allKeys = await prisma.apiKey.findMany({
      include: { user: true },
    });

    // Try to match the key
    let matchedKey = null;
    for (const key of allKeys) {
      try {
        if (await bcrypt.compare(apiKey, key.keyHash)) {
          matchedKey = key;
          break;
        }
      } catch (error) {
        // Continue searching
      }
    }

    if (!matchedKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: matchedKey.id },
      data: { lastUsed: new Date() },
    });

    req.userId = matchedKey.userId;
    req.user = matchedKey.user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

