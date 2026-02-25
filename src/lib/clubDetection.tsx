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
    theme: "theme_1",
    primaryColor: "#8B5CF6",
    logo: "",
    heroImage: "",
    tagline: "Your Health, Our Mission",
    ownerName: "Dev Owner",
    ownerPhone: "+91 9999999999",
    ownerUserId: "owner_user_1",
    status: "active",
    maintenancePaid: true,
    maintenanceDueDate: null as any,
    kitchenPin: "1234",
    createdAt: null as any,
    createdBy: "superadmin_user_1",
};

// ─── Detection logic ────────────────────────────────────────────────────

export async function detectClub(): Promise<Club | null> {
    const hostname = window.location.hostname;

    // Localhost fallback: try to fetch from Firestore first, then use default
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        const devClubId = import.meta.env.VITE_DEV_CLUB_ID || "dev_club";

        try {
            const docRef = doc(db, "clubs", devClubId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Club;
            }
        } catch {
            // Firestore not configured or dev club not seeded yet — fallback
        }

        return { ...DEFAULT_DEV_CLUB, id: devClubId };
    }

    // Production: query by domain
    try {
        const clubsRef = collection(db, "clubs");
        const q = query(clubsRef, where("domain", "==", hostname));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const clubDoc = snapshot.docs[0];
        return { id: clubDoc.id, ...clubDoc.data() } as Club;
    } catch (error) {
        console.error("Error detecting club:", error);
        return null;
    }
}

// ─── React hook ─────────────────────────────────────────────────────────

export function useClub() {
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const detected = await detectClub();
                if (!cancelled) {
                    setClub(detected);
                    if (!detected) {
                        setError("Club not found for this domain.");
                    }
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err.message || "Failed to detect club.");
                }
            } finally {
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
