'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import {
  approveEditRequest,
  denyEditRequest,
  getPendingEditRequests,
  getPdfAccessRequests,
  approvePdfAccessRequest,
  revokePdfAccessRequest,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';

const TABS = [
  { key: 'edit', label: 'Profile Edits' },
  { key: 'book', label: 'Book Access' },
];

const PROFILE_FIELD_LABELS = {
  displayName: 'Full Name',
  phone: 'Phone',
  branch: 'Branch',
  profession: 'Profession',
  location: 'Location',
  address: 'Address',
  dateOfBirth: 'Date of Birth',
  bio: 'About Me',
};

function permissionOf(user) {
  return user.permission === 'revoke' ? 'revoke' : 'grant';
}

export default function AdminRequestsPage() {
  const { loading: authLoading, isAdmin } = useAuth();

  const [tab, setTab] = useState('edit');
  const [editReqs, setEditReqs] = useState([]);
  const [bookUsers, setBookUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const loadEdit = async () => {
    const edit = await getPendingEditRequests().catch(() => []);
    setEditReqs(edit);
  };

  const loadBookUsers = async () => {
    const users = await getPdfAccessRequests().catch(() => []);
    setBookUsers(users);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadEdit(), loadBookUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    loadAll();
  }, [authLoading, isAdmin]);

  const handleApproveEdit = async (req) => {
    setActing('edit-' + req.id);
    await approveEditRequest(req.id);
    await loadEdit();
    setActing(null);
  };

  const handleDenyEdit = async (req) => {
    setActing('edit-' + req.id);
    await denyEditRequest(req.id);
    await loadEdit();
    setActing(null);
  };

  const handleBookPermission = async (user, permission) => {
    setActing('book-' + user.uid);

    if (permission === 'grant') {
      await approvePdfAccessRequest(user.uid);
    } else {
      await revokePdfAccessRequest(user.uid);
    }

    await loadBookUsers();
    setActing(null);
  };

  return (
    <>
      <div className="mb-8">
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.68rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(196,155,26,0.65)',
            marginBottom: '0.4rem',
          }}
        >
          Admin
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(1.5rem, 4.5vw, 2rem)',
            fontWeight: 300,
            color: '#1A1008',
          }}
        >
          Requests
        </h1>

        <span className="gold-rule block mt-3" />
      </div>

      <div
        className="flex gap-1 mb-8"
        style={{
          borderBottom: '1px solid rgba(212,175,55,0.18)',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.7rem 1.5rem',
              background:
                tab === t.key
                  ? 'rgba(196,155,26,0.08)'
                  : 'transparent',
              color:
                tab === t.key
                  ? '#C49B1A'
                  : 'rgba(26,16,8,0.4)',
              border: 'none',
              borderBottom:
                tab === t.key
                  ? '2px solid #C49B1A'
                  : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1.5px solid rgba(196,155,26,0.2)',
              borderTopColor: '#C49B1A',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      ) : tab === 'edit' ? (
        editReqs.length === 0 ? (
          <div className="glass-warm shadow-cloud p-6 text-center max-w-md">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: 'rgba(26,16,8,0.45)',
              }}
            >
              No pending profile edit requests.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-4xl">
            {editReqs.map((req) => (
              <div
                key={req.id}
                className="glass-warm shadow-cloud p-4 md:p-5"
              >
                {/* HEADER */}
                <div className="flex items-start sm:items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(196,155,26,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        color: '#C49B1A',
                      }}
                    >
                      {req.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div className="min-w-0">
                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.85rem',
                          color: '#1A1008',
                          fontWeight: 600,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {req.displayName || 'Unnamed Member'}
                      </p>

                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.65rem',
                          color: 'rgba(26,16,8,0.35)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {req.email}

                        <span
                          style={{
                            color: 'rgba(196,155,26,0.6)',
                            textTransform: 'uppercase',
                            fontSize: '0.55rem',
                            letterSpacing: '0.12em',
                            marginLeft: '0.5rem',
                          }}
                        >
                          {req.role || 'member'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveEdit(req)}
                      disabled={acting === 'edit-' + req.id}
                      className="px-4 py-1.5 text-xs tracking-widest uppercase"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        border: '1px solid rgba(196,155,26,0.45)',
                        color: '#C49B1A',
                        background: 'transparent',
                        cursor:
                          acting === 'edit-' + req.id
                            ? 'wait'
                            : 'pointer',
                        opacity:
                          acting === 'edit-' + req.id
                            ? 0.6
                            : 1,
                        letterSpacing: '0.14em',
                        transition: 'all 0.2s',
                      }}
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => handleDenyEdit(req)}
                      disabled={acting === 'edit-' + req.id}
                      className="px-4 py-1.5 text-xs tracking-widest uppercase"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        border: '1px solid rgba(176,48,48,0.35)',
                        color: '#b03030',
                        background: 'transparent',
                        cursor:
                          acting === 'edit-' + req.id
                            ? 'wait'
                            : 'pointer',
                        opacity:
                          acting === 'edit-' + req.id
                            ? 0.6
                            : 1,
                        letterSpacing: '0.14em',
                        transition: 'all 0.2s',
                      }}
                    >
                      Deny
                    </button>
                  </div>
                </div>

                {/* CHANGES */}
                <div
                  style={{
                    borderTop:
                      '1px solid rgba(212,175,55,0.12)',
                    paddingTop: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.55rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(26,16,8,0.25)',
                        paddingLeft: '0.5rem',
                      }}
                    >
                      Field
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.55rem',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: 'rgba(176,48,48,0.35)',
                        }}
                      >
                        Old
                      </p>

                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.55rem',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: 'rgba(47,107,66,0.35)',
                        }}
                      >
                        New
                      </p>
                    </div>
                  </div>

                  {Object.entries(req.changes || {}).map(
                    ([key, val]) => (
                      <div
                        key={key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem',
                          padding: '0.4rem 0',
                          borderBottom:
                            '1px solid rgba(212,175,55,0.06)',
                        }}
                      >
                        <p
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.72rem',
                            color: 'rgba(26,16,8,0.5)',
                            paddingLeft: '0.5rem',
                          }}
                        >
                          {PROFILE_FIELD_LABELS[key] || key}
                        </p>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                          }}
                        >
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.72rem',
                              color: 'rgba(26,16,8,0.4)',
                              background:
                                'rgba(176,48,48,0.04)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: 2,
                            }}
                          >
                            {String(
                              req.currentValues?.[key] || '-'
                            )}
                          </p>

                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.72rem',
                              color: '#1A1008',
                              fontWeight: 500,
                              background:
                                'rgba(47,107,66,0.06)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: 2,
                            }}
                          >
                            {String(val || '-')}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : bookUsers.length === 0 ? (
        <div className="glass-warm shadow-cloud p-8 text-center max-w-md">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.875rem',
              color: 'rgba(26,16,8,0.45)',
            }}
          >
            No users found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-3xl">
          {bookUsers.map((u) => {
            const permission = permissionOf(u);

            return (
              <div
                key={u.uid}
                className="glass-warm shadow-cloud p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      color: '#1A1008',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.displayName || 'Unnamed Member'}
                  </p>

                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      color: 'rgba(26,16,8,0.4)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.email || 'No email'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.58rem',
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      padding: '0.25rem 0.65rem',
                      background:
                        permission === 'grant'
                          ? 'rgba(47,107,66,0.08)'
                          : 'rgba(176,48,48,0.08)',
                      color:
                        permission === 'grant'
                          ? '#2f6b42'
                          : '#b03030',
                      border: `1px solid ${
                        permission === 'grant'
                          ? 'rgba(47,107,66,0.2)'
                          : 'rgba(176,48,48,0.2)'
                      }`,
                    }}
                  >
                    {permission}
                  </span>

                  <button
                    onClick={() =>
                      handleBookPermission(
                        u,
                        permission === 'grant'
                          ? 'revoke'
                          : 'grant'
                      )
                    }
                    disabled={acting === 'book-' + u.uid}
                    style={{
                      position: 'relative',
                      width: 44,
                      height: 22,
                      borderRadius: 11,
                      background:
                        permission === 'grant'
                          ? '#2f6b42'
                          : '#b03030',
                      border: 'none',
                      cursor:
                        acting === 'book-' + u.uid
                          ? 'wait'
                          : 'pointer',
                      opacity:
                        acting === 'book-' + u.uid
                          ? 0.5
                          : 1,
                      transition: 'background 0.2s',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left:
                          permission === 'grant'
                            ? 24
                            : 2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#FFF7ED',
                        boxShadow:
                          '0 1px 3px rgba(0,0,0,0.15)',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}