"use client";

import { useState, useCallback } from "react";
import { FamilyRecord } from "@/types/family";
import { generateFamilyDirectoryPDF } from "@/services/family/pdf-service";
import {
  EXPORT_ROOT_CODES,
  ExportRootCode,
  collectSubtreeByRoot,
} from "@/lib/family-utils";

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
  border: '1px solid rgba(15, 42, 31,0.35)',
  background: 'transparent',
  color: '#0F2A1F',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const rootBtn = (selected: boolean) => ({
  fontFamily: 'var(--font-inter)' as const,
  fontSize: '0.95rem',
  fontWeight: 500 as const,
  width: 48,
  height: 48,
  border: selected ? '2px solid #0F2A1F' : '1px solid rgba(15, 42, 31,0.22)',
  background: selected ? '#0F2A1F' : '#fff',
  color: selected ? '#F7FAF8' : '#0F2A1F',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export function PdfPreview({ records, children }: PdfPreviewProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedRoot, setSelectedRoot] = useState<ExportRootCode>("0");
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [zoom, setZoom] = useState(100);

  const openPicker = useCallback(() => {
    if (generating) return;
    setPickerOpen(true);
  }, [generating]);

  const generatePdf = useCallback(async () => {
    const subtree = collectSubtreeByRoot(records, selectedRoot);
    if (!subtree.length) {
      alert(`No family records found under root code ${selectedRoot}.`);
      return;
    }

    try {
      setPickerOpen(false);
      setGenerating(true);
      setExportCount(subtree.length);
      const title =
        selectedRoot === "0"
          ? "Family Directory — Root 0 (Full Tree)"
          : `Family Directory — Branch ${selectedRoot}`;
      const pdfBytes = await generateFamilyDirectoryPDF(subtree, title);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setOpen(true);
    } catch (err: any) {
      alert(err.message || "PDF generation failed");
    } finally {
      setGenerating(false);
    }
  }, [records, selectedRoot]);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  }, [pdfUrl]);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `family-directory-root-${selectedRoot}.pdf`;
    a.click();
  }, [pdfUrl, selectedRoot]);

  const handlePrint = useCallback(() => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank")?.print();
  }, [pdfUrl]);

  const previewCount = collectSubtreeByRoot(records, selectedRoot).length;

  return (
    <>
      <div
        onClick={openPicker}
        style={{ opacity: generating ? 0.6 : 1, cursor: generating ? "wait" : "pointer" }}
      >
        {children || (
          <button style={btnBase} disabled={generating} type="button">
            {generating ? "Generating..." : "Export PDF"}
          </button>
        )}
      </div>

      {pickerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 42, 31,0.35)",
            backdropFilter: "blur(2px)",
            padding: "1rem",
          }}
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="glass-warm shadow-cloud"
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "1.75rem 1.5rem",
              borderTop: "2px solid rgba(15, 42, 31,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.65rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(15, 42, 31,0.55)",
                marginBottom: "0.35rem",
              }}
            >
              Export PDF
            </p>
            <h2
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "1.45rem",
                fontWeight: 400,
                color: "#0F2A1F",
                marginBottom: "0.5rem",
              }}
            >
              Select family root
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.8rem",
                color: "rgba(15, 42, 31,0.55)",
                lineHeight: 1.55,
                marginBottom: "1.25rem",
              }}
            >
              Choose a root code. The PDF will include that root and its complete
              hierarchy
              {selectedRoot === "0" ? " (ancestor 0 plus branches 1–7)" : ` under branch ${selectedRoot}`}.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "0.55rem",
                marginBottom: "1.25rem",
              }}
            >
              {EXPORT_ROOT_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  style={rootBtn(selectedRoot === code)}
                  onClick={() => setSelectedRoot(code)}
                  aria-pressed={selectedRoot === code}
                >
                  {code}
                </button>
              ))}
            </div>

            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.72rem",
                color: "rgba(15, 42, 31,0.45)",
                marginBottom: "1.25rem",
              }}
            >
              Selected root <strong style={{ color: "#0F2A1F" }}>{selectedRoot}</strong>
              {" — "}
              {previewCount} famil{previewCount === 1 ? "y" : "ies"} will be exported
            </p>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                style={btnBase}
                onClick={() => setPickerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ ...btnBase, color: "#FFF7ED", background: "#0F2A1F", borderColor: "#0F2A1F" }}
                onClick={generatePdf}
                disabled={previewCount === 0}
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {generating && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 42, 31,0.35)', backdropFilter: 'blur(2px)' }}>
          <div className="glass-warm shadow-cloud"
            style={{ padding: '2rem 3rem', textAlign: 'center', borderTop: '2px solid rgba(15, 42, 31,0.4)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 400, color: '#0F2A1F', marginBottom: '0.4rem' }}>
              Generating PDF
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(15, 42, 31,0.45)' }}>
              Root {selectedRoot} — preparing {exportCount} families...
            </p>
          </div>
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', background: 'rgba(15, 42, 31,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={handleClose}>
          <div className="glass-warm shadow-cloud"
            style={{ width: '95vw', maxWidth: '72rem', height: '90vh', margin: '5vh auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '2px solid rgba(15, 42, 31,0.4)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem 1rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(15, 42, 31,0.15)' }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 400, color: '#0F2A1F' }}>
                PDF Preview — Root {selectedRoot}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                <button style={btnBase} onClick={() => setZoom(Math.max(50, zoom - 25))}>−</button>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(15, 42, 31,0.45)', minWidth: '2.5rem', textAlign: 'center' }}>{zoom}%</span>
                <button style={btnBase} onClick={() => setZoom(Math.min(200, zoom + 25))}>+</button>
                <button style={btnBase} onClick={handlePrint}>Print</button>
                <button style={{ ...btnBase, color: '#FFF7ED', background: '#0F2A1F' }} onClick={handleDownload}>Download</button>
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
