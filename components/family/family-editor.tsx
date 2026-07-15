"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FamilyRecord, FamilyMember } from "@/types/family";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addFamily, updateFamily, getFamilyNextCode, getFamilies } from "@/lib/api";
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
  const removedOriginalsRef = useRef<Set<string>>(new Set());
  const [parentCode, setParentCode] = useState<string>("");
  const [allRecords, setAllRecords] = useState<FamilyRecord[]>([]);
  const [generatingCode, setGeneratingCode] = useState(false);

  const getDefaults = (r?: FamilyRecord): FamilyFormValues => ({
    code: r?.code || "",
    name: r?.name || "",
    dob: r?.dob || null,
    dod: r?.dod || null,
    family_name: r?.family_name || null,
    address: r?.address || null,
    cell_numbers: r?.cell_numbers || [],
    landline: r?.landline || null,
    email: r?.email || null,
    occupation: r?.occupation || null,
    spouseName: r?.spouse?.name || "",
    spouseDob: r?.spouse?.dob || null,
    spouseDod: r?.spouse?.dod || null,
    children: r?.children || [],
    photos: r?.photos || [],
  });

  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(familySchema),
    defaultValues: getDefaults(record),
  });

  const { reset, watch, setValue, register, handleSubmit, formState: { errors } } = form;
  const isEditing = !!record;

  useEffect(() => {
    if (open) {
      const defaults = getDefaults(record);
      reset(defaults);
      setOriginalPhotos(defaults.photos);
      setActiveTab("basic");
      pendingUploadsRef.current = new Map();
      removedOriginalsRef.current = new Set();
      setParentCode("");
      if (!record) {
        getFamilies().then(setAllRecords).catch(() => setAllRecords([]));
      }
    }
  }, [open, record, reset]);

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

  const handleParentChange = useCallback(async (newParentCode: string) => {
    setParentCode(newParentCode);
    if (newParentCode) {
      setGeneratingCode(true);
      try {
        const { code: nextCode } = await getFamilyNextCode(newParentCode);
        setValue("code", nextCode);
      } catch {
        toast.error("Failed to generate code");
      } finally {
        setGeneratingCode(false);
      }
    } else {
      setValue("code", "");
    }
  }, [setValue]);

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

      const familyData: FamilyMember = {
        code: values.code, name: values.name, dob: values.dob, dod: values.dod,
        family_name: values.family_name, address: values.address,
        cell_numbers: values.cell_numbers.filter(Boolean), landline: values.landline,
        email: values.email, occupation: values.occupation, photos: finalPhotos,
        spouse: { name: values.spouseName, dob: values.spouseDob, dod: values.spouseDod },
        children: values.children.map((c) => ({ code: c.code, name: c.name, dob: c.dob ?? null })),
      };
      if (isEditing && record) {
        await updateFamily(record.code, familyData);
        toast.success("Family updated successfully");
      } else {
        await addFamily(familyData);
        toast.success("Family created successfully");
      }
      onSave();
      onOpenChange?.(false);
    } catch (err: any) {
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
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Auto-Generated Code</label>
                    <input
                      style={{ ...inputStyle, background: 'rgba(212,175,55,0.08)', cursor: 'default', maxWidth: '14rem' }}
                      value={watch("code") || ""}
                      readOnly
                      placeholder={generatingCode ? "Generating..." : "Select parent first"}
                    />
                    {errors.code && <p style={errorTextStyle}>{errors.code.message}</p>}
                  </div>
                </>
              ) : (
                <div>
                  <label style={labelStyle}>Family Code *</label>
                  <input style={{ ...inputStyle, background: 'rgba(212,175,55,0.08)', cursor: 'default' }} value={watch("code")} readOnly />
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
                  <input style={inputStyle} value={watch("spouseDob") || ""} onChange={(e) => setValue("spouseDob", e.target.value || null)} />
                </div>
                <div>
                  <label style={labelStyle}>Spouse DOD</label>
                  <input style={inputStyle} value={watch("spouseDod") || ""} onChange={(e) => setValue("spouseDod", e.target.value || null)} />
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
            <button type="submit" style={btnPrimary}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#b38b17'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#C49B1A'; }}
            >{saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
