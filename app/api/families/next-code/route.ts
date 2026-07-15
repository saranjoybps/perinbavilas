import { NextRequest } from 'next/server';
import { generateNextCode } from '@/services/family/firestore-service';
import { errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parent = searchParams.get('parent');
    const spouse = searchParams.get('spouse') || undefined;

    if (!parent) {
      return Response.json({ error: 'parent query param is required' }, { status: 400 });
    }

    const code = await generateNextCode(parent, spouse);
    return Response.json({ code });
  } catch (err: any) {
    return errorResponse(err);
  }
}
