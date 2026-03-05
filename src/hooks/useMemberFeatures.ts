import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, getDoc, doc, setDoc, Timestamp, writeBatch, where } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { WeightLog, Referral, User } from "@/types/firestore";

// ─── WEIGHT PROGRESS ────────────────────────────────────────────────────────

export function useWeightLogs() {
    const { userProfile } = useAuth();
    return useQuery({
        queryKey: ["weightLogs", userProfile?.id],
        queryFn: async () => {
            if (!userProfile) return [];
            const snap = await getDocs(
                query(collection(db, `clubs/${userProfile.clubId}/members/${userProfile.id}/weighIns`), orderBy("date", "desc"))
            );
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightLog));
        },
        enabled: !!userProfile,
    });
}

export function useAddWeightLog() {
    const qc = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: async ({ weight, date, notes }: { weight: number, date: string, notes: string }) => {
            if (!userProfile) throw new Error("Not auth");
            const id = "wl_" + Date.now();
            const d = new Date(date);
            await setDoc(doc(db, `clubs/${userProfile.clubId}/members/${userProfile.id}/weighIns`, id), {
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
    const { userProfile } = useAuth();
    const [peopleToCelebrate, setPeopleToCelebrate] = useState<{ birthdays: User[], anniversaries: User[] } | null>(null);

    useEffect(() => {
        if (!userProfile) return;

        // Check if shown this session
        if (sessionStorage.getItem("birthdaysShown")) return;

        const checkDates = async () => {
            try {
                const allUsersSnap = await getDocs(
                    query(collection(db, `clubs/${userProfile.clubId}/members`))
                );
                const myClubUsers = allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

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
    }, [userProfile]);

    const dismiss = () => {
        sessionStorage.setItem("birthdaysShown", "true");
        setPeopleToCelebrate(null);
    };

    return { peopleToCelebrate, dismiss };
}



// ─── REFERRALS ────────────────────────────────────────────────────────

export function useReferralsList() {
    const { userProfile } = useAuth();
    return useQuery({
        queryKey: ["referrals", userProfile?.id],
        queryFn: async () => {
            if (!userProfile) return [];
            const snap = await getDocs(
                query(collection(db, `clubs/${userProfile.clubId}/referrals`), where("referrerId", "==", userProfile.id))
            );

            const refs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Referral));

            // Fetch details of those users
            const detailed = [];
            for (const r of refs) {
                const uSnap = await getDoc(doc(db, `clubs/${userProfile.clubId}/members`, r.referredId));
                if (uSnap.exists()) {
                    detailed.push({
                        ...r,
                        referredUser: { id: uSnap.id, ...uSnap.data() } as User
                    });
                }
            }
            return detailed;
        },
        enabled: !!userProfile,
    });
}
