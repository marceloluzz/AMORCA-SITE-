import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { auth, db, doc, getDoc, onAuthStateChanged, setDoc, serverTimestamp } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'coordinator' | 'member';
  status: 'active' | 'pending' | 'inactive';
  membershipDate?: any;
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isCoordinator: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null | { uid: string; email: string; displayName: string; photoURL: string }>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsGuest = () => {
    const guestUser = {
      uid: 'guest-test-user',
      email: 'associado.teste@amorca.org.br',
      displayName: 'Associado de Teste',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
    };
    setUser(guestUser as any);
    setProfile({
      uid: guestUser.uid,
      email: guestUser.email,
      displayName: guestUser.displayName,
      role: 'member',
      status: 'active'
    });
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Create default profile for new users
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            role: firebaseUser.email === 'tchellusuzi@gmail.com' ? 'admin' : 'member',
            status: 'pending',
            membershipDate: serverTimestamp(),
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isCoordinator: profile?.role === 'coordinator' || profile?.role === 'admin',
    loginAsGuest,
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
