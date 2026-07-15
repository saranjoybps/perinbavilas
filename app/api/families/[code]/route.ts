import { NextRequest } from 'next/server';
import { getRecordByCode, updateRecord, deleteRecord } from '@/services/family/firestore-service';
import { errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const record = await getRecordByCode(decodeURIComponent(code));
    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }
    const { _sourceFile, _editedAt, _fileOrder, ...member } = record;
    return Response.json(member);
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const record = await updateRecord(decodeURIComponent(code), body);
    const { _sourceFile, _editedAt, _fileOrder, ...member } = record;
    return Response.json(member);
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : err.message?.includes('Duplicate') ? 409 : 500;
    return errorResponse(err, status);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    await deleteRecord(decodeURIComponent(code));
    return Response.json({ success: true });
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : 500;
    return errorResponse(err, status);
  }
}
