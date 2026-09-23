"use client";

import { Child } from "@/types/family";
import { useState } from "react";
import type { CSSProperties } from "react";
import { DatePicker } from "./date-picker";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(15, 42, 31,0.22)',
  padding: '0.4rem 0.55rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.75rem',
  color: '#1A1008',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const thStyle: CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(26,16,8,0.42)',
  padding: '0.5rem 0.6rem',
  textAlign: 'left',
  fontWeight: 500,
};

const tdStyle = {
  padding: '0.4rem 0.6rem',
};

const btnOutline = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.68rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  padding: '0.45rem 1rem',
  border: '1px solid rgba(15, 42, 31,0.35)',
  background: 'transparent',
  color: '#0F2A1F',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

function SortableRow({ child, index, onUpdate, onDelete }: { child: Child; index: number; onUpdate: (i: number, c: Child) => void; onDelete: (i: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: child.code });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <tr ref={setNodeRef} style={{ ...style, borderBottom: '1px solid rgba(15, 42, 31,0.08)' }}>
      <td style={{ ...tdStyle, width: '2rem' }}>
        <button {...attributes} {...listeners} style={{ cursor: 'grab', background: 'none', border: 'none', color: 'rgba(26,16,8,0.35)', fontSize: '0.85rem' }}>⋮⋮</button>
      </td>
      <td style={tdStyle}>
        <input style={inputStyle} value={child.code} onChange={(e) => onUpdate(index, { ...child, code: e.target.value })} placeholder="Code" />
      </td>
      <td style={tdStyle}>
        <input style={inputStyle} value={child.name} onChange={(e) => onUpdate(index, { ...child, name: e.target.value })} placeholder="Name" />
      </td>
      <td style={tdStyle}>
        <DatePicker value={child.dob} onChange={(v) => onUpdate(index, { ...child, dob: v })} />
      </td>
      <td style={{ ...tdStyle, width: '2.5rem' }}>
        <button
          style={{ background: 'none', border: 'none', color: '#b03030', cursor: 'pointer', fontSize: '0.85rem', transition: 'opacity 0.2s' }}
          onClick={() => onDelete(index)}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >✕</button>
      </td>
    </tr>
  );
}

interface ChildrenEditorProps {
  children: Child[];
  onChange: (children: Child[]) => void;
  parentCode?: string;
}

function generateChildCode(parentCode: string, existingChildren: Child[]): string {
  if (parentCode.includes('/')) {
    const [left, right] = parentCode.split('/');
    const existingNums = existingChildren.map(c => {
      if (!c.code.includes('/')) return 0;
      const [cl] = c.code.split('/');
      const num = parseInt(cl.slice(left.length), 10);
      return isNaN(num) ? 0 : num;
    });
    const next = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `${left}${next}/${right}${next}`;
  }
  const existingNums = existingChildren.map(c => {
    if (c.code.includes('/')) return 0;
    const num = parseInt(c.code.slice(parentCode.length), 10);
    return isNaN(num) ? 0 : num;
  });
  const next = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  return `${parentCode}${next}`;
}

export function ChildrenEditor({ children, onChange, parentCode }: ChildrenEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const addChild = () => {
    const newCode = parentCode ? generateChildCode(parentCode, children) : `${Date.now()}`;
    onChange([...children, { code: newCode, name: "", dob: null }]);
  };

  const updateChild = (index: number, child: Child) => {
    const updated = [...children];
    updated[index] = child;
    onChange(updated);
  };

  const deleteChild = (index: number) => {
    onChange(children.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = children.findIndex((c) => c.code === active.id);
      const newIndex = children.findIndex((c) => c.code === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = [...children];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        onChange(updated);
      }
    }
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div style={{ overflowX: 'auto', border: '1px solid rgba(15, 42, 31,0.12)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(15, 42, 31,0.2)' }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>DOB</th>
                <th style={{ ...thStyle, width: '2.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {children.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'rgba(26,16,8,0.35)' }}>No children added yet</td></tr>
              ) : (
                <SortableContext items={children.map(c => c.code)} strategy={verticalListSortingStrategy}>
                  {children.map((child, index) => (
                    <SortableRow key={child.code} child={child} index={index} onUpdate={updateChild} onDelete={deleteChild} />
                  ))}
                </SortableContext>
              )}
            </tbody>
          </table>
        </div>
      </DndContext>
      <button
        style={{ ...btnOutline, marginTop: '0.75rem' }}
        onClick={addChild}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; }}
      >+ Add Child</button>
    </div>
  );
}
