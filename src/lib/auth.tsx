import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { invalidateClubCache } from "@/lib/clubDetection";
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

// ─── Profile cache ───────────────────────────────────────────────────────
// Module-level cache — survives re-renders, cleared on sign-out.

let _cachedProfile: User | null = null;
const PROFILE_CACHE_KEY = "mnc_user_profile_v2";

function saveProfileToStorage(profile: User | null) {
    try {
        if (profile) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
        else localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch { /* ignore */ }
}

function loadProfileFromStorage(): User | null {
    try {
        const raw = localStorage.getItem(PROFILE_CACHE_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
}

// ─── Helper: fetch user profile from Firestore ──────────────────────────

async function fetchUserProfile(uid: string): Promise<User | null> {
    // Return memory cache if uid matches
    if (_cachedProfile && _cachedProfile.id === uid) {
        return _cachedProfile;
    }
    // Check localStorage next
    const stored = loadProfileFromStorage();
    if (stored && stored.id === uid) {
        _cachedProfile = stored;
        return stored;
    }
    // Fetch from Firestore
    try {
        const userDocRef = doc(db, "users", uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            return null;
        }

        const profile = { id: userSnap.id, ...userSnap.data() } as User;
        _cachedProfile = profile;
        saveProfileToStorage(profile);
        return profile;
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
    // Seed state from localStorage immediately — avoids blank screen on return visits
    const _storedProfile = loadProfileFromStorage();
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(_storedProfile);
    const [role, setRole] = useState<UserRole | null>(_storedProfile?.role ?? null);
    // If we have a cached profile, start loading=false optimistically.
    // onAuthStateChanged will correct it if the session has expired.
    const [loading, setLoading] = useState(!_storedProfile);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                // fetchUserProfile uses cache — instant if uid matches stored profile
                const profile = await fetchUserProfile(fbUser.uid).catch(() => null);
                setUserProfile(profile);
                setRole(profile?.role ?? null);
                if (profile) saveProfileToStorage(profile);
            } else {
                // Signed out — clear everything
                _cachedProfile = null;
                saveProfileToStorage(null);
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
        _cachedProfile = null;
        saveProfileToStorage(null);
        invalidateClubCache();
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
