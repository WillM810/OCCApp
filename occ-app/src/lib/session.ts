import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface JICPayload {
    user: string;
    pw: string;
    system: 'FC' | 'SC';
};

export interface DDPayload {
    token: string;
    date: string;
    system: 'DD';
}

const secretKey = process.env.SESSION_SECRET;

if (!secretKey) {
    throw new Error('SESSION_SECRET environment variable is not defined');
}

const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: JICPayload | DDPayload, expires: Date): Promise<string> {
  return new SignJWT({ payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(encodedKey);
}

export async function decrypt(sessionCookieValue: string): Promise<JICPayload | DDPayload | null> {
  try {
    const { payload: sessionData } = await jwtVerify(sessionCookieValue, encodedKey, { algorithms: ['HS256'] });
    return sessionData.payload as JICPayload | DDPayload; 
  } catch (error) {
    console.error("Session decryption failed:", (error as Error).message);
    return null;
  }
}
