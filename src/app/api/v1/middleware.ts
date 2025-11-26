
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Organization } from '@/lib/types';

export type AuthenticatedRequest = NextRequest & {
  organization: Organization;
};

export type AuthenticatedContext = {
  params: Record<string, string>;
};

export type AuthenticatedRouteHandler = (req: AuthenticatedRequest, context: AuthenticatedContext) => Promise<NextResponse>;


export function withAuthentication(handler: AuthenticatedRouteHandler) {
  return async (req: NextRequest, context: AuthenticatedContext) => {
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
      // Force init check
      const _ = db.collection('organizations');
    } catch (e) {
      return new NextResponse(`DB Init failed: ${String(e)}`, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Bearer token is missing' }, { status: 401 });
    }

    try {
      const organizationsRef = db.collection('organizations');
      const q = organizationsRef.where('apiKey', '==', token);
      const querySnapshot = await q.get();

      if (querySnapshot.empty) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
      }

      const orgDoc = querySnapshot.docs[0];
      const organization = orgDoc.data() as Organization;
      // FIX: Attach the doc ID to the object
      organization.id = orgDoc.id;

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.organization = organization;

      return await handler(authenticatedReq, context);
    } catch (error) {
      console.error('API Authentication Error:', error);
      return NextResponse.json({ error: `Internal server error: ${String(error)}` }, { status: 500 });
    }
  };
}
