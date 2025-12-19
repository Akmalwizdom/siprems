import { ReactNode } from 'react';
import { useRole, UserRole } from '../../context/AuthContext';

interface RoleGuardProps {
  /** Required role(s) to render children */
  allowedRoles: UserRole | UserRole[];
  /** Content to render if user has required role */
  children: ReactNode;
  /** Optional fallback content when user doesn't have required role */
  fallback?: ReactNode;
  /** If true, hide completely instead of showing fallback */
  hideOnUnauthorized?: boolean;
}

/**
 * RoleGuard - Component to conditionally render content based on user role
 * 
 * @example
 * // Show only for admin
 * <RoleGuard allowedRoles="admin">
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Show for multiple roles with fallback
 * <RoleGuard allowedRoles={['admin', 'manager']} fallback={<p>Access denied</p>}>
 *   <SensitiveContent />
 * </RoleGuard>
 */
export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = null,
  hideOnUnauthorized = true 
}: RoleGuardProps) {
  const { canAccess } = useRole();
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasAccess = canAccess(roles);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (hideOnUnauthorized) {
    return null;
  }
  
  return <>{fallback}</>;
}

/**
 * AdminOnly - Shortcut component to render content only for admins
 */
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles="admin" fallback={fallback} hideOnUnauthorized={!fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * UserOnly - Shortcut component to render content only for regular users
 */
export function UserOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles="user" fallback={fallback} hideOnUnauthorized={!fallback}>
      {children}
    </RoleGuard>
  );
}
