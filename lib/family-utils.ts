import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FamilyRecord, Spouse } from "@/types/family";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSpouses(record: { spouse?: Spouse | null; spouses?: Spouse[] | null } | null | undefined): Spouse[] {
  if (!record) return [];
  const spouses = (record.spouses ?? []).filter((s) => s && s.name?.trim());
  if (spouses.length) return spouses;
  const legacy = record.spouse;
  return legacy && legacy.name?.trim() ? [legacy] : [];
}

export function normalizePhotos(photos: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  return (photos ?? []).filter((photo): photo is string => {
    if (typeof photo !== "string" || photo.length === 0 || seen.has(photo)) {
      return false;
    }
    seen.add(photo);
    return true;
  });
}

/** Allowed PDF export roots (matches Family module hierarchy). */
export const EXPORT_ROOT_CODES = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
export type ExportRootCode = (typeof EXPORT_ROOT_CODES)[number];

function sortCode(code: string) {
  return code.split("/")[0];
}

function compareFamilyCodes(a: string, b: string) {
  const primaryCompare = sortCode(a).localeCompare(sortCode(b), undefined, { numeric: true });
  if (primaryCompare !== 0) return primaryCompare;
  return a.localeCompare(b, undefined, { numeric: true });
}

function isDescendantOfRoot(code: string, rootCode: string) {
  const left = sortCode(code);
  if (left === rootCode) return true;
  if (!left.startsWith(rootCode)) return false;
  const rest = left.slice(rootCode.length);
  return /^\d+$/.test(rest);
}

/**
 * Collect the selected root and every descendant in hierarchy order
 * (same children walk used by the Family module).
 *
 * - Root `0`: ancestor `0`, then full trees for branches `1`–`7`
 * - Root `1`–`7`: that branch only
 */
export function collectSubtreeByRoot(
  allRecords: FamilyRecord[],
  rootCode: string,
): FamilyRecord[] {
  const recordMap = new Map<string, FamilyRecord>();
  for (const r of allRecords) {
    recordMap.set(r.code, r);
  }

  const result: FamilyRecord[] = [];
  const visited = new Set<string>();

  function findRecord(code: string): FamilyRecord | undefined {
    if (recordMap.has(code)) return recordMap.get(code);
    for (const [key, record] of recordMap) {
      if (key.startsWith(`${code}/`) || key.startsWith(`${code}-`)) {
        return record;
      }
    }
    return undefined;
  }

  function appendRecord(code: string) {
    const record = findRecord(code);
    if (!record || visited.has(record.code)) return null;
    visited.add(record.code);
    result.push(record);
    return record;
  }

  function getUnvisitedChildren(record: FamilyRecord) {
    return (record.children || [])
      .map((child) => findRecord(child.code)?.code)
      .filter((childCode): childCode is string => Boolean(childCode && !visited.has(childCode)))
      .sort(compareFamilyCodes);
  }

  function visitHierarchyByLevel(startCode: string) {
    const root = appendRecord(startCode);
    if (!root) return;

    let currentLevel = getUnvisitedChildren(root);
    while (currentLevel.length > 0) {
      const nextLevel: string[] = [];
      for (const code of currentLevel) {
        const record = appendRecord(code);
        if (record) nextLevel.push(...getUnvisitedChildren(record));
      }
      currentLevel = nextLevel.sort(compareFamilyCodes);
    }
  }

  if (rootCode === "0") {
    appendRecord("0");
    for (let i = 1; i <= 7; i += 1) {
      visitHierarchyByLevel(String(i));
    }
  } else {
    visitHierarchyByLevel(rootCode);
  }

  // Catch descendants linked by code but missing from children arrays
  for (const r of allRecords) {
    if (visited.has(r.code)) continue;
    if (rootCode === "0") {
      const left = sortCode(r.code);
      if (/^[1-7]/.test(left) && isDescendantOfRoot(r.code, left[0])) {
        visitHierarchyByLevel(r.code);
      }
    } else if (isDescendantOfRoot(r.code, rootCode)) {
      visitHierarchyByLevel(r.code);
    }
  }

  return result;
}
