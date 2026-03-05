import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection, query, where, orderBy, getDocs, addDoc, updateDoc,
    doc, serverTimestamp, increment, arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkMilestones, type MilestoneData } from "@/utils/checkMilestones";
import type { WeighIn, User } from "@/types/firestore";

// ─── Fetch weigh-ins for a club (optionally filtered by member) ──────────────

export function useWeighIns(clubId: string | null, memberId?: string) {
    return useQuery({
        queryKey: ["weighIns", clubId, memberId ?? "all"],
        enabled: !!clubId,
        queryFn: async () => {
            if (memberId) {
                const q = query(
                    collection(db, `clubs/${clubId}/members/${memberId}/weighIns`),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeighIn));
            } else {
                // Fetch all members, then all weigh-ins
                const membersQ = query(collection(db, `clubs/${clubId}/members`));
                const memberSnap = await getDocs(membersQ);
                let allWeighIns: WeighIn[] = [];

                for (const memberDoc of memberSnap.docs) {
                    const wSnap = await getDocs(
                        query(collection(db, `clubs/${clubId}/members/${memberDoc.id}/weighIns`), orderBy("createdAt", "desc"))
                    );
                    for (const d of wSnap.docs) {
                        allWeighIns.push({ id: d.id, ...d.data() } as WeighIn);
                    }
                }
                return allWeighIns.sort((a, b) => {
                    const tA = a.createdAt?.toMillis?.() || 0;
                    const tB = b.createdAt?.toMillis?.() || 0;
                    return tB - tA;
                });
            }
        },
    });
}

// ─── Record a weigh-in ──────────────────────────────────────────────────────

interface RecordWeighInInput {
    memberId: string;
    clubId: string;
    weight: number;
    notes?: string;
    recordedBy: "owner" | "member";
    previousWeight: number | null;
    startingWeight: number;
    targetWeight: number;
    existingBadges: string[];
    totalWeighIns: number;
}

interface RecordWeighInResult {
    change: number | null;
    newBadges: string[];
}

export function useRecordWeighIn() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (input: RecordWeighInInput): Promise<RecordWeighInResult> => {
            const {
                memberId, clubId, weight, notes, recordedBy,
                previousWeight, startingWeight, targetWeight,
                existingBadges, totalWeighIns,
            } = input;

            const change = previousWeight !== null ? +(previousWeight - weight).toFixed(1) : null;
            const today = new Date().toISOString().split("T")[0]; // "2026-03-05"

            // 1. Write weigh-in document
            await addDoc(collection(db, `clubs/${clubId}/members/${memberId}/weighIns`), {
                memberId,
                clubId,
                weight,
                date: today,
                previousWeight: previousWeight ?? null,
                change,
                notes: notes || "",
                recordedBy,
                createdAt: serverTimestamp(),
            });

            // 2. Update member profile
            const memberUpdate: Record<string, unknown> = {
                currentWeight: weight,
                lastWeighIn: serverTimestamp(),
                totalWeighIns: increment(1),
            };
            // Set startingWeight if first weigh-in
            if (!startingWeight && totalWeighIns === 0) {
                memberUpdate.startingWeight = weight;
            }
            await updateDoc(doc(db, `clubs/${clubId}/members`, memberId), memberUpdate);

            // 3. Check milestones
            const totalLost = (startingWeight || weight) - weight;
            const milestoneData: MilestoneData = {
                weighInCount: totalWeighIns + 1,
                totalLost,
                currentWeight: weight,
                targetWeight: targetWeight || 0,
            };
            const newBadges = checkMilestones(milestoneData, existingBadges);

            if (newBadges.length > 0) {
                await updateDoc(doc(db, `clubs/${clubId}/members`, memberId), {
                    badges: arrayUnion(...newBadges),
                });
            }

            return { change, newBadges };
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["weighIns", vars.clubId] });
            qc.invalidateQueries({ queryKey: ["member-weighIns", vars.memberId] });
            qc.invalidateQueries({ queryKey: ["leaderboard", vars.clubId] });
            qc.invalidateQueries({ queryKey: ["drastic-changes", vars.clubId] });
        },
    });
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
    memberId: string;
    memberName: string;
    memberPhoto: string;
    weightLost: number;
    badges: string[];
}

