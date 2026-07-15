'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { addUser, getAllUsers, updateUserRole, bulkImportUsers, deleteUser } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';
import ConfirmModal from '@/components/ui/ConfirmModal';

const ROLE_OPTIONS = ['member', 'admin', 'super_admin'];

const COLUMN_MAP = {
  email: 'email',
  name: 'name',
  'full name': 'name',
  'display name': 'name',
  displayname: 'name',
  password: 'password',
  pass: 'password',
  role: 'role',
  code: 'code',
  'family code': 'code',
  'invite code': 'code',
};

function parseExcelRows(rows) {
  if (!rows || rows.length < 2) return [];
  const headerRow = rows[0].map((h) => String(h).trim().toLowerCase());
  const cols = headerRow.map((h) => COLUMN_MAP[h] || null);
  return rows.slice(1).map((row) => {
    const user = { email: '', name: '', password: '', role: 'member', code: '' };
    cols.forEach((field, i) => {
      const val = row[i] != null ? String(row[i]).trim() : '';
      if (field) user[field] = val;
    });
    return user;
  }).filter((u) => u.email && u.name);
}

export default function AdminUsersPage() {
  const { loading: authLoading, isAdmin, role: myRole } = useAuth();
  const isSuperAdmin = myRole === 'super_admin';
  const availableRoles = isSuperAdmin ? ROLE_OPTIONS : ['member', 'admin'];
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'member',
    code: '',
  });

  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [parsedUsers, setParsedUsers] = useState([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setParsedUsers([]);
    setBulkResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        setParsedUsers(parseExcelRows(rows));
      } catch {
        setError('Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImport = async () => {
    setBulkImporting(true);
    setBulkResult(null);
    setError('');
    setMessage('');
    try {
      const result = await bulkImportUsers(parsedUsers);
      setBulkResult(result);
      setParsedUsers([]);
      setFileName('');
      await load();
    } catch (err) {
      setBulkResult({ created: 0, failed: parsedUsers.length, errors: parsedUsers.map((u) => ({ email: u.email, error: err.message })) });
    } finally {
      setBulkImporting(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try { setUsers(await getAllUsers()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    load();
  }, [authLoading, isAdmin]);

  const [deleting, setDeleting] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);

  const handleDelete = async () => {
    if (!confirmUser) return;
    setDeleting(confirmUser.uid);
    setError('');
    setMessage('');
    setConfirmUser(null);
    try {
      await deleteUser(confirmUser.uid);
      setMessage(`User "${confirmUser.displayName || confirmUser.email}" deleted.`);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleRole = async (user, nextRole) => {
    setActing(user.uid);
    setError('');
    setMessage('');
    try {
      await updateUserRole(user.uid, nextRole);
      await load();
      setMessage('Role updated in users and authentication.');
    } catch (err) {
      setError(err.message || 'Failed to update role.');
    } finally {
      setActing(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (form.password.length < 6) {
      setError('Temporary password must be at least 6 characters.');
      return;
    }

    setCreating(true);
    try {
      await addUser({
        email: form.email,
        displayName: form.displayName,
        password: form.password,
        role: form.role,
        code: form.code,
      });
      setForm({ email: '', displayName: '', password: '', role: 'member', code: '' });
      setMessage('User created in authentication and users.');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(212,175,55,0.22)',
    padding: '0.7rem 0.85rem',
    fontFamily: 'var(--font-inter)',
    fontSize: '0.82rem',
    color: '#1A1008',
    outline: 'none',
  };

  const labelStyle = {
    fontFamily: 'var(--font-inter)',
    fontSize: '0.62rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'rgba(26,16,8,0.42)',
    display: 'block',
    marginBottom: '0.4rem',
  };

  const thStyle = {
    fontFamily: 'var(--font-inter)',
    fontSize: '0.62rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'rgba(26,16,8,0.42)',
    padding: '0.5rem 0.6rem',
    textAlign: 'left',
    fontWeight: 500,
  };

  const tdStyle = {
    padding: '0.5rem 0.6rem',
    color: '#1A1008',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.4rem' }}>Admin</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Users</h1>
        <span className="gold-rule block mt-3" />
      </div>

      <form onSubmit={handleCreateUser} className="glass-warm shadow-cloud p-4 md:p-5 mb-6 max-w-3xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.7)', marginBottom: '0.25rem' }}>
              New User
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 400, color: '#1A1008' }}>
              Add member account
            </h2>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-7 py-3 text-xs tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid rgba(196,155,26,0.45)',
              color: '#C49B1A',
              background: 'transparent',
              cursor: creating ? 'wait' : 'pointer',
              opacity: creating ? 0.65 : 1,
              letterSpacing: '0.14em',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!creating) { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; } }}
            onMouseLeave={(e) => { if (!creating) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; } }}
          >
            {creating ? 'Creating...' : 'Add User'}
          </button>
        </div>

        {(error || message) && (
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            color: error ? '#b03030' : '#2f6b42',
            padding: '0.65rem 0.8rem',
            background: error ? 'rgba(176,48,48,0.06)' : 'rgba(47,107,66,0.07)',
            border: `1px solid ${error ? 'rgba(176,48,48,0.16)' : 'rgba(47,107,66,0.16)'}`,
            marginBottom: '1rem',
          }}>
            {error || message}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              placeholder="member@example.com"
            />
          </div>
          <div className="lg:col-span-2">
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              style={inputStyle}
              placeholder="Full name"
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={inputStyle}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label style={labelStyle}>Temporary Password</label>
            <input
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="lg:col-span-3">
            <label style={labelStyle}>Code Optional</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              style={inputStyle}
              placeholder="Family or invite code"
            />
          </div>
        </div>
      </form>

      <div className="glass-warm shadow-cloud p-4 md:p-5 mb-6 max-w-3xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.7)', marginBottom: '0.25rem' }}>
              Bulk Import
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 400, color: '#1A1008' }}>
              Import multiple users
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-5 py-3 text-xs tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(196,155,26,0.45)',
                color: '#C49B1A',
                background: 'transparent',
                cursor: 'pointer',
                letterSpacing: '0.14em',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; }}
            >
              {fileName ? 'Change File' : 'Select Excel File'}
            </button>
            {parsedUsers.length > 0 && (
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={bulkImporting}
                className="px-5 py-3 text-xs tracking-widest uppercase"
                style={{
                  fontFamily: 'var(--font-inter)',
                  border: '1px solid rgba(196,155,26,0.45)',
                  color: '#FFF7ED',
                  background: '#C49B1A',
                  cursor: bulkImporting ? 'wait' : 'pointer',
                  opacity: bulkImporting ? 0.65 : 1,
                  letterSpacing: '0.14em',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {bulkImporting ? 'Importing...' : `Import ${parsedUsers.length}`}
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed rgba(212,175,55,0.35)',
            borderRadius: '4px',
            padding: '2rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: fileName ? 'rgba(212,175,55,0.04)' : 'transparent',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = fileName ? 'rgba(212,175,55,0.04)' : 'transparent'; }}
        >
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.82rem',
            color: fileName ? '#1A1008' : 'rgba(26,16,8,0.45)',
            margin: 0,
          }}>
            {fileName
              ? `Selected: ${fileName}`
              : 'Click or drag an Excel file here (.xlsx / .xls)'}
          </p>
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.65rem',
            color: 'rgba(26,16,8,0.3)',
            marginTop: '0.4rem',
            marginBottom: 0,
          }}>
            Columns: email, name, password, role, code
          </p>
        </div>

        {bulkResult && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.65rem 0.8rem',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.78rem',
            border: '1px solid rgba(47,107,66,0.16)',
            background: bulkResult.failed > 0 ? 'rgba(176,48,48,0.06)' : 'rgba(47,107,66,0.07)',
            borderColor: bulkResult.failed > 0 ? 'rgba(176,48,48,0.16)' : 'rgba(47,107,66,0.16)',
            color: bulkResult.failed > 0 ? '#b03030' : '#2f6b42',
          }}>
            <strong>{bulkResult.created}</strong> created, <strong>{bulkResult.failed}</strong> failed
            {bulkResult.errors.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {bulkResult.errors.map((e, i) => (
                  <li key={i}>{e.email}: {e.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {parsedUsers.length > 0 && (
          <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-inter)', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Code</th>
                </tr>
              </thead>
              <tbody>
                {parsedUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>{u.name}</td>
                    <td style={tdStyle}>{u.role}</td>
                    <td style={tdStyle}>{u.code || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.2)', borderTopColor: '#C49B1A', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-3xl">
          {users.map((u) => (
            <div key={u.uid} className="glass-warm shadow-cloud p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.displayName || 'Unnamed Member'}
                </p>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span style={{
                  fontFamily: 'var(--font-inter)', fontSize: '0.6rem', letterSpacing: '0.3em',
                  textTransform: 'uppercase', padding: '0.25rem 0.65rem',
                  background: u.role === 'super_admin'
                    ? 'rgba(90,143,170,0.12)'
                    : u.role === 'admin'
                      ? 'rgba(196,155,26,0.1)'
                      : 'rgba(26,16,8,0.05)',
                  color: u.role === 'super_admin'
                    ? '#5A8FAA'
                    : u.role === 'admin'
                      ? '#C49B1A'
                      : 'rgba(26,16,8,0.4)',
                  border: `1px solid ${u.role === 'super_admin'
                    ? 'rgba(90,143,170,0.3)'
                    : u.role === 'admin'
                      ? 'rgba(196,155,26,0.3)'
                      : 'rgba(26,16,8,0.1)'}`,
                }}>
                  {u.role || 'member'}
                </span>
                <select
                  value={u.role || 'member'}
                  onChange={(e) => toggleRole(u, e.target.value)}
                  disabled={acting === u.uid}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#1A1008',
                    padding: '0.35rem 0.55rem',
                    cursor: acting === u.uid ? 'wait' : 'pointer',
                    opacity: acting === u.uid ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {(isSuperAdmin || (myRole === 'admin' && u.role === 'member')) && u.uid !== myRole && (
                  <button
                    type="button"
                    onClick={() => setConfirmUser(u)}
                    disabled={deleting === u.uid}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.6rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      border: '1px solid rgba(176,48,48,0.3)',
                      color: deleting === u.uid ? '#999' : '#b03030',
                      padding: '0.35rem 0.55rem',
                      cursor: deleting === u.uid ? 'wait' : 'pointer',
                      opacity: deleting === u.uid ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { if (deleting !== u.uid) { e.currentTarget.style.background = '#b03030'; e.currentTarget.style.color = '#fff'; } }}
                    onMouseLeave={(e) => { if (deleting !== u.uid) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b03030'; } }}
                  >
                    {deleting === u.uid ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        open={!!confirmUser}
        title="Delete User?"
        message={
          confirmUser
            ? `Permanently remove "${confirmUser.displayName || confirmUser.email}" from both authentication and the users database?`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmUser(null)}
        loading={!!deleting}
      />
    </>
  );
}
