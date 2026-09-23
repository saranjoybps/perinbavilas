"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { FamilyRecord } from "@/types/family";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addFamily, getFamilies } from "@/lib/api";
import { deleteFamilyImages, deleteImage, uploadImage } from "@/services/family/image-service";
import { ChildrenEditor } from "./children-editor";
import { PhotoUpload } from "./photo-upload";
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
  border: '1px solid rgba(15, 42, 31,0.22)',
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
  border: '1px solid rgba(15, 42, 31,0.45)',
  background: 'transparent',
  color: '#0F2A1F',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const btnPrimary = {
  ...btnBase,
  color: '#FFF7ED',
  background: '#0F2A1F',
};

const tabStyle = (active: boolean) => ({
  fontFamily: 'var(--font-inter)',
  fontSize: '0.72rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  padding: '0.6rem 1rem',
  background: active ? 'rgba(15, 42, 31,0.08)' : 'transparent',
  color: active ? '#0F2A1F' : 'rgba(26,16,8,0.4)',
  border: 'none',
  borderBottom: active ? '2px solid #0F2A1F' : '2px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

interface ChildOption {
  code: string;
  name: string;
  dob: string | null;
}

interface InterFamilyEditorProps {
  onSave: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InterFamilyEditor({ onSave, open, onOpenChange }: InterFamilyEditorProps) {
  const [saving, setSaving] = useState(false);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const pendingUploadsRef = useRef<Map<string, File>>(new Map());
  const [allRecords, setAllRecords] = useState<FamilyRecord[]>([]);
  const [selectedParent1, setSelectedParent1] = useState<string>("");
  const [selectedParent2, setSelectedParent2] = useState<string>("");
  const [selectedChild1, setSelectedChild1] = useState<string>("");
  const [selectedChild2, setSelectedChild2] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getDefaults = (): FamilyFormValues => ({
    code: "",
    name: "",
    dob: null,
    dod: null,
    family_name: null,
    address: null,
    cell_numbers: [],
    landline: null,
    email: null,
    occupation: null,
    spouseName: "",
    spouseDob: null,
    spouseDod: null,
    children: [],
    photos: [],
  });

  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(familySchema),
    defaultValues: { code: "", name: "", dob: null, dod: null, family_name: null, address: null, cell_numbers: [], landline: null, email: null, occupation: null, spouseName: "", spouseDob: null, spouseDod: null, children: [], photos: [] },
  });

  const { reset, watch, setValue, register, handleSubmit, formState: { errors } } = form;

  const clearPendingPreviews = useCallback(() => {
    for (const previewUrl of pendingUploadsRef.current.keys()) {
      URL.revokeObjectURL(previewUrl);
    }
    pendingUploadsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!open) return;
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
    setActiveTab("basic");
    pendingUploadsRef.current = new Map();
    setSelectedParent1("");
    setSelectedParent2("");
    setSelectedChild1("");
    setSelectedChild2("");
    setLoading(true);
    getFamilies().then(setAllRecords).catch(() => setAllRecords([])).finally(() => setLoading(false));
  }, [open, setValue]);

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

  const parent1Children = useMemo(() => {
    if (!selectedParent1) return [];
    const parent = allRecords.find(r => r.code === selectedParent1);
    return parent?.children ?? [];
  }, [allRecords, selectedParent1]);

  const parent2Children = useMemo(() => {
    if (!selectedParent2) return [];
    const parent = allRecords.find(r => r.code === selectedParent2);
    return parent?.children ?? [];
  }, [allRecords, selectedParent2]);

  const child1Data = useMemo(() => parent1Children.find(c => c.code === selectedChild1), [parent1Children, selectedChild1]);
  const child2Data = useMemo(() => parent2Children.find(c => c.code === selectedChild2), [parent2Children, selectedChild2]);

  const generatedCode = useMemo(() => {
    if (selectedChild1 && selectedChild2) {
      return `${selectedChild1}/${selectedChild2}`;
    }
    return "";
  }, [selectedChild1, selectedChild2]);

  useEffect(() => {
    if (generatedCode) {
      setValue("code", generatedCode);
    }
  }, [generatedCode, setValue]);

  useEffect(() => {
    if (child1Data) {
      setValue("name", child1Data.name);
      setValue("dob", child1Data.dob ?? null);
    }
  }, [child1Data, setValue]);

  useEffect(() => {
    if (child2Data) {
      setValue("spouseName", child2Data.name);
      setValue("spouseDob", child2Data.dob ?? null);
    }
  }, [child2Data, setValue]);

  const onSubmit = async (values: FamilyFormValues) => {
    const originalPhotoSet = new Set(originalPhotos);
    const removedPhotos = originalPhotos.filter((url) => !values.photos.includes(url));
    const uploadedPhotos: string[] = [];
    let databaseUpdated = false;

    try {
      setSaving(true);

      const finalPhotos: string[] = [];
      for (const url of values.photos) {
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

      const spouse = values.spouseName?.trim()
        ? { name: values.spouseName.trim(), dob: values.spouseDob ?? null, dod: values.spouseDod ?? null }
        : null;

      const familyData = {
        code: values.code, name: values.name, dob: values.dob, dod: values.dod,
        family_name: values.family_name, address: values.address,
        cell_numbers: values.cell_numbers.filter(Boolean), landline: values.landline,
        email: values.email, occupation: values.occupation, photos: finalPhotos,
        spouse: spouse || { name: '', dob: null, dod: null },
        spouses: spouse ? [spouse] : [],
        children: values.children.map((c) => ({ code: c.code, name: c.name, dob: c.dob ?? null })),
      };
      await addFamily(familyData);
      databaseUpdated = true;

      await deleteFamilyImages(removedPhotos);

      for (const previewUrl of pendingUploadsRef.current.keys()) {
        URL.revokeObjectURL(previewUrl);
      }
      pendingUploadsRef.current.clear();
      toast.success("Inter-family marriage record created");
      onSave();
      onOpenChange(false);
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

  const parent1Record = allRecords.find(r => r.code === selectedParent1);
  const parent2Record = allRecords.find(r => r.code === selectedParent2);
  const selectionReady = !!selectedChild1 && !!selectedChild2;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,16,8,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={() => handleOpenChange(false)}>
      <div className="glass-warm shadow-cloud"
        style={{ width: '100%', maxWidth: '48rem', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem 2rem', borderTop: '2px solid rgba(15, 42, 31,0.4)' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 400, color: '#1A1008', marginBottom: '0.3rem' }}>
          Inter-Family Marriage
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'rgba(26,16,8,0.45)', marginBottom: '1.25rem' }}>
          Select each parent, then pick their child. The child codes form the marriage code as <strong>Child1/Child2</strong>.
        </p>

        {/* Step 1 + 2: Parent selectors side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Parent 1 */}
          <div>
            <label style={labelStyle}>Family 1 — Parent *</label>
            {loading ? (
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(26,16,8,0.3)' }}>Loading...</div>
            ) : (
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={selectedParent1}
                onChange={(e) => {
                  setSelectedParent1(e.target.value);
                  setSelectedChild1("");
                }}
              >
                <option value="">— Select Parent 1 —</option>
                {allRecords.map((r) => (
                  <option key={r.code} value={r.code} disabled={r.code === selectedParent2}>
                    {r.code} — {r.name}
                  </option>
                ))}
              </select>
            )}

            {selectedParent1 && parent1Children.length > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                <label style={labelStyle}>Select Child from {parent1Record?.name} *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {parent1Children.map((child) => (
                    <button
                      key={child.code}
                      type="button"
                      onClick={() => setSelectedChild1(child.code)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.5rem 0.75rem',
                        background: selectedChild1 === child.code ? 'rgba(15, 42, 31,0.1)' : 'rgba(255,255,255,0.5)',
                        border: selectedChild1 === child.code ? '1px solid rgba(15, 42, 31,0.5)' : '1px solid rgba(15, 42, 31,0.15)',
                        borderRadius: '5px', cursor: 'pointer', transition: 'all 0.15s',
                        textAlign: 'left', fontFamily: 'var(--font-inter)',
                      }}
                    >
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: selectedChild1 === child.code ? '#0F2A1F' : 'transparent',
                      }}>
                        {selectedChild1 === child.code && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                        )}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#1A1008', fontWeight: selectedChild1 === child.code ? 600 : 400 }}>
                        {child.code} — {child.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedParent1 && parent1Children.length === 0 && (
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.35)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                No children found for this parent.
              </p>
            )}
          </div>

          {/* Parent 2 */}
          <div>
            <label style={labelStyle}>Family 2 — Parent *</label>
            {loading ? (
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(26,16,8,0.3)' }}>Loading...</div>
            ) : (
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={selectedParent2}
                onChange={(e) => {
                  setSelectedParent2(e.target.value);
                  setSelectedChild2("");
                }}
              >
                <option value="">— Select Parent 2 —</option>
                {allRecords.map((r) => (
                  <option key={r.code} value={r.code} disabled={r.code === selectedParent1}>
                    {r.code} — {r.name}
                  </option>
                ))}
              </select>
            )}

            {selectedParent2 && parent2Children.length > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                <label style={labelStyle}>Select Child from {parent2Record?.name} *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {parent2Children.map((child) => (
                    <button
                      key={child.code}
                      type="button"
                      onClick={() => setSelectedChild2(child.code)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.5rem 0.75rem',
                        background: selectedChild2 === child.code ? 'rgba(15, 42, 31,0.1)' : 'rgba(255,255,255,0.5)',
                        border: selectedChild2 === child.code ? '1px solid rgba(15, 42, 31,0.5)' : '1px solid rgba(15, 42, 31,0.15)',
                        borderRadius: '5px', cursor: 'pointer', transition: 'all 0.15s',
                        textAlign: 'left', fontFamily: 'var(--font-inter)',
                      }}
                    >
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: selectedChild2 === child.code ? '#0F2A1F' : 'transparent',
                      }}>
                        {selectedChild2 === child.code && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                        )}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#1A1008', fontWeight: selectedChild2 === child.code ? 600 : 400 }}>
                        {child.code} — {child.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedParent2 && parent2Children.length === 0 && (
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.35)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                No children found for this parent.
              </p>
            )}
          </div>
        </div>

        {/* Generated code preview */}
        {selectionReady && (
          <div style={{ marginBottom: '1.25rem', padding: '0.6rem 1rem', background: 'rgba(15, 42, 31,0.06)', border: '1px solid rgba(15, 42, 31,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'rgba(26,16,8,0.42)' }}>Code:&nbsp;</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 600, color: '#0F2A1F' }}>{generatedCode}</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'rgba(26,16,8,0.5)' }}>
              ({child1Data?.name} / {child2Data?.name})
            </span>
          </div>
        )}

        {/* Tabs + form — only after both children selected */}
        {selectionReady && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', borderBottom: '1px solid rgba(15, 42, 31,0.18)', marginBottom: '1.25rem' }}>
              {(['basic', 'spouse', 'children', 'photos'] as const).map((tab) => (
                <button key={tab} style={tabStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                  {tab === 'basic' ? 'Basic Info' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Code</label>
                    <input style={{ ...inputStyle, background: 'rgba(15, 42, 31,0.08)', cursor: 'default', maxWidth: '14rem' }} value={watch("code")} readOnly />
                    {errors.code && <p style={errorTextStyle}>{errors.code.message}</p>}
                  </div>
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
                    <input style={inputStyle} value={watch("address") || ""} onChange={(e) => setValue("address", e.target.value || null)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Cell Numbers (comma-separated)</label>
                    <input style={inputStyle} value={watch("cell_numbers").join(", ")} onChange={(e) => setValue("cell_numbers", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Spouse Name</label>
                    <input style={inputStyle} value={watch("spouseName")} onChange={(e) => setValue("spouseName", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Spouse DOB</label>
                    <DatePicker value={watch("spouseDob")} onChange={(v) => setValue("spouseDob", v)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Spouse DOD</label>
                    <DatePicker value={watch("spouseDod")} onChange={(v) => setValue("spouseDod", v)} />
                  </div>
                </div>
              )}

              {activeTab === 'children' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <ChildrenEditor
                    children={watch("children").map(c => ({ ...c, dob: c.dob ?? null }))}
                    onChange={(children) => setValue("children", children)}
                    parentCode={watch("code")}
                  />
                </div>
              )}

              {activeTab === 'photos' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <PhotoUpload
                    photos={watch("photos")}
                    familyCode={watch("code")}
                    onChange={(photos) => setValue("photos", photos)}
                    onPendingUpload={handlePendingUpload}
                    onPendingRemove={handlePendingRemove}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" style={btnBase} onClick={() => handleOpenChange(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15, 42, 31,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }} disabled={saving}
                  onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#0A1C14'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0F2A1F'; }}>
                  {saving ? "Saving..." : "Create Marriage Record"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
