'use client';

import { useState, useCallback } from 'react';
import { useFamilies } from '@/hooks/family/use-families';
import { StatsCards } from '@/components/family-dashboard/stats-cards';
import { SearchBar } from '@/components/family-dashboard/search-bar';
import { Filters } from '@/components/family-dashboard/filters';
import { FamilyTable } from '@/components/family-dashboard/family-table';
import { Pagination } from '@/components/family-dashboard/pagination';
import { FamilyEditor } from '@/components/family/family-editor';
import { InterFamilyEditor } from '@/components/family/inter-family-editor';
import { FamilyViewDialog } from '@/components/family/family-view-dialog';
import { PdfPreview } from '@/components/family/pdf-preview';
import { DeleteConfirmModal } from '@/components/family/delete-confirm-modal';

const btnBase = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.72rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '0.65rem 1.5rem',
  border: '1px solid rgba(15, 42, 31,0.45)',
  background: 'transparent',
  color: '#0F2A1F',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export default function FamilyPage() {
  const {
    records, paginatedRecords, filteredRecords, loading, error, stats,
    filters, updateFilter, setSort, page, setPage, totalPages, refresh,
  } = useFamilies();

  const [editRecord, setEditRecord] = useState(undefined);
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [interFamilyOpen, setInterFamilyOpen] = useState(false);

  const handleEdit = useCallback((record) => {
    setEditRecord(record);
    setEditorOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditRecord(undefined);
    setEditorOpen(true);
  }, []);

  const handleView = useCallback((record) => {
    setViewRecord(record);
    setViewOpen(true);
  }, []);

  const handleDelete = useCallback((record) => {
    setDeleteRecord(record);
    setDeleteOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
  }, []);

  return (
    <div>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>
          Admin
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>
          Family Directory
        </h1>
        <span className="gold-rule block mt-3" />
      </div>

      <StatsCards stats={stats} />

      <div className="glass-warm shadow-cloud p-4 md:p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div style={{ flex: '1 1 280px' }}>
            <SearchBar value={filters.search} onChange={(v) => updateFilter('search', v)} />
          </div>
          <Filters
            filters={filters}
            onPhotosChange={(v) => updateFilter('hasPhotos', v)}
            onSpouseChange={(v) => updateFilter('hasSpouse', v)}
            onChildrenMinChange={(v) => updateFilter('childrenCountMin', v)}
            onSortFieldChange={(v) => updateFilter('sortField', v)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <PdfPreview records={records}>
          <button
            style={btnBase}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; }}
          >
            Export PDF
          </button>
        </PdfPreview>
        <button
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; }}
          onClick={refresh}
        >
          ⟳ Refresh
        </button>
        <button
          style={{ ...btnBase, color: '#FFF7ED', background: '#0F2A1F' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0A1C14'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0F2A1F'; }}
          onClick={handleCreate}
        >
          + Add Family
        </button>
        <button
          style={btnBase}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; }}
          onClick={() => setInterFamilyOpen(true)}
        >
          + Inter-Family Marriage
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div className="glass-warm shadow-cloud p-4 max-w-md" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: '#b03030', background: 'rgba(176,48,48,0.06)', border: '1px solid rgba(176,48,48,0.16)' }}>
          {error}
        </div>
      ) : (
        <>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.4)', marginBottom: '1rem' }}>
            Showing {paginatedRecords.length} of {filteredRecords.length} families
          </p>
          <FamilyTable
            records={paginatedRecords}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            sortField={filters.sortField}
            sortOrder={filters.sortOrder}
            onSort={setSort}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <FamilyEditor
        key={editRecord?.code ?? 'new'}
        record={editRecord}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaved}
      />

      <InterFamilyEditor
        open={interFamilyOpen}
        onOpenChange={setInterFamilyOpen}
        onSave={handleSaved}
      />

      <FamilyViewDialog
        record={viewRecord}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <DeleteConfirmModal
        record={deleteRecord}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleSaved}
      />
    </div>
  );
}
