'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * PermissionGate Component
 * Conditionally renders children if Admin has required permission flag enabled.
 * @param {string} permission Permission property name e.g. 'can_approve_candidates'
 * @param {React.ReactNode} children Rendered content if permission granted
 * @param {React.ReactNode} fallback Optional custom fallback UI if denied
 */
export default function PermissionGate({ permission, children, fallback = null }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.role === 'superadmin') {
            setHasPermission(true);
          } else if (user.role === 'admin' && user.permissions) {
            setHasPermission(!!user.permissions[permission]);
          } else {
            setHasPermission(false);
          }
        } catch (e) {
          setHasPermission(false);
        }
      }
      setLoading(false);
    }
  }, [permission]);

  if (loading) return null;

  if (!hasPermission) {
    if (fallback) return fallback;

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
        <ShieldAlert className="w-5 h-5 text-amber-500 mx-auto mb-1" />
        <p className="text-xs text-slate-500 font-medium">
          Access restricted. You lack the '<span className="font-mono text-slate-700">{permission}</span>' privilege.
        </p>
      </div>
    );
  }

  return children;
}
