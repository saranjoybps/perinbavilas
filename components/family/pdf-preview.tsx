"use client";

import { useState, useCallback } from "react";
import { FamilyRecord } from "@/types/family";
import { generateFamilyDirectoryPDF } from "@/services/family/pdf-service";

interface PdfPreviewProps {
  records: FamilyRecord[];
  children?: React.ReactNode;
}

const btnBase = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  padding: '0.45rem 1rem',
  border: '1px solid rgba(196,155,26,0.35)',
  background: 'transparent',
  color: '#C49B1A',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export function PdfPreview({ records, children }: PdfPreviewProps) {
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [zoom, setZoom] = useState(100);

  const generatePdf = useCallback(async () => {
    try {
      setGenerating(true);
      const pdfBytes = await generateFamilyDirectoryPDF(records);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setOpen(true);
    } catch (err: any) {
      alert(err.message || "PDF generation failed");
    } finally {
      setGenerating(false);
    }
  }, [records]);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  }, [pdfUrl]);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "family-directory.pdf";
    a.click();
  }, [pdfUrl]);

  const handlePrint = useCallback(() => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank")?.print();
  }, [pdfUrl]);

  return (
    <>
      <div onClick={generating ? undefined : generatePdf} style={{ opacity: generating ? 0.6 : 1, cursor: generating ? 'wait' : 'pointer' }}>
        {children || (
          <button style={btnBase} disabled={generating}>
            {generating ? 'Generating...' : 'Preview PDF'}
          </button>
        )}
      </div>

      {generating && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,16,8,0.35)', backdropFilter: 'blur(2px)' }}>
          <div className="glass-warm shadow-cloud"
            style={{ padding: '2rem 3rem', textAlign: 'center', borderTop: '2px solid rgba(196,155,26,0.4)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(196,155,26,0.2)', borderTopColor: '#C49B1A', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 400, color: '#1A1008', marginBottom: '0.4rem' }}>
              Generating PDF
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.42)' }}>
              Preparing {records.length} families...
            </p>
          </div>
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', background: 'rgba(26,16,8,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={handleClose}>
          <div className="glass-warm shadow-cloud"
            style={{ width: '95vw', maxWidth: '72rem', height: '90vh', margin: '5vh auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '2px solid rgba(196,155,26,0.4)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem 1rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 400, color: '#1A1008' }}>PDF Preview — Family Directory</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                <button style={btnBase} onClick={() => setZoom(Math.max(50, zoom - 25))}>−</button>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.45)', minWidth: '2.5rem', textAlign: 'center' }}>{zoom}%</span>
                <button style={btnBase} onClick={() => setZoom(Math.min(200, zoom + 25))}>+</button>
                <button style={btnBase} onClick={handlePrint}>Print</button>
                <button style={{ ...btnBase, color: '#FFF7ED', background: '#C49B1A' }} onClick={handleDownload}>Download</button>
                <button style={{ ...btnBase, marginLeft: '0.5rem', border: '1px solid rgba(176,48,48,0.3)', color: '#b03030' }}
                  onClick={handleClose}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#b03030'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b03030'; }}
                >Close</button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#f0f0f0', overflow: 'hidden' }}>
              {pdfUrl && (
                <iframe
                  src={`${pdfUrl}#zoom=${zoom / 100}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
