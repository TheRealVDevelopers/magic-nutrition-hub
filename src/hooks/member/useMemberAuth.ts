import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useClubContext } from "@/lib/clubDetection";
import type { User } from "@/types/firestore";

interface MemberAuthResult {
    member: User | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

export function useMemberAuth(): MemberAuthResult {
    const { club } = useClubContext();
    const [member, setMember] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser || !club) {
                setMember(null);
                setLoading(false);
                return;
            }
            try {
                // Try by uid first
                const snap = await getDoc(doc(db, "users", fbUser.uid));
                if (snap.exists()) {
                    const data = { id: snap.id, ...snap.data() } as User;
                    if (data.clubId === club.id && data.role === "member") {
                        setMember(data);
                        setLoading(false);
                        return;
                    }
                }
                // Fallback: query by email + clubId
                const q = query(collection(db, "users"), where("email", "==", fbUser.email), where("clubId", "==", club.id), where("role", "==", "member"));
                const qSnap = await getDocs(q);
                if (!qSnap.empty) {
                    setMember({ id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as User);
                } else {
                    setMember(null);
                    setError("No member account found for this club.");
                }
            } catch (e: any) {
                setError(e.message);
                setMember(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [club]);

    const signIn = async (email: string, password: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e: any) {
            if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") throw new Error("Incorrect password");
            if (e.code === "auth/user-not-found") throw new Error("No account found with this email");
            if (e.code === "auth/too-many-requests") throw new Error("Too many attempts. Try again later.");
            throw e;
        }
    };

    const signOut = async () => {
        await fbSignOut(auth);
        setMember(null);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return { member, loading, error, signIn, signOut, resetPassword };
}
