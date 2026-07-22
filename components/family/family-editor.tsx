"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { FamilyRecord, FamilyMember } from "@/types/family";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addFamily, updateFamily, getFamilies } from "@/lib/api";
import { deleteImage, uploadImage } from "@/services/family/image-service";
import { ChildrenEditor } from "./children-editor";
import { MAX_PHOTOS, PhotoUpload } from "./photo-upload";
import { DatePicker } from "./date-picker";

const familySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  dob: z.string().nullable(),
  dod: z.string().nullable(),
  family_name: z.string().nullable(),
  address: z.string().nullable(),
  cell_numbers: z.array(z.string()),
  landline: z.string().nullable(),
  email: z.string().nullable(),
  occupation: z.string().nullable(),
  spouseName: z.string(),
  spouseDob: z.string().nullable(),
  spouseDod: z.string().nullable(),
  children: z.array(z.object({
    code: z.string().min(1, "Child code is required"),
    name: z.string().min(1, "Child name is required"),
    dob: z.string().nullable(),
  })),
  photos: z.array(z.string()),
}).refine((data) => new Set(data.children.map(c => c.code)).size === data.children.length, {
  message: "Duplicate child codes", path: ["children"],
});

type FamilyFormValues = z.infer<typeof familySchema>;

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(212,175,55,0.22)',
  padding: '0.65rem 0.8rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  color: '#1A1008',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
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

const errorTextStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.68rem',
  color: '#b03030',
  marginTop: '0.2rem',
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

const btnPrimary = {
  ...btnBase,
  color: '#FFF7ED',
  background: '#C49B1A',
};

