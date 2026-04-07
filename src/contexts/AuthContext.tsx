import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

// Generate unique invite code
export const generateInviteCode = (uid: string): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SGPV-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Add uid fragment for uniqueness
  code += uid.slice(0, 2).toUpperCase();
  return code;
};

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
    let unsubDoc: any;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", u.uid);

      try {
        // Check if user doc exists first
        const existingDoc = await getDoc(userRef);

        if (!existingDoc.exists()) {
          // NEW USER: Create with 5 welcome credits + unique invite code
          const inviteCode = generateInviteCode(u.uid);
          await setDoc(userRef, {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            credits: 5,
            planName: "Free Trial",
            planExpiry: null,
            totalVaults: 0,
            inviteCode,
            termsAccepted: false,
            createdAt: serverTimestamp(),
            isAdmin: false,
          });
        } else {
          // EXISTING USER: Only update profile fields, preserve everything else
          await setDoc(userRef, {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          }, { merge: true });
        }
      } catch (err) {
        console.error("User doc init error:", err);
      }

      // REAL-TIME LISTENER — isAdmin comes from Firestore directly
      unsubDoc = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setUserData({
            email: d.email || u.email || "",
            displayName: d.displayName || u.displayName || "",
            photoURL: d.photoURL || u.photoURL || "",
            credits: d.credits ?? 0,
            planName: d.planName || "Free Trial",
            planExpiry: d.planExpiry?.toDate?.() || null,
            totalVaults: d.totalVaults || 0,
            inviteCode: d.inviteCode || "",
            termsAccepted: d.termsAccepted || false,
            createdAt: d.createdAt?.toDate?.() || new Date(),
            isAdmin: d.isAdmin === true, // Read from Firestore, NOT custom claims
          });
        } else {
          setUserData({
            email: u.email || "",
            displayName: u.displayName || "",
            photoURL: u.photoURL || "",
            credits: 0,
            planName: "Free Trial",
            planExpiry: null,
            totalVaults: 0,
            inviteCode: "",
            termsAccepted: false,
            createdAt: new Date(),
            isAdmin: false,
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("User snapshot error:", error);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
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
