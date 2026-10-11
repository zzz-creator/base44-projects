/**
 * ImpersonationBanner — shared component for all projects
 *
 * Usage:
 *   import ImpersonationBanner from '../components/ImpersonationBanner';
 *   // Render at top of Layout/App:
 *   <ImpersonationBanner />
 */
import React, { useState, useEffect } from 'react';

const IMPERSONATE_KEY = 'impersonateSession';   // { adminToken, adminUser }
const TOKEN_KEY       = 'prodintel_token';       // reuse per-project token key override (see below)

/**
 * Returns the localStorage token key for the current project.
 * Each project stores its auth token under a different key.
 */
function detectTokenKey() {
  // Detect by checking which key exists
  const candidates = ['hotelops_token', 'prodintel_token', 'warmatrix_token', 'astrosim_token', 'token'];
  for (const k of candidates) {
    if (localStorage.getItem(k) !== null) return k;
  }
  return 'token';
}

export function startImpersonation(token, user) {
  const tokenKey = detectTokenKey();
  const adminToken = localStorage.getItem(tokenKey);
  const adminUser  = JSON.parse(localStorage.getItem('currentUser') || 'null');
  localStorage.setItem(IMPERSONATE_KEY, JSON.stringify({ adminToken, adminUser, tokenKey }));
  localStorage.setItem(tokenKey, token);
  localStorage.setItem('currentUser', JSON.stringify(user));
  window.location.href = '/';
}

export function exitImpersonation() {
  const session = JSON.parse(localStorage.getItem(IMPERSONATE_KEY) || 'null');
  if (!session) return;
  const { adminToken, adminUser, tokenKey } = session;
  localStorage.setItem(tokenKey || 'token', adminToken);
  localStorage.setItem('currentUser', JSON.stringify(adminUser));
  localStorage.removeItem(IMPERSONATE_KEY);
  window.location.href = '/';
}

export function isImpersonating() {
  return !!localStorage.getItem(IMPERSONATE_KEY);
}

export default function ImpersonationBanner() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(IMPERSONATE_KEY);
    if (raw) setSession(JSON.parse(raw));
  }, []);

  if (!session) return null;

  const impersonatedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'linear-gradient(90deg, #7c3aed, #db2777)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      <span>
        🎭 <strong>Admin Impersonation</strong> — You are viewing as{' '}
        <strong>{impersonatedUser?.full_name || impersonatedUser?.email || 'Unknown User'}</strong>
        {impersonatedUser?.email && ` (${impersonatedUser.email})`}
      </span>
      <button
        onClick={exitImpersonation}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '6px',
          color: '#fff',
          padding: '4px 14px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          transition: 'background 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
      >
        ✕ Exit Impersonation
      </button>
    </div>
  );
}
