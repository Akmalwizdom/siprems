import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  AuthError,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { API_BASE_URL } from '../config';

export type UserRole = 'user' | 'admin';

interface UserWithRole {
  firebaseUser: FirebaseUser;
  role: UserRole;
  dbUserId?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updatePhotoURL: (photoURL: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
// Force account selection prompt to appear every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export function getFirebaseErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Invalid email format';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups for this site';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/requires-recent-login':
      return 'Please re-enter your password to continue';
    default:
      return 'An error occurred. Please try again';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  // Fetch user role from backend
  const fetchUserRole = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      // Note: API_BASE_URL already includes /api, so we use /users/me not /api/users/me
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setRole(userData.role as UserRole);
      } else {
        // User will be created automatically by backend with default 'user' role
        setRole('user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('user');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchUserRole(firebaseUser);
      } else {
        setRole('user');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAuthToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const loginWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserRole(result.user);
  };

  const registerWithEmail = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await fetchUserRole(result.user);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await fetchUserRole(result.user);
  };

  const logout = async () => {
    await signOut(auth);
    setRole('user');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateDisplayName = async (displayName: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await updateProfile(auth.currentUser, { displayName });
    // Force refresh user state
    setUser({ ...auth.currentUser });
  };

  const updatePhotoURL = async (photoURL: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await updateProfile(auth.currentUser, { photoURL });
    // Force refresh user state
    setUser({ ...auth.currentUser });
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) throw new Error('No user logged in');
    // Re-authenticate first
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    // Then update password
    await firebaseUpdatePassword(auth.currentUser, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAdmin: role === 'admin',
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        updateDisplayName,
        updatePhotoURL,
        updateUserPassword,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check if user has specific role
export function useRole() {
  const { role, isAdmin } = useAuth();
  
  return {
    role,
    isAdmin,
    isUser: role === 'user',
    hasRole: (requiredRole: UserRole) => role === requiredRole,
    canAccess: (allowedRoles: UserRole[]) => allowedRoles.includes(role),
  };
}
