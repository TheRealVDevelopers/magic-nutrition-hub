import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, UserRole } from "@/types/firestore";

// ─── Types ──────────────────────────────────────────────────────────────

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    userProfile: User | null;
    role: UserRole | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<User>;
    signOut: () => Promise<void>;
}

// ─── Helper: fetch user profile from Firestore ──────────────────────────

async function fetchUserProfile(uid: string): Promise<User | null> {
    try {
        const userDocRef = doc(db, "users", uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            return null;
        }

        return { id: userSnap.id, ...userSnap.data() } as User;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}

// ─── Auth functions ─────────────────────────────────────────────────────

export async function signIn(
    email: string,
    password: string
): Promise<User> {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchUserProfile(credential.user.uid);

        if (!profile) {
            throw new Error(
                "User account exists in Auth but has no Firestore profile. Contact your administrator."
            );
        }

        return profile;
    } catch (error: any) {
        if (
            error.code === "auth/user-not-found" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/invalid-credential"
        ) {
            throw new Error("Invalid email or password.");
        }
        if (error.code === "auth/too-many-requests") {
            throw new Error("Too many failed attempts. Please try again later.");
        }
        throw error;
    }
}

export async function signOutUser(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
}

export function getCurrentUserRole(): UserRole | null {
    // Synchronous getter — role is kept in AuthContext state.
    // Use useAuth() hook in components instead.
    return null;
}

// ─── Role-based dashboard paths ─────────────────────────────────────────

export function getDashboardPath(role: UserRole): string {
    switch (role) {
        case "superAdmin":
            return "/superadmin/dashboard";
        case "clubOwner":
            return "/owner/dashboard";
        case "staff":
            return "/staff/dashboard";
        case "member":
            return "/member/dashboard";
        case "kitchenDisplay":
            return "/kitchen";
        default:
            return "/";
    }
}

// ─── Context ────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
    firebaseUser: null,
    userProfile: null,
    role: null,
    loading: true,
    signIn: async () => {
        throw new Error("AuthProvider not initialised");
    },
    signOut: async () => {
        throw new Error("AuthProvider not initialised");
    },
});

// ─── React hook ─────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (ctx === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                try {
                    const profile = await fetchUserProfile(fbUser.uid);
                    setUserProfile(profile);
                    setRole(profile?.role ?? null);
                } catch {
                    setUserProfile(null);
                    setRole(null);
                }
            } else {
                setUserProfile(null);
                setRole(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignIn = async (email: string, password: string): Promise<User> => {
        const profile = await signIn(email, password);
        setUserProfile(profile);
        setRole(profile.role);
        return profile;
    };

    const handleSignOut = async () => {
        await signOutUser();
        setUserProfile(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider
            value={{
                firebaseUser,
                userProfile,
                role,
                loading,
                signIn: handleSignIn,
                signOut: handleSignOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