export function useLeaderboard(clubId: string | null, period: "month" | "alltime") {
    return useQuery({
        queryKey: ["leaderboard", clubId, period],
        enabled: !!clubId,
        queryFn: async () => {
            const membersSnap = await getDocs(query(collection(db, `clubs/${clubId}/members`)));
            const memberMap: Record<string, User> = {};
            for (const d of membersSnap.docs) memberMap[d.id] = d.data() as User;

            const entries: LeaderboardEntry[] = [];

            if (period === "alltime") {
                // All-time: use startingWeight vs currentWeight from members
                for (const d of membersSnap.docs) {
                    const m = d.data() as User;
                    const start = m.startingWeight ?? 0;
                    const current = m.currentWeight ?? 0;
                    const lost = start - current;
                    if (start > 0 && lost > 0) {
                        entries.push({
                            memberId: d.id,
                            memberName: m.name,
                            memberPhoto: m.photo || "",
                            weightLost: +lost.toFixed(1),
                            badges: m.badges || [],
                        });
                    }
                }
                return entries.sort((a, b) => b.weightLost - a.weightLost).slice(0, 10);
            } else {
                // This month: first weigh-in vs last weigh-in of month for each member
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

                for (const d of membersSnap.docs) {
                    const wSnap = await getDocs(
                        query(
                            collection(db, `clubs/${clubId}/members/${d.id}/weighIns`),
                            where("date", ">=", monthStart),
                            orderBy("date", "asc")
                        )
                    );

                    if (wSnap.empty) continue;

                    const weighIns = wSnap.docs.map(doc => doc.data() as WeighIn);
                    const first = weighIns[0].weight;
                    const last = weighIns[weighIns.length - 1].weight;
                    const lost = +(first - last).toFixed(1);

                    if (lost > 0) {
                        const m = memberMap[d.id];
                        entries.push({
                            memberId: d.id,
                            memberName: m?.name ?? "Unknown",
                            memberPhoto: m?.photo ?? "",
                            weightLost: lost,
                            badges: m?.badges || [],
                        });
                    }
                }
                return entries.sort((a, b) => b.weightLost - a.weightLost).slice(0, 10);
            }
        },
    });
}

// ─── Drastic Change Alerts ──────────────────────────────────────────────────

export interface DrasticChangeAlert {
    memberId: string;
    memberName: string;
    memberPhoto: string;
    change: number;          // positive = lost, negative = gained
    type: "gained" | "lost_fast";
}

export function useDrasticChanges(clubId: string | null) {
    return useQuery({
        queryKey: ["drastic-changes", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = weekAgo.toISOString().split("T")[0];

            const membersSnap = await getDocs(query(collection(db, `clubs/${clubId}/members`)));
            const alerts: DrasticChangeAlert[] = [];

            for (const d of membersSnap.docs) {
                const wSnap = await getDocs(
                    query(
                        collection(db, `clubs/${clubId}/members/${d.id}/weighIns`),
                        where("date", ">=", weekAgoStr),
                        orderBy("date", "asc")
                    )
                );

                if (wSnap.size < 2) continue;

                const weighIns = wSnap.docs.map(doc => doc.data() as WeighIn);
                const first = weighIns[0].weight;
                const last = weighIns[weighIns.length - 1].weight;
                const change = +(first - last).toFixed(1); // positive = lost

                const m = d.data() as User;

                if (change < -2) {
                    // Gained more than 2kg
                    alerts.push({
                        memberId: d.id,
                        memberName: m?.name ?? "Unknown",
                        memberPhoto: m?.photo ?? "",
                        change,
                        type: "gained",
                    });
                } else if (change > 3) {
                    // Lost more than 3kg (too fast)
                    alerts.push({
                        memberId: d.id,
                        memberName: m?.name ?? "Unknown",
                        memberPhoto: m?.photo ?? "",
                        change,
                        type: "lost_fast",
                    });
                }
            }
            return alerts;
        },
    });
}

