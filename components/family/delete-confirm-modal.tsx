"use client";

import { useState, useCallback, useEffect } from "react";
import { FamilyRecord } from "@/types/family";
import { deleteFamily } from "@/lib/api";
import { toast } from "sonner";

const overlayStyle = {
  position: 'fixed' as const,
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(26,16,8,0.35)',
  backdropFilter: 'blur(2px)',
};

const modalStyle = {
  width: '100%',
  maxWidth: '28rem',
  padding: '1.5rem 2rem',
  borderTop: '2px solid rgba(176,48,48,0.5)',
};

const labelStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.62rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase' as const,
  color: 'rgba(26,16,8,0.42)',
  display: 'block',
  marginBottom: '0.35rem',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(176,48,48,0.22)',
  padding: '0.65rem 0.8rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  color: '#1A1008',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const btnBase = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.72rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  padding: '0.6rem 1.4rem',
  border: '1px solid rgba(196,155,26,0.45)',
  background: 'transparent',
  color: '#C49B1A',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const btnDanger = {
  ...btnBase,
  color: '#FFF7ED',
  background: '#b03030',
  border: '1px solid rgba(176,48,48,0.6)',
};

interface DeleteConfirmModalProps {
  record: FamilyRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteConfirmModal({ record, open, onOpenChange, onDeleted }: DeleteConfirmModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmCode, setConfirmCode] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setConfirmCode("");
      setDeleting(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleConfirmStep1 = useCallback(() => {
    setStep(2);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!record) return;
    if (confirmCode !== record.code) return;

    setDeleting(true);
    try {
      await deleteFamily(record.code);
      toast.success(`"${record.name}" deleted successfully`);
      onDeleted();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }, [record, confirmCode, onDeleted, onOpenChange]);

  if (!open || !record) return null;

  const hasChildren = record.children.length > 0;

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div
        className="glass-warm shadow-cloud"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 400, color: '#1A1008', marginBottom: '1rem' }}>
          Delete Family
        </p>

        {step === 1 && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: '#1A1008', marginBottom: '0.6rem' }}>
                Are you sure you want to delete this family?
              </p>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(176,48,48,0.05)', border: '1px solid rgba(176,48,48,0.12)', borderRadius: '4px' }}>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', fontWeight: 600, color: '#1A1008', marginBottom: '0.2rem' }}>
                  {record.code} — {record.name}
                </p>
                {record.spouse?.name && (
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.55)', margin: 0 }}>
                    Spouse: {record.spouse.name}
                  </p>
                )}
              </div>
              {hasChildren && (
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: '#b03030', marginTop: '0.6rem' }}>
                  This family has {record.children.length} child record(s) linked.
                </p>
              )}
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.42)', marginTop: '0.5rem' }}>
                All photos will also be permanently deleted.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '1rem', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
              <button
                type="button"
                style={btnBase}
                onClick={handleClose}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={btnDanger}
                onClick={handleConfirmStep1}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#8b2020'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#b03030'; }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: '#1A1008', marginBottom: '0.3rem' }}>
                Type the family code to confirm deletion:
              </p>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.92rem', fontWeight: 600, color: '#b03030', marginBottom: '0.75rem' }}>
                {record.code}
              </p>
              <label style={labelStyle}>Enter Code</label>
              <input
                style={inputStyle}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder={record.code}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '1rem', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
              <button
                type="button"
                style={btnBase}
                onClick={handleClose}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  ...btnDanger,
                  opacity: confirmCode === record.code ? 1 : 0.4,
                  cursor: confirmCode === record.code ? 'pointer' : 'not-allowed',
                }}
                disabled={confirmCode !== record.code || deleting}
                onClick={handleDelete}
                onMouseEnter={(e) => { if (confirmCode === record.code) e.currentTarget.style.background = '#8b2020'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#b03030'; }}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
