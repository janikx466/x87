import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

interface UserData {
  email: string;
  displayName: string;
  photoURL: string;
  credits: number;
  planName: string;
  planExpiry: Date | null;
  totalVaults: number;
  inviteCode: string;
  termsAccepted: boolean;
  createdAt: Date;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { setUserData(null); setLoading(false); return; }
      // Listen to user doc real-time
      const userDocRef = doc(db, "users", u.uid);
      const unsubDoc = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setUserData({
            email: d.email || u.email || "",
            displayName: d.displayName || u.displayName || "",
            photoURL: d.photoURL || u.photoURL || "",
            credits: d.credits || 0,
            planName: d.planName || "Free Trial",
            planExpiry: d.planExpiry?.toDate?.() || null,
            totalVaults: d.totalVaults || 0,
            inviteCode: d.inviteCode || "",
            termsAccepted: d.termsAccepted || false,
            createdAt: d.createdAt?.toDate?.() || new Date(),
            isAdmin: false,
          });
        }
        setLoading(false);
      });
      // Check admin claim
      const token = await u.getIdTokenResult();
      if (token.claims.admin) {
        setUserData(prev => prev ? { ...prev, isAdmin: true } : prev);
      }
      return () => unsubDoc();
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
