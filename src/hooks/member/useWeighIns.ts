import { useQuery } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { WeighIn, User } from "@/types/firestore";
import type { LeaderboardEntry } from "@/hooks/owner/useWeighIns";

// ─── My weigh-ins ───────────────────────────────────────────────────────────

export function useMyWeighIns() {
    const { firebaseUser } = useAuth();
    return useQuery({
        queryKey: ["member-weighIns", firebaseUser?.uid],
        enabled: !!firebaseUser,
        queryFn: async () => {
            const q = query(
                collection(db, "weighIns"),
                where("memberId", "==", firebaseUser!.uid),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeighIn));
        },
    });
}

// ─── My badges ──────────────────────────────────────────────────────────────

export function useMyBadges() {
    const { userProfile } = useAuth();
    return userProfile?.badges ?? [];
}

// ─── My rank ────────────────────────────────────────────────────────────────

export function useMyRank(period: "month" | "alltime") {
    const { firebaseUser } = useAuth();
    const { club } = useClubContext();

    return useQuery({
        queryKey: ["my-rank", club?.id, period, firebaseUser?.uid],
        enabled: !!firebaseUser && !!club,
        queryFn: async () => {
            if (period === "alltime") {
                const snap = await getDocs(
                    query(collection(db, "users"), where("clubId", "==", club!.id), where("role", "==", "member"))
                );
                const entries: { memberId: string; lost: number }[] = [];
                for (const d of snap.docs) {
                    const m = d.data() as User;
                    const start = m.startingWeight ?? 0;
                    const current = m.currentWeight ?? 0;
                    const lost = start - current;
                    if (start > 0 && lost > 0) entries.push({ memberId: d.id, lost: +lost.toFixed(1) });
                }
                entries.sort((a, b) => b.lost - a.lost);
                const idx = entries.findIndex((e) => e.memberId === firebaseUser!.uid);
                return idx === -1 ? null : idx + 1;
            } else {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                const snap = await getDocs(
                    query(
                        collection(db, "weighIns"),
                        where("clubId", "==", club!.id),
                        where("date", ">=", monthStart),
                        orderBy("date", "asc")
                    )
                );
                const memberWeighIns: Record<string, WeighIn[]> = {};
                for (const d of snap.docs) {
                    const w = { id: d.id, ...d.data() } as WeighIn;
                    if (!memberWeighIns[w.memberId]) memberWeighIns[w.memberId] = [];
                    memberWeighIns[w.memberId].push(w);
                }
                const entries: { memberId: string; lost: number }[] = [];
                for (const [mid, weighIns] of Object.entries(memberWeighIns)) {
                    if (weighIns.length < 1) continue;
                    const first = weighIns[0].weight;
                    const last = weighIns[weighIns.length - 1].weight;
                    const lost = +(first - last).toFixed(1);
                    if (lost > 0) entries.push({ memberId: mid, lost });
                }
                entries.sort((a, b) => b.lost - a.lost);
                const idx = entries.findIndex((e) => e.memberId === firebaseUser!.uid);
                return idx === -1 ? null : idx + 1;
            }
        },
    });
}
