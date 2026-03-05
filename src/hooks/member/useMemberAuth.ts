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
                // Try to find the member under the current club's members collection by email
                // Note: member document ID usually doesn't match fbUser.uid
                if (fbUser.email) {
                    const q = query(
                        collection(db, `clubs/${club.id}/members`),
                        where("email", "==", fbUser.email)
                    );
                    const qSnap = await getDocs(q);
                    if (!qSnap.empty) {
                        const data = qSnap.docs[0].data();
                        setMember({ id: qSnap.docs[0].id, clubId: club.id, ...data, role: "member" } as unknown as User);
                    } else {
                        setMember(null);
                        setError("No member account found for this club.");
                    }
                } else {
                    setMember(null);
                    setError("No email found in authentication.");
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