const tabStyle = (active: boolean) => ({
  fontFamily: 'var(--font-inter)',
  fontSize: '0.72rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  padding: '0.65rem 1.5rem',
  background: active ? 'rgba(196,155,26,0.08)' : 'transparent',
  color: active ? '#C49B1A' : 'rgba(26,16,8,0.4)',
  border: 'none',
  borderBottom: active ? '2px solid #C49B1A' : '2px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

interface FamilyEditorProps {
  record?: FamilyRecord;
  onSave: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FamilyEditor({ record, onSave, open, onOpenChange }: FamilyEditorProps) {
  const [saving, setSaving] = useState(false);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const pendingUploadsRef = useRef<Map<string, File>>(new Map());
  const [parentCode, setParentCode] = useState<string>("");
  const [allRecords, setAllRecords] = useState<FamilyRecord[]>([]);
  const [selectedChildCode, setSelectedChildCode] = useState<string>("");

  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(familySchema),
    defaultValues: { code: "", name: "", dob: null, dod: null, family_name: null, address: null, cell_numbers: [], landline: null, email: null, occupation: null, spouseName: "", spouseDob: null, spouseDod: null, children: [], photos: [] },
  });

  const { reset, watch, setValue, register, handleSubmit, formState: { errors } } = form;
  const isEditing = !!record;

  const clearPendingPreviews = useCallback(() => {
    for (const previewUrl of pendingUploadsRef.current.keys()) {
      URL.revokeObjectURL(previewUrl);
    }
    pendingUploadsRef.current.clear();
  }, []);

  const normalizePhotos = useCallback((photos: string[] = []) => {
    const seen = new Set<string>();
    return photos.filter((photo): photo is string => {
      if (typeof photo !== "string" || photo.length === 0 || seen.has(photo)) {
        return false;
      }
      seen.add(photo);
      return true;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    if (record) {
      clearPendingPreviews();
      setValue("code", record.code);
      setValue("name", record.name);
      setValue("dob", record.dob ?? null);
      setValue("dod", record.dod ?? null);
      setValue("family_name", record.family_name ?? null);
      setValue("address", record.address ?? null);
      setValue("cell_numbers", record.cell_numbers ?? []);
      setValue("landline", record.landline ?? null);
      setValue("email", record.email ?? null);
      setValue("occupation", record.occupation ?? null);
      setValue("spouseName", record.spouse?.name ?? "");
      setValue("spouseDob", record.spouse?.dob ?? null);
      setValue("spouseDod", record.spouse?.dod ?? null);
      setValue("children", record.children ?? []);
      const photos = normalizePhotos(record.photos ?? []);
      setValue("photos", photos);
      setOriginalPhotos(photos);
    } else {
      clearPendingPreviews();
      setValue("code", "");
      setValue("name", "");
      setValue("dob", null);
      setValue("dod", null);
      setValue("family_name", null);
      setValue("address", null);
      setValue("cell_numbers", []);
      setValue("landline", null);
      setValue("email", null);
      setValue("occupation", null);
      setValue("spouseName", "");
      setValue("spouseDob", null);
      setValue("spouseDod", null);
      setValue("children", []);
      setValue("photos", []);
      setOriginalPhotos([]);
    }
    setActiveTab("basic");
    setParentCode("");
    if (!record) {
      getFamilies().then(setAllRecords).catch(() => setAllRecords([]));
    }
  }, [clearPendingPreviews, normalizePhotos, open, record, setValue]);

  const handleOpenChange = useCallback((o: boolean) => {
    if (!o) {
      clearPendingPreviews();
      reset();
    }
    onOpenChange?.(o);
  }, [clearPendingPreviews, reset, onOpenChange]);

  const handlePendingUpload = useCallback((file: File, previewUrl: string) => {
    pendingUploadsRef.current.set(previewUrl, file);
  }, []);

  const handlePendingRemove = useCallback((url: string) => {
    const file = pendingUploadsRef.current.get(url);
    if (file) {
      pendingUploadsRef.current.delete(url);
      URL.revokeObjectURL(url);
    }
  }, []);

  const childrenOfParent = useMemo(() => {
    if (!parentCode) return [];
    const parent = allRecords.find(r => r.code === parentCode);
    return parent?.children ?? [];
  }, [parentCode, allRecords]);

  const handleParentChange = useCallback((newParentCode: string) => {
    setParentCode(newParentCode);
    setSelectedChildCode("");
    setValue("code", "");
  }, [setValue]);

  const handleChildSelect = useCallback((childCode: string) => {
    const child = childrenOfParent.find((c) => c.code === childCode);
    setSelectedChildCode(childCode);
    setValue("code", childCode);
    if (child) {
      setValue("name", child.name);
      setValue("dob", child.dob ?? null);
    }
  }, [childrenOfParent, setValue]);

  const onSubmit = async (values: FamilyFormValues) => {
    if (saving) return;

    const selectedPhotos = normalizePhotos(values.photos);
    const originalPhotoSet = new Set(originalPhotos);
    const removedPhotos = originalPhotos.filter((url) => !selectedPhotos.includes(url));
    const uploadedPhotos: string[] = [];
    let familyData: FamilyMember | null = null;
    let databaseUpdated = false;
    let updatedCode = record?.code ?? values.code;
    let successMessage = "";

    if (selectedPhotos.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    try {
      setSaving(true);

      const finalPhotos: string[] = [];
      for (const url of selectedPhotos) {
        const file = pendingUploadsRef.current.get(url);
        if (file) {
          const { url: realUrl } = await uploadImage(values.code, file, finalPhotos);
          uploadedPhotos.push(realUrl);
          finalPhotos.push(realUrl);
        } else if (originalPhotoSet.has(url)) {
          finalPhotos.push(url);
        } else {
          throw new Error("An image selection is no longer available. Please select it again.");
        }
      }

      familyData = {
        code: values.code, name: values.name, dob: values.dob, dod: values.dod,
        family_name: values.family_name, address: values.address,
        cell_numbers: values.cell_numbers.filter(Boolean), landline: values.landline,
        email: values.email, occupation: values.occupation, photos: finalPhotos,
        spouse: { name: values.spouseName, dob: values.spouseDob, dod: values.spouseDod },
        children: values.children.map((c) => ({ code: c.code, name: c.name, dob: c.dob ?? null })),
      };
      if (isEditing && record) {
        await updateFamily(record.code, familyData);
        updatedCode = values.code;
        successMessage = "Family updated successfully";
      } else {
        await addFamily(familyData);
        updatedCode = values.code;
        successMessage = "Family created successfully";
      }
      databaseUpdated = true;

      const failedRemovals: string[] = [];
      for (const photoUrl of removedPhotos) {
        try {
          await deleteImage(photoUrl);
        } catch {
          failedRemovals.push(photoUrl);
        }
      }

      if (failedRemovals.length > 0) {
        const reconciledPhotos = [...finalPhotos, ...failedRemovals.filter((url) => !finalPhotos.includes(url))];
        await updateFamily(updatedCode, { ...familyData, photos: reconciledPhotos });
        throw new Error(`Family saved, but ${failedRemovals.length} removed image${failedRemovals.length === 1 ? '' : 's'} could not be deleted from Cloudinary and were kept on the record.`);
      }

      for (const previewUrl of pendingUploadsRef.current.keys()) {
        URL.revokeObjectURL(previewUrl);
      }
      pendingUploadsRef.current.clear();
      toast.success(successMessage);
      onSave();
      onOpenChange?.(false);
    } catch (err: any) {
      if (!databaseUpdated) {
        for (const photoUrl of uploadedPhotos) {
          try { await deleteImage(photoUrl); } catch {}
        }
      }
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,16,8,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={() => handleOpenChange(false)}>
      <div className="glass-warm shadow-cloud"
        style={{ width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem 2rem', borderTop: '2px solid rgba(196,155,26,0.4)' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 400, color: '#1A1008', marginBottom: '1.25rem' }}>
          {isEditing ? `Edit: ${record?.name}` : 'Add New Family'}
        </p>

        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(212,175,55,0.18)', marginBottom: '1.25rem' }}>
          {(['basic', 'spouse', 'children', 'photos'] as const).map((tab) => (
            <button key={tab} style={tabStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>
              {tab === 'basic' ? 'Basic Info' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {activeTab === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
              {!isEditing ? (
                <>
                  <div>
                    <label style={labelStyle}>Parent Family *</label>
                    <select
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      value={parentCode}
                      onChange={(e) => handleParentChange(e.target.value)}
                    >
                      <option value="">— Select Parent —</option>
                      {allRecords.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.code} — {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {parentCode && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Select Child Code *</label>
                      {childrenOfParent.length === 0 ? (
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(26,16,8,0.4)', fontStyle: 'italic' }}>
                          No children found for this parent.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {childrenOfParent.map((child) => (
                            <button
                              key={child.code}
                              type="button"
                              onClick={() => handleChildSelect(child.code)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.55rem 0.75rem',
                                background: selectedChildCode === child.code ? 'rgba(196,155,26,0.1)' : 'rgba(255,255,255,0.5)',
                                border: selectedChildCode === child.code ? '1px solid rgba(196,155,26,0.5)' : '1px solid rgba(212,175,55,0.15)',
                                borderRadius: '5px', cursor: 'pointer', transition: 'all 0.15s',
                                textAlign: 'left', fontFamily: 'var(--font-inter)',
                              }}
                            >
                              <span style={{
                                width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                background: selectedChildCode === child.code ? '#C49B1A' : 'transparent',
                              }}>
                                {selectedChildCode === child.code && (
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                                )}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: '#1A1008', fontWeight: selectedChildCode === child.code ? 600 : 400 }}>
                                <strong>{child.code}</strong> — {child.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.code && <p style={errorTextStyle}>{errors.code.message}</p>}
                    </div>
                  )}
                  {selectedChildCode && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Family Code</label>
                      <input
                        style={{ ...inputStyle, background: 'rgba(212,175,55,0.08)', cursor: 'default', maxWidth: '14rem' }}
                        value={watch("code") || ""}
                        readOnly
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label style={labelStyle}>Family Code *</label>
                  <input style={inputStyle} value={watch("code") || ""} onChange={(e) => setValue("code", e.target.value)} />
                  {errors.code && <p style={errorTextStyle}>{errors.code.message}</p>}
                </div>
              )}
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} {...register("name")} />
                {errors.name && <p style={errorTextStyle}>{errors.name.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <DatePicker value={watch("dob")} onChange={(v) => setValue("dob", v)} />
              </div>
              <div>
                <label style={labelStyle}>Date of Death</label>
                <DatePicker value={watch("dod")} onChange={(v) => setValue("dod", v)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Family Name</label>
                <input style={inputStyle} value={watch("family_name") || ""} onChange={(e) => setValue("family_name", e.target.value || null)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address</label>
                <textarea style={{ ...inputStyle, minHeight: '3.5rem', resize: 'vertical' }} value={watch("address") || ""} onChange={(e) => setValue("address", e.target.value || null)} />
              </div>
              <div>
                <label style={labelStyle}>Phone Numbers (comma separated)</label>
                <input style={inputStyle} value={watch("cell_numbers")?.join(", ") || ""} onChange={(e) => setValue("cell_numbers", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
              </div>
              <div>
                <label style={labelStyle}>Landline</label>
                <input style={inputStyle} value={watch("landline") || ""} onChange={(e) => setValue("landline", e.target.value || null)} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} value={watch("email") || ""} onChange={(e) => setValue("email", e.target.value || null)} />
              </div>
              <div>
                <label style={labelStyle}>Occupation</label>
                <input style={inputStyle} value={watch("occupation") || ""} onChange={(e) => setValue("occupation", e.target.value || null)} />
              </div>
            </div>
          )}

          {activeTab === 'spouse' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Spouse Name</label>
                <input style={inputStyle} {...register("spouseName")} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={labelStyle}>Spouse DOB</label>
                    <DatePicker value={watch("spouseDob")} onChange={(v) => setValue("spouseDob", v)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Spouse DOD</label>
                    <DatePicker value={watch("spouseDod")} onChange={(v) => setValue("spouseDod", v)} />
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'children' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <ChildrenEditor children={watch("children").map(c => ({ ...c, dob: c.dob ?? null }))} onChange={(c) => setValue("children", c)} parentCode={watch("code")} />
            </div>
          )}

          {activeTab === 'photos' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <PhotoUpload photos={watch("photos")} familyCode={watch("code")} onChange={(p) => setValue("photos", p)} onPendingUpload={handlePendingUpload} onPendingRemove={handlePendingRemove} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '1rem', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
            <button type="button" style={btnBase}
              onClick={() => handleOpenChange(false)}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; }}
            >Cancel</button>
            <button type="submit" style={{ ...btnPrimary, opacity: saving ? 0.55 : 1, cursor: saving ? 'default' : 'pointer' }} disabled={saving}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#b38b17'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#C49B1A'; }}
            >{saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
