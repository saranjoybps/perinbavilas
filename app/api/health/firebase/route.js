import { NextResponse } from 'next/server';
import { getFirebaseAdminStatus } from '@/lib/firebase/admin';

/**
 * Safe credential check for Vercel debugging.
 * Does not expose secret values.
 */
export async function GET() {
  return NextResponse.json(getFirebaseAdminStatus());
}
