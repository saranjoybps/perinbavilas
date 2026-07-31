import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Spouse } from "@/types/family";

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
