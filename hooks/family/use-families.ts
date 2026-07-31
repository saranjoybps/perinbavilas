"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { FamilyRecord, FilterOptions, SortField, SortOrder, DashboardStats } from "@/types/family";
import { getSpouses } from "@/lib/family-utils";
import { getFamilies } from "@/lib/api";

export function useFamilies() {
  const [records, setRecords] = useState<FamilyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    hasPhotos: null,
    hasSpouse: null,
    childrenCountMin: null,
    childrenCountMax: null,
    sortField: "code",
    sortOrder: "asc",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFamilies();
      setRecords(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          getSpouses(r).some((s) => s.name.toLowerCase().includes(q)) ||
          r.children.some((c) => c.name.toLowerCase().includes(q)) ||
          (r.address || "").toLowerCase().includes(q) ||
          (r.occupation || "").toLowerCase().includes(q) ||
          r.cell_numbers.some((p) => p.toLowerCase().includes(q)) ||
          (r.landline || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q)
      );
    }
    if (filters.hasPhotos === true) {
      result = result.filter((r) => (r.photos || []).length > 0);
    } else if (filters.hasPhotos === false) {
      result = result.filter((r) => !(r.photos || []).length);
    }
    if (filters.hasSpouse === true) {
      result = result.filter((r) => getSpouses(r).length > 0);
    } else if (filters.hasSpouse === false) {
      result = result.filter((r) => getSpouses(r).length === 0);
    }
    if (filters.childrenCountMin !== null) {
      result = result.filter((r) => r.children.length >= filters.childrenCountMin!);
    }
    if (filters.childrenCountMax !== null) {
      result = result.filter((r) => r.children.length <= filters.childrenCountMax!);
    }
    if (filters.sortField !== "file") {
      if (filters.sortField === "code") {
        if (filters.sortOrder === "desc") {
          result = [...result].reverse();
        }
      } else {
        result.sort((a, b) => {
          let cmp = 0;
          switch (filters.sortField) {
            case "name":
              cmp = a.name.localeCompare(b.name);
              break;
            case "dob":
              cmp = (a.dob || "").localeCompare(b.dob || "");
              break;
          }
          return filters.sortOrder === "asc" ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [records, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const stats: DashboardStats = useMemo(() => ({
    totalFamilies: records.length,
    totalChildren: records.reduce((sum, r) => sum + r.children.length, 0),
    totalImages: records.reduce((sum, r) => sum + (r.photos || []).length, 0),
    dataSource: 'Firestore',
  }), [records]);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const setSort = useCallback((field: SortField) => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    records, filteredRecords, paginatedRecords, loading, error, stats,
    filters, updateFilter, setSort, page, setPage, totalPages, pageSize, refresh,
  };
}
