"use client";

import { DashboardStats } from "@/types/family";

const STAT_CONFIG: { key: keyof DashboardStats; icon: string; label: string; accent: string }[] = [
  { key: "totalFamilies", icon: "◉", label: "Total Families", accent: "#0F2A1F" },
  { key: "totalChildren", icon: "◎", label: "Total Children", accent: "#1A3D2E" },
  { key: "totalImages", icon: "▣", label: "Total Images", accent: "#6BA888" },
  { key: "dataSource", icon: "◇", label: "Data Source", accent: "#A8C4B4" },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
      {STAT_CONFIG.map(({ key, icon, label, accent }) => (
        <div
          key={key}
          className="glass-warm shadow-cloud"
          style={{ padding: '1.5rem', borderTop: `2px solid ${accent}40`, transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)' }}>
              {label}
            </span>
            <span style={{ fontSize: '1.1rem', color: accent }}>{icon}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2.2rem', fontWeight: 300, color: '#1A1008', lineHeight: 1 }}>
            {key === 'dataSource' ? String(stats[key]) : stats[key]}
          </div>
        </div>
      ))}
    </div>
  );
}
