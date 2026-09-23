'use server';

import { FamilyMember, FamilyRecord, Spouse } from '@/types/family';
import { adminDb } from '@/lib/firebase/admin';
import { deleteFamilyImages } from '@/services/family/image-service';

const COLLECTION_NAME = 'families';

let cachedRecords: FamilyRecord[] | null = null;
let lastLoadTime = 0;
const CACHE_TTL = 300000;

function sanitizeDocId(code: string): string {
  return code.replace(/\//g, '-');
}

function normalizeSpouseFields(spouses: Spouse[] | undefined, spouse: Spouse | undefined): { spouse: Spouse; spouses: Spouse[] } {
  const list = (spouses && spouses.length ? spouses : spouse?.name ? [spouse] : [])
    .filter((s) => s && s.name?.trim())
    .map((s) => ({ name: s.name?.trim() || '', dob: s.dob || null, dod: s.dod || null }));
  return {
    spouse: list[0] || { name: '', dob: null, dod: null },
    spouses: list,
  };
}

function recordToFamilyRecord(doc: FirebaseFirestore.DocumentSnapshot): FamilyRecord | null {
  const data = doc.data();
  if (!data) return null;

  const spouseFields = normalizeSpouseFields(data.spouses, data.spouse);

  return {
    code: String(data.code || doc.id.replace(/-/g, '/') || '').trim(),
    name: data.name || '',
    dob: data.dob || null,
    dod: data.dod || null,
    spouse: spouseFields.spouse,
    spouses: spouseFields.spouses,
    family_name: data.family_name || null,
    address: data.address || null,
    cell_numbers: data.cell_numbers || [],
    landline: data.landline || null,
    email: data.email || null,
    occupation: data.occupation || null,
    photos: data.photos || [],
    children: (data.children || []).map((c: Record<string, unknown>) => ({
      code: String(c.code ?? '').trim(),
      name: c.name as string,
      dob: (c.dob as string) || null,
      dod: (c.dod as string) || null,
    })),
    _sourceFile: 'firestore',
    _fileOrder: data._fileOrder || 0,
    _editedAt: data._editedAt || undefined,
  };
}

function hydrateChildrenFromRecords(record: FamilyRecord, recordMap: Map<string, FamilyRecord>): FamilyRecord {
  return {
    ...record,
    children: (record.children || []).map((child) => {
      const childRecord = recordMap.get(child.code);
      return {
        ...child,
        name: child.name || childRecord?.name || '',
        dob: child.dob || childRecord?.dob || null,
        dod: child.dod || childRecord?.dod || null,
      };
    }),
  };
}

export async function loadAllRecords(): Promise<FamilyRecord[]> {
  const now = Date.now();
  if (cachedRecords && now - lastLoadTime < CACHE_TTL) {
    return cachedRecords;
  }

  try {
    const snapshot = await adminDb.collection(COLLECTION_NAME).get();
    const allRecords: FamilyRecord[] = [];

    for (const doc of snapshot.docs) {
      const record = recordToFamilyRecord(doc);
      if (record) {
        allRecords.push(record);
      }
    }

    const recordMap = new Map<string, FamilyRecord>();
    for (const r of allRecords) {
      recordMap.set(r.code, r);
    }

    for (const r of allRecords) {
      const hydrated = hydrateChildrenFromRecords(r, recordMap);
      Object.assign(r, hydrated);
      recordMap.set(r.code, r);
    }

    function findRecord(code: string): FamilyRecord | undefined {
      if (recordMap.has(code)) return recordMap.get(code);
      for (const [key, record] of recordMap) {
        if (key.startsWith(code + '/') || key.startsWith(code + '-')) {
          return record;
        }
      }
      return undefined;
    }

    function getActualCode(code: string): string | undefined {
      const record = findRecord(code);
      return record?.code;
    }

    function sortCode(code: string) {
      return code.split('/')[0];
    }

    function compareFamilyCodes(a: string, b: string) {
      const primaryCompare = sortCode(a).localeCompare(sortCode(b), undefined, { numeric: true });
      if (primaryCompare !== 0) return primaryCompare;
      return a.localeCompare(b, undefined, { numeric: true });
    }

    const records: FamilyRecord[] = [];
    const visited = new Set<string>();

    const rootAncestor = recordMap.get('0');
    if (rootAncestor) {
      visited.add(rootAncestor.code);
      records.push(rootAncestor);
    }

    function appendRecord(code: string) {
      const actualCode = getActualCode(code);
      if (!actualCode || visited.has(actualCode)) return null;

      const record = recordMap.get(actualCode);
      if (!record) return null;

      visited.add(actualCode);
      records.push(record);
      return record;
    }

    function getUnvisitedChildren(record: FamilyRecord) {
      return (record.children || [])
        .map(child => getActualCode(child.code))
        .filter((childCode): childCode is string => Boolean(childCode && !visited.has(childCode)))
        .sort(compareFamilyCodes);
    }

    function visitHierarchyByLevel(rootCode: string) {
      const root = appendRecord(rootCode);
      if (!root) return;

      let currentLevel = getUnvisitedChildren(root);
      while (currentLevel.length > 0) {
        const nextLevel: string[] = [];

        for (const code of currentLevel) {
          const record = appendRecord(code);
          if (record) {
            nextLevel.push(...getUnvisitedChildren(record));
          }
        }

        currentLevel = nextLevel.sort(compareFamilyCodes);
      }
    }

    const familyRoots = allRecords
      .filter(r => /^[1-7]$/.test(r.code))
      .sort((a, b) => compareFamilyCodes(a.code, b.code));

    for (const root of familyRoots) {
      visitHierarchyByLevel(root.code);
    }

    for (const r of allRecords) {
      if (!visited.has(r.code)) {
        records.push(r);
      }
    }

    cachedRecords = records;
    lastLoadTime = now;
    return records;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to load records from Firestore:', message);
    return [];
  }
}

export async function getRecordByCode(code: string): Promise<FamilyRecord | null> {
  try {
    const docId = sanitizeDocId(code);
    const doc = await adminDb.collection(COLLECTION_NAME).doc(docId).get();
    const record = recordToFamilyRecord(doc);
    if (!record) return null;

    if (!record.children?.length) return record;

    const hydratedChildren = await Promise.all(
      record.children.map(async (child) => {
        if (!child.code) return child;
        try {
          const childDoc = await adminDb
            .collection(COLLECTION_NAME)
            .doc(sanitizeDocId(child.code))
            .get();
          const childRecord = recordToFamilyRecord(childDoc);
          if (!childRecord) return child;
          return {
            ...child,
            name: child.name || childRecord.name || '',
            dob: child.dob || childRecord.dob || null,
            dod: child.dod || childRecord.dod || null,
          };
        } catch {
          return child;
        }
      })
    );

    return { ...record, children: hydratedChildren };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to get record ${code}:`, message);
    return null;
  }
}

export async function createRecord(data: FamilyMember): Promise<FamilyRecord> {
  const docId = sanitizeDocId(data.code);
  const existingDoc = await adminDb.collection(COLLECTION_NAME).doc(docId).get();
  if (existingDoc.exists) {
    throw new Error(`Duplicate code: ${data.code} already exists`);
  }

  const records = await loadAllRecords();

  const recordMap = new Map<string, FamilyRecord>();
  for (const r of records) {
    recordMap.set(r.code, r);
  }

  let parentCode: string | null = null;

  if (data.code.includes('/')) {
    const [childLeft, childRight] = data.code.split('/');
    for (let trim = 1; trim < Math.min(childLeft.length, childRight.length); trim++) {
      const candidateParent = `${childLeft.slice(0, -trim)}/${childRight.slice(0, -trim)}`;
      if (recordMap.has(candidateParent)) {
        parentCode = candidateParent;
        break;
      }
    }
    if (!parentCode) {
      for (let trim = 1; trim < childLeft.length; trim++) {
        const candidateParent = childLeft.slice(0, -trim);
        if (recordMap.has(candidateParent)) {
          parentCode = candidateParent;
          break;
        }
      }
    }
  } else {
    for (let i = data.code.length - 1; i >= 1; i--) {
      const prefix = data.code.substring(0, i);
      if (recordMap.has(prefix)) {
        parentCode = prefix;
        break;
      }
    }
    if (!parentCode) {
      const slashIdx = data.code.lastIndexOf('/');
      if (slashIdx > 0) {
        const parent = data.code.substring(0, slashIdx);
        if (recordMap.has(parent)) parentCode = parent;
      }
    }
    if (!parentCode) {
      const dashIdx = data.code.lastIndexOf('-');
      if (dashIdx > 0) {
        const parent = data.code.substring(0, dashIdx);
        if (recordMap.has(parent)) parentCode = parent;
      }
    }
  }

  const maxOrderSnapshot = await adminDb.collection(COLLECTION_NAME)
    .orderBy('_fileOrder', 'desc')
    .limit(1)
    .get();
  const maxOrder = maxOrderSnapshot.empty ? 0 : (maxOrderSnapshot.docs[0].data()._fileOrder || 0);

  const spouseFields = normalizeSpouseFields(data.spouses, data.spouse);

  const newRecord: FamilyRecord = {
    ...data,
    photos: data.photos || [],
    children: (data.children || []).map(c => ({
      code: c.code,
      name: c.name,
      dob: c.dob || null,
      dod: c.dod || null,
    })),
    spouse: spouseFields.spouse,
    spouses: spouseFields.spouses,
    _sourceFile: 'firestore',
    _fileOrder: maxOrder + 1,
    _editedAt: new Date().toISOString(),
  };

  const { _sourceFile, _editedAt, _fileOrder, ...memberData } = newRecord;
  await adminDb.collection(COLLECTION_NAME).doc(docId).set({
    ...memberData,
    _fileOrder,
    _editedAt,
    createdAt: new Date(),
  });

  if (parentCode) {
    const parentId = sanitizeDocId(parentCode);
    const parentDoc = await adminDb.collection(COLLECTION_NAME).doc(parentId).get();
    const parentData = parentDoc.data();
    if (parentData) {
      const existingChildren = parentData.children || [];
      if (!existingChildren.some((c: any) => c.code === data.code)) {
        await adminDb.collection(COLLECTION_NAME).doc(parentId).update({
          children: [...existingChildren, { code: data.code, name: data.name, dob: data.dob || null, dod: data.dod || null }],
        });
      }
    }
  }

  cachedRecords = null;
  return newRecord;
}

export async function updateRecord(code: string, updates: Partial<FamilyMember>): Promise<FamilyRecord> {
  const existing = await getRecordByCode(code);
  if (!existing) {
    throw new Error(`Record not found: ${code}`);
  }

  if (updates.code && updates.code !== code) {
    const dupDoc = await adminDb.collection(COLLECTION_NAME).doc(sanitizeDocId(updates.code)).get();
    if (dupDoc.exists) {
      throw new Error(`Duplicate code: ${updates.code} already exists`);
    }
  }

  const docId = sanitizeDocId(code);

  const hasSpouseUpdate = updates.spouses !== undefined || updates.spouse !== undefined;
  const spouseFields = hasSpouseUpdate
    ? normalizeSpouseFields(updates.spouses, updates.spouse)
    : { spouse: existing.spouse, spouses: existing.spouses ?? [] };

  const updatedRecord: FamilyRecord = {
    ...existing,
    ...updates,
    children: updates.children
      ? updates.children.map(c => ({ code: c.code, name: c.name, dob: c.dob || null, dod: c.dod || null }))
      : existing.children,
    spouse: spouseFields.spouse,
    spouses: spouseFields.spouses,
    photos: updates.photos !== undefined ? updates.photos : existing.photos,
    _editedAt: new Date().toISOString(),
  } as FamilyRecord;

  const { _sourceFile, _editedAt, _fileOrder, ...memberData } = updatedRecord;
  await adminDb.collection(COLLECTION_NAME).doc(docId).set({
    ...memberData,
    _fileOrder: _fileOrder || existing._fileOrder,
    _editedAt,
    updatedAt: new Date(),
  }, { merge: true });

  if (updates.code && updates.code !== code) {
    const newDocId = sanitizeDocId(updates.code);
    await adminDb.collection(COLLECTION_NAME).doc(docId).delete();
    const { _sourceFile: sf, _editedAt: ea, _fileOrder: fo, ...newMemberData } = updatedRecord;
    await adminDb.collection(COLLECTION_NAME).doc(newDocId).set({
      ...newMemberData,
      _fileOrder: fo,
      _editedAt: ea,
      createdAt: new Date(),
    });
  }

  cachedRecords = null;
  return updatedRecord;
}

export async function deleteRecord(code: string): Promise<void> {
  const record = await getRecordByCode(code);
  if (!record) {
    throw new Error(`Record not found: ${code}`);
  }

  if (record.photos && record.photos.length > 0) {
    try { await deleteFamilyImages(record.photos); } catch {}
  }

  const docId = sanitizeDocId(code);
  await adminDb.collection(COLLECTION_NAME).doc(docId).delete();

  cachedRecords = null;
}

export async function duplicateRecord(code: string): Promise<FamilyRecord> {
  const original = await getRecordByCode(code);
  if (!original) {
    throw new Error(`Record not found: ${code}`);
  }

  let finalCode = `${code}_copy`;
  let counter = 1;
  while (true) {
    const dupDoc = await adminDb.collection(COLLECTION_NAME).doc(sanitizeDocId(finalCode)).get();
    if (!dupDoc.exists) break;
    finalCode = `${code}_copy_${counter}`;
    counter++;
  }

  const docId = sanitizeDocId(finalCode);
  const maxOrderSnapshot = await adminDb.collection(COLLECTION_NAME)
    .orderBy('_fileOrder', 'desc')
    .limit(1)
    .get();
  const maxOrder = maxOrderSnapshot.empty ? 0 : (maxOrderSnapshot.docs[0].data()._fileOrder || 0);

  const newRecord: FamilyRecord = {
    ...original,
    code: finalCode,
    name: `${original.name} (Copy)`,
    _sourceFile: 'firestore',
    _fileOrder: maxOrder + 1,
    _editedAt: new Date().toISOString(),
  };

  const { _sourceFile, _editedAt, _fileOrder, ...memberData } = newRecord;
  await adminDb.collection(COLLECTION_NAME).doc(docId).set({
    ...memberData,
    _fileOrder,
    _editedAt,
    createdAt: new Date(),
  });

  cachedRecords = null;
  return newRecord;
}

export async function reloadData(): Promise<FamilyRecord[]> {
  cachedRecords = null;
  lastLoadTime = 0;
  return loadAllRecords();
}

export async function getJsonFilesInfo(): Promise<{ name: string; count: number }[]> {
  const records = await loadAllRecords();
  return [{ name: 'Firestore Collection', count: records.length }];
}

export async function exportAllAsJson(): Promise<string> {
  const records = await loadAllRecords();
  const cleanRecords = records.map(r => {
    const { _sourceFile, _editedAt, _fileOrder, ...member } = r;
    return member;
  });
  return JSON.stringify(cleanRecords, null, 2);
}

export async function undoDelete(code: string, backupContent: string): Promise<void> {
  const existingDoc = await adminDb.collection(COLLECTION_NAME).doc(sanitizeDocId(code)).get();
  if (existingDoc.exists) {
    throw new Error(`Code ${code} already exists. Cannot restore.`);
  }

  const data = JSON.parse(backupContent) as FamilyMember[];
  const restored = data.find(r => r.code === code);
  if (!restored) {
    throw new Error(`Record not found in backup: ${code}`);
  }

  const docId = sanitizeDocId(code);
  const maxOrderSnapshot = await adminDb.collection(COLLECTION_NAME)
    .orderBy('_fileOrder', 'desc')
    .limit(1)
    .get();
  const maxOrder = maxOrderSnapshot.empty ? 0 : (maxOrderSnapshot.docs[0].data()._fileOrder || 0);

  const newRecord: FamilyRecord = {
    ...restored,
    photos: restored.photos || [],
    children: (restored.children || []).map(c => ({
      code: c.code, name: c.name, dob: c.dob || null, dod: c.dod || null,
    })),
    spouse: restored.spouse || { name: '', dob: null, dod: null },
    _sourceFile: 'firestore',
    _fileOrder: maxOrder + 1,
    _editedAt: new Date().toISOString(),
  };

  const { _sourceFile, _editedAt, _fileOrder, ...memberData } = newRecord;
  await adminDb.collection(COLLECTION_NAME).doc(docId).set({
    ...memberData,
    _fileOrder,
    _editedAt,
    createdAt: new Date(),
  });

  cachedRecords = null;
}

function queryByPrefix(prefix: string): Promise<FirebaseFirestore.QuerySnapshot> {
  return adminDb.collection(COLLECTION_NAME)
    .where('code', '>=', prefix)
    .where('code', '<', prefix + '\uf8ff')
    .select('code')
    .get();
}

export async function generateNextCode(parentCode: string, spouseFamilyCode?: string): Promise<string> {
  if (parentCode.includes('/')) {
    const [leftSide, rightSide] = parentCode.split('/');
    const childPrefix = leftSide.slice(0, -1);
    const snapshot = await queryByPrefix(childPrefix);
    const directChildren = snapshot.docs
      .map(d => d.data().code as string)
      .filter(c => {
        if (!c.includes('/')) return false;
        const [childLeft] = c.split('/');
        return childLeft.startsWith(leftSide) && childLeft.length === leftSide.length + 1;
      });

    if (directChildren.length === 0) {
      return `${leftSide}1/${rightSide}1`;
    }

    const maxChildNum = Math.max(...directChildren.map(c => {
      const [childLeft] = c.split('/');
      return parseInt(childLeft.slice(-1), 10);
    }));
    return `${leftSide}${maxChildNum + 1}/${rightSide}${maxChildNum + 1}`;
  }

  if (spouseFamilyCode) {
    const snapshot = await queryByPrefix(parentCode);
    const directChildren = snapshot.docs
      .map(d => d.data().code as string)
      .filter(c => {
        if (!c.includes('/')) return false;
        const [childLeft] = c.split('/');
        return childLeft.startsWith(parentCode) && childLeft.length === parentCode.length + 1;
      });

    if (directChildren.length === 0) {
      return `${parentCode}1/${spouseFamilyCode}1`;
    }

    const maxChildNum = Math.max(...directChildren.map(c => {
      const [childLeft] = c.split('/');
      return parseInt(childLeft.slice(-1), 10);
    }));
    return `${parentCode}${maxChildNum + 1}/${spouseFamilyCode}${maxChildNum + 1}`;
  }

  const snapshot = await queryByPrefix(parentCode);
  const directChildren = snapshot.docs
    .map(d => d.data().code as string)
    .filter(c => c.startsWith(parentCode) && c.length === parentCode.length + 1 && c !== parentCode);

  if (directChildren.length === 0) {
    return `${parentCode}1`;
  }

  const maxChildNum = Math.max(...directChildren.map(c => parseInt(c.slice(-1), 10)));
  return `${parentCode}${maxChildNum + 1}`;
}

export async function getChildSuggestions(): Promise<{ code: string; name: string }[]> {
  const snapshot = await adminDb.collection(COLLECTION_NAME)
    .select('code', 'name')
    .get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { code: data.code || doc.id, name: data.name || '' };
  });
}
