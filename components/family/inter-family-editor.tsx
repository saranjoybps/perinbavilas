"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { FamilyRecord } from "@/types/family";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addFamily, getFamilies } from "@/lib/api";
import { deleteImage, uploadImage } from "@/services/family/image-service";
import { ChildrenEditor } from "./children-editor";
import { PhotoUpload } from "./photo-upload";

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
  const removedOriginalsRef = useRef<Set<string>>(new Set());
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
    defaultValues: getDefaults(),
  });

  const { reset, watch, setValue, register, handleSubmit, formState: { errors } } = form;

  useEffect(() => {
    if (open) {
      reset(getDefaults());
      setOriginalPhotos([]);
      setActiveTab("basic");
      pendingUploadsRef.current = new Map();
      removedOriginalsRef.current = new Set();
      setSelectedParent1("");
      setSelectedParent2("");
      setSelectedChild1("");
      setSelectedChild2("");
      setLoading(true);
      getFamilies().then(setAllRecords).catch(() => setAllRecords([])).finally(() => setLoading(false));
    }
  }, [open, reset]);

  const handleOpenChange = useCallback((o: boolean) => {
    if (!o) reset();
    onOpenChange?.(o);
  }, [reset, onOpenChange]);

  const handlePendingUpload = useCallback((file: File, previewUrl: string) => {
    pendingUploadsRef.current.set(previewUrl, file);
  }, []);

  const handlePendingRemove = useCallback((url: string) => {
    if (originalPhotos.includes(url)) {
      removedOriginalsRef.current.add(url);
    } else {
      pendingUploadsRef.current.delete(url);
    }
  }, [originalPhotos]);

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
    try {
      setSaving(true);

      for (const photoUrl of removedOriginalsRef.current) {
        try { await deleteImage(photoUrl); } catch {}
      }

      const finalPhotos: string[] = [];
      for (const url of values.photos) {
        const file = pendingUploadsRef.current.get(url);
        if (file) {
          const { url: realUrl } = await uploadImage(values.code, file, []);
          URL.revokeObjectURL(url);
          finalPhotos.push(realUrl);
        } else {
          finalPhotos.push(url);
        }
      }

      const familyData = {
        code: values.code, name: values.name, dob: values.dob, dod: values.dod,
        family_name: values.family_name, address: values.address,
        cell_numbers: values.cell_numbers.filter(Boolean), landline: values.landline,
        email: values.email, occupation: values.occupation, photos: finalPhotos,
        spouse: { name: values.spouseName, dob: values.spouseDob, dod: values.spouseDod },
        children: values.children.map((c) => ({ code: c.code, name: c.name, dob: c.dob ?? null })),
      };
      await addFamily(familyData);
      toast.success("Inter-family marriage record created");
      onSave();
      onOpenChange(false);
    } catch (err: any) {
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
        style={{ width: '100%', maxWidth: '48rem', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem 2rem', borderTop: '2px solid rgba(196,155,26,0.4)' }}
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
                        background: selectedChild1 === child.code ? 'rgba(196,155,26,0.1)' : 'rgba(255,255,255,0.5)',
                        border: selectedChild1 === child.code ? '1px solid rgba(196,155,26,0.5)' : '1px solid rgba(212,175,55,0.15)',
                        borderRadius: '5px', cursor: 'pointer', transition: 'all 0.15s',
                        textAlign: 'left', fontFamily: 'var(--font-inter)',
                      }}
                    >
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: selectedChild1 === child.code ? '#C49B1A' : 'transparent',
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
                        background: selectedChild2 === child.code ? 'rgba(196,155,26,0.1)' : 'rgba(255,255,255,0.5)',
                        border: selectedChild2 === child.code ? '1px solid rgba(196,155,26,0.5)' : '1px solid rgba(212,175,55,0.15)',
                        borderRadius: '5px', cursor: 'pointer', transition: 'all 0.15s',
                        textAlign: 'left', fontFamily: 'var(--font-inter)',
                      }}
                    >
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: selectedChild2 === child.code ? '#C49B1A' : 'transparent',
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
          <div style={{ marginBottom: '1.25rem', padding: '0.6rem 1rem', background: 'rgba(196,155,26,0.06)', border: '1px solid rgba(196,155,26,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'rgba(26,16,8,0.42)' }}>Code:&nbsp;</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 600, color: '#C49B1A' }}>{generatedCode}</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'rgba(26,16,8,0.5)' }}>
              ({child1Data?.name} / {child2Data?.name})
            </span>
          </div>
        )}

        {/* Tabs + form — only after both children selected */}
        {selectionReady && (
          <>
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
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Code</label>
                    <input style={{ ...inputStyle, background: 'rgba(212,175,55,0.08)', cursor: 'default', maxWidth: '14rem' }} value={watch("code")} readOnly />
                    {errors.code && <p style={errorTextStyle}>{errors.code.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input style={inputStyle} {...register("name")} />
                    {errors.name && <p style={errorTextStyle}>{errors.name.message}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input style={inputStyle} value={watch("dob") || ""} onChange={(e) => setValue("dob", e.target.value || null)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Death</label>
                    <input style={inputStyle} value={watch("dod") || ""} onChange={(e) => setValue("dod", e.target.value || null)} />
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
                    <input style={inputStyle} value={watch("spouseDob") || ""} onChange={(e) => setValue("spouseDob", e.target.value || null)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Spouse DOD</label>
                    <input style={inputStyle} value={watch("spouseDod") || ""} onChange={(e) => setValue("spouseDod", e.target.value || null)} />
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
                    value={watch("photos")}
                    onChange={(photos) => setValue("photos", photos)}
                    onPendingUpload={handlePendingUpload}
                    onPendingRemove={handlePendingRemove}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" style={btnBase} onClick={() => handleOpenChange(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,155,26,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }} disabled={saving}
                  onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#b38b17'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#C49B1A'; }}>
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
