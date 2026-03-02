import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Club } from "@/types/firestore";

// ─── Types ──────────────────────────────────────────────────────────────

interface ClubContextType {
    club: Club | null;
    loading: boolean;
    error: string | null;
}

// ─── Default dev club (used when Firebase isn't configured yet) ──────

const DEFAULT_DEV_CLUB: Club = {
    id: "dev_club",
    name: "Magic Nutrition Club",
    currencyName: "MNC Coins",
    domain: "localhost",
    parentClubId: null,
    treePath: "dev_club",
    theme: "custom",
    primaryColor: "#8B5CF6",
    secondaryColor: "#10B981",
    tertiaryColor: "#F59E0B",
    logo: "",
    heroImage: "",
    tagline: "Your Health, Our Mission",
    landingPageUrl: null,
    landingPageImages: [],
    ownerName: "Dev Owner",
    ownerPhone: "+91 9999999999",
    ownerUserId: "owner_user_1",
    status: "active",
    maintenancePaid: true,
    maintenanceDueDate: null as any,
    kitchenPin: "123456",
    adminPin: "12345678",
    createdAt: null as any,
    createdBy: "superadmin_user_1",
};

// ─── Superadmin domain detection ────────────────────────────────────────

// Domains that belong to the developer/superadmin
// These should never try to load a club
const SUPERADMIN_DOMAINS = [
    "magic-nutrition-club.web.app",
    "magic-nutrition-club.firebaseapp.com",
    "localhost",
    "127.0.0.1",
];

export function isSuperAdminDomain(): boolean {
    return SUPERADMIN_DOMAINS.includes(window.location.hostname);
}

// ─── Module-level club cache ─────────────────────────────────────────────
// Persists across re-renders and page navigations within the same tab session.

let _cachedClub: Club | null | undefined = undefined; // undefined = not yet fetched

const SESSION_KEY = "mnc_club_v2";

function saveClubToSession(club: Club | null) {
    try {
        if (club) sessionStorage.setItem(SESSION_KEY, JSON.stringify(club));
        else sessionStorage.removeItem(SESSION_KEY);
    } catch { /* ignore quota errors */ }
}

function loadClubFromSession(): Club | null {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as Club) : null;
    } catch {
        return null;
    }
}

// ─── Detection logic ────────────────────────────────────────────────────

export async function detectClub(): Promise<Club | null> {
    // Return module-level cache immediately if already fetched this session
    if (_cachedClub !== undefined) return _cachedClub;

    // Check sessionStorage next — survives page refreshes within same tab
    const sessionClub = loadClubFromSession();
    if (sessionClub) {
        _cachedClub = sessionClub;
        return sessionClub;
    }

    const hostname = window.location.hostname;

    // Superadmin/dev domains — skip club detection entirely
    if (isSuperAdminDomain()) {
        // For localhost only — try to load dev club for testing owner/member flows
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            const devClubId = import.meta.env.VITE_DEV_CLUB_ID || "dev_club";
            try {
                const docRef = doc(db, "clubs", devClubId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const club = { id: docSnap.id, ...docSnap.data() } as Club;
                    _cachedClub = club;
                    saveClubToSession(club);
                    return club;
                }
            } catch {
                // fallback to default dev club
            }
            const fallback = { ...DEFAULT_DEV_CLUB, id: devClubId };
            _cachedClub = fallback;
            saveClubToSession(fallback);
            return fallback;
        }

        // For magic-nutrition-club.web.app — no club needed
        _cachedClub = null;
        return null;
    }

    // Production club domains — query Firestore by domain
    try {
        const clubsRef = collection(db, "clubs");
        const q = query(clubsRef, where("domain", "==", hostname));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            _cachedClub = null;
            return null;
        }

        const clubDoc = snapshot.docs[0];
        const club = { id: clubDoc.id, ...clubDoc.data() } as Club;
        _cachedClub = club;
        saveClubToSession(club);
        return club;
    } catch (error) {
        console.error("Error detecting club:", error);
        _cachedClub = null;
        return null;
    }
}

// Call this when club data is mutated (e.g. PIN regenerated) to force re-fetch
export function invalidateClubCache() {
    _cachedClub = undefined;
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}

// ─── React hook ─────────────────────────────────────────────────────────

export function useClub() {
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            console.log("clubDetection: load() started");
            try {
                const detected = await detectClub();
                console.log("clubDetection: detectClub resolved:", detected);
                if (!cancelled) {
                    setClub(detected);
                    if (!detected) {
                        setError("Club not found for this domain.");
                    }
                }
            } catch (err: any) {
                console.error("clubDetection: detectClub error", err);
                if (!cancelled) {
                    setError(err.message || "Failed to detect club.");
                }
            } finally {
                console.log("clubDetection: setLoading(false)");
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return { club, loading, error };
}

// ─── Context / Provider ─────────────────────────────────────────────────

const ClubContext = createContext<ClubContextType>({
    club: null,
    loading: true,
    error: null,
});

export function ClubProvider({ children }: { children: ReactNode }) {
    const value = useClub();

    return (
        <ClubContext.Provider value={value}>
            {children}
        </ClubContext.Provider>
    );
}

export function useClubContext() {
    const ctx = useContext(ClubContext);
    if (ctx === undefined) {
        throw new Error("useClubContext must be used within a ClubProvider");
    }
    return ctx;
}
