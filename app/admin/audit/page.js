'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { getAuditLogs } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatName } from '@/lib/formatters';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'login', label: 'Logins' },
  { key: 'logout', label: 'Logouts' },
];

function formatWhen(value) {
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function AdminAuditPage() {
  const { loading: authLoading, isAdmin } = useAuth();
  const [filter, setFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const action = filter === 'all' ? undefined : filter;
      const data = await getAuditLogs(action);
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    load();
  }, [authLoading, isAdmin, load]);

  if (authLoading || !isAdmin) return null;

  return (
    <div>
      <div className="mb-8">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.65rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#0F2A1F',
            marginBottom: '0.5rem',
          }}
        >
          Admin
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
            fontWeight: 400,
            color: '#0F2A1F',
            marginBottom: '0.35rem',
          }}
        >
          Audit Logs
        </h1>
        <span className="gold-rule block mb-3" style={{ marginLeft: 0 }} />
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
            color: 'rgba(15,42,31,0.55)',
            maxWidth: 480,
          }}
        >
          Portal sign-in and sign-out activity.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.72rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '0.45rem 0.9rem',
                border: active ? '1px solid #0F2A1F' : '1px solid rgba(15, 42, 31,0.25)',
                background: active ? 'rgba(15, 42, 31,0.1)' : 'transparent',
                color: active ? '#0F2A1F' : 'rgba(15,42,31,0.55)',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={load}
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0.45rem 0.9rem',
            border: '1px solid rgba(15, 42, 31,0.35)',
            background: 'transparent',
            color: '#0F2A1F',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            color: '#b03030',
            marginBottom: '1rem',
          }}
        >
          {error}
        </p>
      )}

      <div
        className="glass-warm"
        style={{
          overflow: 'hidden',
          borderTop: '2px solid rgba(15, 42, 31,0.25)',
        }}
      >
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: 28,
                height: 28,
                margin: '0 auto',
                borderRadius: '50%',
                border: '1.5px solid rgba(15, 42, 31,0.2)',
                borderTopColor: '#0F2A1F',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        ) : logs.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: 'rgba(15,42,31,0.45)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
            }}
          >
            No login or logout events yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15, 42, 31,0.18)' }}>
                  {['When', 'Action', 'Name', 'Email', 'Role'].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.62rem',
                        letterSpacing: '0.28em',
                        textTransform: 'uppercase',
                        color: 'rgba(15,42,31,0.4)',
                        textAlign: 'left',
                        padding: '0.85rem 1rem',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isLogin = log.action === 'login';
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid rgba(15,42,31,0.06)' }}
                    >
                      <td
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.82rem',
                          color: 'rgba(15,42,31,0.7)',
                          padding: '0.85rem 1rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatWhen(log.createdAt)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.68rem',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            padding: '0.25rem 0.55rem',
                            border: `1px solid ${isLogin ? 'rgba(47,107,66,0.35)' : 'rgba(15, 42, 31,0.35)'}`,
                            color: isLogin ? '#2F6B42' : '#0F2A1F',
                            background: isLogin ? 'rgba(47,107,66,0.08)' : 'rgba(15, 42, 31,0.08)',
                          }}
                        >
                          {isLogin ? 'Login' : 'Logout'}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-cormorant)',
                          fontSize: '1.05rem',
                          color: '#0F2A1F',
                          padding: '0.85rem 1rem',
                        }}
                      >
                        {formatName(log.displayName) || '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.82rem',
                          color: 'rgba(15,42,31,0.6)',
                          padding: '0.85rem 1rem',
                        }}
                      >
                        {log.email || '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.75rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'rgba(15,42,31,0.5)',
                          padding: '0.85rem 1rem',
                        }}
                      >
                        {log.role || 'member'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
