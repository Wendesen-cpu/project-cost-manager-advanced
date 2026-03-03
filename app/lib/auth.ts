import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.SESSION_SECRET || 'super-secret-key-change-this';
const key = new TextEncoder().encode(SECRET_KEY);
const SESSION_DURATION_SECONDS = 24 * 60 * 60; // 24 hours

export async function createSession(payload: any) {
    const session = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('user_session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION_SECONDS,
    });
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.set('user_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('user_session')?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch {
        return null;
    }
}