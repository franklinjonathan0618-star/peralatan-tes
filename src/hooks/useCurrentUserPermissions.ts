import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/utils/rolePermissions';
import type { UserRole } from '@/utils/rolePermissions';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

// Cache key includes role so that a role change (e.g. viewer→admin) invalidates old cache.
// Format: "<userId>:<role>"
const cache: Record<string, Record<string, boolean>> = {};

/**
 * Returns a flat map of { page_key: can_view } for the current user.
 * Used by NavBar to filter visible menu items.
 *
 * Admin role ALWAYS bypasses the database so that changing a user's role
 * from viewer/commentator to admin takes effect immediately.
 */
export function useCurrentUserViewPermissions(): {
  viewMap: Record<string, boolean>;
  loading: boolean;
} {
  const { user } = useAuth();
  const [viewMap, setViewMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Admin always sees everything — skip DB entirely
    if (user.role === 'admin') {
      setViewMap({});
      setLoading(false);
      return;
    }

    const cacheKey = `${user.id}:${user.role}`;

    // Return from cache if available
    if (cache[cacheKey]) {
      setViewMap(cache[cacheKey]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_URL}/api/system/user-permissions/${user.id}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;

        const rows: Array<{ page_key: string; can_view: number | boolean }> = json.data || [];
        const map: Record<string, boolean> = {};

        if (rows.length > 0) {
          // Use database permissions
          for (const row of rows) {
            map[row.page_key] = Boolean(row.can_view);
          }
        } else {
          // Fallback: use ROLE_PERMISSIONS
          const rolePerms = ROLE_PERMISSIONS[user.role as UserRole];
          if (rolePerms) {
            for (const [pageKey, perms] of Object.entries(rolePerms)) {
              map[pageKey] = perms.view;
            }
          }
        }

        cache[cacheKey] = map;
        setViewMap(map);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to role-based
        const rolePerms = ROLE_PERMISSIONS[user.role as UserRole];
        const map: Record<string, boolean> = {};
        if (rolePerms) {
          for (const [pageKey, perms] of Object.entries(rolePerms)) {
            map[pageKey] = perms.view;
          }
        }
        setViewMap(map);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id, user?.role]);

  return { viewMap, loading };
}

/**
 * Invalidate the cache for a specific user (call after saving permissions).
 * Clears all cached entries for that user regardless of role.
 */
export function invalidateUserPermissionCache(userId: string) {
  // Remove all cache entries for this user (any role variant)
  for (const key of Object.keys(cache)) {
    if (key.startsWith(`${userId}:`)) {
      delete cache[key];
    }
  }
}
