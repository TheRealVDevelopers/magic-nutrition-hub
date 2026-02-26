import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, getDoc, doc, setDoc, Timestamp, writeBatch, where } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { WeightLog, Referral, User } from "@/types/firestore";

// ─── WEIGHT PROGRESS ────────────────────────────────────────────────────────

export function useWeightLogs() {
    const { firebaseUser } = useAuth();
    return useQuery({
        queryKey: ["weightLogs", firebaseUser?.uid],
        queryFn: async () => {
            if (!firebaseUser) return [];
            const snap = await getDocs(
                query(collection(db, "users", firebaseUser.uid, "weightLog"), orderBy("date", "desc"))
            );
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightLog));
        },
        enabled: !!firebaseUser,
    });
}

export function useAddWeightLog() {
    const qc = useQueryClient();
    const { firebaseUser } = useAuth();

    return useMutation({
        mutationFn: async ({ weight, date, notes }: { weight: number, date: string, notes: string }) => {
            if (!firebaseUser) throw new Error("Not auth");
            const id = "wl_" + Date.now();
            const d = new Date(date);
            await setDoc(doc(db, "users", firebaseUser.uid, "weightLog", id), {
                id,
                weight,
                date: Timestamp.fromDate(d),
                notes,
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["weightLogs"] }),
    });
}

// ─── BIRTHDAY & ANNIVERSARY POPUP LOGIC ────────────────────────────────────────

export function useBirthdayAnniversaryCheck() {
    const { firebaseUser } = useAuth();
    const [peopleToCelebrate, setPeopleToCelebrate] = useState<{ birthdays: User[], anniversaries: User[] } | null>(null);

    useEffect(() => {
        if (!firebaseUser) return;

        // Check if shown this session
        if (sessionStorage.getItem("birthdaysShown")) return;

        const checkDates = async () => {
            try {
                const rootSnap = await getDoc(doc(db, "users", firebaseUser.uid));
                if (!rootSnap.exists()) return;
                const rootUser = { id: rootSnap.id, ...rootSnap.data() } as User;

                const allUsersSnap = await getDocs(
                    query(collection(db, "users"), where("originalClubId", "==", rootUser.originalClubId))
                );
                const allUsers = allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

                // Filter users in my tree (either they are under me, or I am under them, or direct parent)
                // A simple approach: just check people in my club
                const myClubUsers = allUsers.filter(u => u.clubId === rootUser.clubId);

                const today = new Date();
                const currentMonth = today.getMonth();
                const currentDay = today.getDate();

                const birthdays = myClubUsers.filter(u => {
                    if (!u.dob) return false;
                    const d = u.dob.toDate();
                    return d.getMonth() === currentMonth && d.getDate() === currentDay;
                });

                const anniversaries = myClubUsers.filter(u => {
                    if (!u.anniversary) return false;
                    const d = u.anniversary.toDate();
                    return d.getMonth() === currentMonth && d.getDate() === currentDay;
                });

                if (birthdays.length > 0 || anniversaries.length > 0) {
                    setPeopleToCelebrate({ birthdays, anniversaries });
                }
            } catch (err) { }
        };

        checkDates();
    }, [firebaseUser]);

    const dismiss = () => {
        sessionStorage.setItem("birthdaysShown", "true");
        setPeopleToCelebrate(null);
    };

    return { peopleToCelebrate, dismiss };
}



// ─── REFERRALS ────────────────────────────────────────────────────────

export function useReferralsList() {
    const { firebaseUser } = useAuth();
    return useQuery({
        queryKey: ["referrals", firebaseUser?.uid],
        queryFn: async () => {
            if (!firebaseUser) return [];
            const snap = await getDocs(
                query(collection(db, "referrals"), where("referrerId", "==", firebaseUser.uid))
            );

            const refs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Referral));

            // Fetch details of those users
            const detailed = [];
            for (const r of refs) {
                const uSnap = await getDoc(doc(db, "users", r.referredId));
                if (uSnap.exists()) {
                    detailed.push({
                        ...r,
                        referredUser: { id: uSnap.id, ...uSnap.data() } as User
                    });
                }
            }
            return detailed;
        },
        enabled: !!firebaseUser,
    });
}
