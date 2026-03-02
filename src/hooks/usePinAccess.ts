// PIN-based access is designed for convenience, not high security.
// PINs are stored in Firestore and compared client-side.
// Clubs collection has public read access so this works without Firebase Auth.

import { useState, useEffect } from "react";
import { doc, getDoc, getDocFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useClubContext } from "@/lib/clubDetection";

type PinType = "kitchen" | "admin";

function getStorageKey(clubId: string, type: PinType): string {
    return `mnc_${type}_pin_${clubId}`;
}

function getFieldName(type: PinType): string {
    return type === "kitchen" ? "kitchenPin" : "adminPin";
}

async function fetchClubPin(clubId: string, type: PinType): Promise<string | null> {
    // Always read from server to avoid stale cache after PIN regeneration
    const snap = await getDocFromServer(doc(db, "clubs", clubId));
    if (!snap.exists()) return null;
    const raw = snap.data()?.[getFieldName(type)];
    if (raw == null || raw === "") return null;
    return String(raw).trim();
}

interface PinAccessResult {
    isVerified: boolean;
    isLoading: boolean;
    clubId: string | null;
    clubName: string;
    clubLogo: string;
    verify: (pin: string) => Promise<boolean>;
    logout: () => void;
}

export function usePinAccess(type: PinType): PinAccessResult {
    const { club, loading: clubLoading } = useClubContext();
    const clubId = club?.id ?? null;

    // Optimistically seed from localStorage — no loading flash if PIN is stored
    const _storedPinAtMount = clubId ? localStorage.getItem(getStorageKey(clubId, type)) : null;
    const [isVerified, setIsVerified] = useState(!!_storedPinAtMount);
    // Start loading=false if we already have both club data AND a stored PIN,
    // so the dashboard renders immediately. Otherwise show loading until resolved.
    const [isLoading, setIsLoading] = useState(clubLoading || (!clubId && !_storedPinAtMount));

    // Background verification — revoke access if PIN is stale, but never block render
    useEffect(() => {
        if (clubLoading) return;
        if (!clubId) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        const key = getStorageKey(clubId, type);
        const storedPin = localStorage.getItem(key);

        if (!storedPin) {
            setIsVerified(false);
            setIsLoading(false);
            return;
        }

        // We already set isVerified=true optimistically above.
        // Now verify in the background — revoke only if the PIN has changed.
        fetchClubPin(clubId, type)
            .then((currentPin) => {
                if (cancelled) return;
                if (!currentPin || storedPin.trim() !== currentPin) {
                    // PIN changed on server — revoke silently
                    localStorage.removeItem(key);
                    setIsVerified(false);
                }
                // else: PIN still valid, isVerified stays true
            })
            .catch(() => {
                // Network/Firestore error — keep access, don't lock user out
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clubId, clubLoading, type]);

    async function verify(pin: string): Promise<boolean> {
        if (!clubId) return false;
        const currentPin = await fetchClubPin(clubId, type);
        if (!currentPin) return false;
        if (pin.trim() === currentPin) {
            localStorage.setItem(getStorageKey(clubId, type), pin.trim());
            setIsVerified(true);
            return true;
        }
        return false;
    }

    function logout() {
        if (clubId) {
            localStorage.removeItem(getStorageKey(clubId, type));
        }
        setIsVerified(false);
    }

    return {
        isVerified,
        isLoading: isLoading || clubLoading,
        clubId,
        clubName: club?.name ?? "",
        clubLogo: club?.logo ?? "",
        verify,
        logout,
    };
}
