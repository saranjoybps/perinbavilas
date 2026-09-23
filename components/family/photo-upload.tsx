"use client";

import { useCallback, useRef } from "react";

export const MAX_PHOTOS = 2;

interface PhotoUploadProps {
  photos: string[];
  familyCode: string;
  onChange: (photos: string[]) => void;
  onPendingUpload: (file: File, previewUrl: string) => void;
  onPendingRemove: (url: string) => void;
}

export function PhotoUpload({ photos, familyCode, onChange, onPendingUpload, onPendingRemove }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (photos.length >= MAX_PHOTOS) { alert(`Maximum ${MAX_PHOTOS} photos allowed`); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { alert('Only JPG, PNG, WebP allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
    const previewUrl = URL.createObjectURL(file);
    onPendingUpload(file, previewUrl);
    onChange([...photos, previewUrl]);
  }, [photos, onChange, onPendingUpload]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await processFile(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [processFile]);

  const handleDelete = useCallback((index: number) => {
    const url = photos[index];
    onPendingRemove(url);
    onChange(photos.filter((_, i) => i !== index));
  }, [photos, onChange, onPendingRemove]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await processFile(file);
  }, [processFile]);

  return (
    <div>
      <div
        style={{
          border: '2px dashed rgba(15, 42, 31,0.35)',
          borderRadius: '4px',
          padding: '2rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'transparent',
          transition: 'background 0.2s',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15, 42, 31,0.04)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'rgba(26,16,8,0.4)', marginBottom: '0.3rem' }}>
          Drop images here or click to browse
        </div>
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'rgba(26,16,8,0.3)' }}>
          JPG, PNG, WebP up to 5MB (max {MAX_PHOTOS} photos)
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileSelect} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1', borderRadius: '4px', border: '1px solid rgba(15, 42, 31,0.15)', background: 'rgba(255,255,255,0.5)', position: 'relative', overflow: 'hidden' }}>
            {photos[i] ? (
              <>
                <img src={photos[i]} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', background: '#b03030', color: '#fff', border: 'none', borderRadius: '50%', width: '1.25rem', height: '1.25rem', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8, transition: 'opacity 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                >✕</button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(26,16,8,0.2)' }}>
                ▣
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
