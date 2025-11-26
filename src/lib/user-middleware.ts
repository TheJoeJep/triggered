import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export type AuthenticatedUserRequest = NextRequest & {
    user: DecodedIdToken;
};

export function withUserAuthentication(handler: (req: AuthenticatedUserRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: Missing Bearer token' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await auth.verifyIdToken(token);
            (req as AuthenticatedUserRequest).user = decodedToken;
            return handler(req as AuthenticatedUserRequest);
        } catch (error) {
            console.error('Auth error:', error);
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }
    };
}
