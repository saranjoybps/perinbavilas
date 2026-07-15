import { NextRequest } from 'next/server';
import { loadAllRecords, createRecord } from '@/services/family/firestore-service';
import { errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = await loadAllRecords();
    const cleanRecords = records.map(r => {
      const { _sourceFile, _editedAt, _fileOrder, ...member } = r;
      return member;
    });
    return Response.json(cleanRecords);
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.code || !body.name) {
      return Response.json({ error: 'code and name are required' }, { status: 400 });
    }

    const record = await createRecord(body);
    const { _sourceFile, _editedAt, _fileOrder, ...member } = record;
    return Response.json(member, { status: 201 });
  } catch (err: any) {
    const status = err.message?.includes('Duplicate') ? 409 : 500;
    return errorResponse(err, status);
  }
}
