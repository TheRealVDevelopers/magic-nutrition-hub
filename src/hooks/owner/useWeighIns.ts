import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection, query, where, orderBy, getDocs, addDoc, updateDoc,
    doc, Timestamp, serverTimestamp, limit, increment, arrayUnion,
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
            const constraints = [
                where("clubId", "==", clubId),
                orderBy("createdAt", "desc"),
            ];
            if (memberId) constraints.splice(1, 0, where("memberId", "==", memberId));
            const q = query(collection(db, "weighIns"), ...constraints);
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeighIn));
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
            await addDoc(collection(db, "weighIns"), {
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
            await updateDoc(doc(db, "users", memberId), memberUpdate);

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
                await updateDoc(doc(db, "users", memberId), {
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
            if (period === "alltime") {
                // All-time: use startingWeight vs currentWeight from members
                const membersSnap = await getDocs(
                    query(collection(db, "users"), where("clubId", "==", clubId), where("role", "==", "member"))
                );
                const entries: LeaderboardEntry[] = [];
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
                // This month: first weigh-in vs last weigh-in of month
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                const weighInsSnap = await getDocs(
                    query(
                        collection(db, "weighIns"),
                        where("clubId", "==", clubId),
                        where("date", ">=", monthStart),
                        orderBy("date", "asc")
                    )
                );

                // Group by member
                const memberWeighIns: Record<string, WeighIn[]> = {};
                for (const d of weighInsSnap.docs) {
                    const w = { id: d.id, ...d.data() } as WeighIn;
                    if (!memberWeighIns[w.memberId]) memberWeighIns[w.memberId] = [];
                    memberWeighIns[w.memberId].push(w);
                }

                // Get member info
                const memberIds = Object.keys(memberWeighIns);
                if (memberIds.length === 0) return [];

                const membersSnap = await getDocs(
                    query(collection(db, "users"), where("clubId", "==", clubId), where("role", "==", "member"))
                );
                const memberMap: Record<string, User> = {};
                for (const d of membersSnap.docs) memberMap[d.id] = d.data() as User;

                const entries: LeaderboardEntry[] = [];
                for (const [mid, weighIns] of Object.entries(memberWeighIns)) {
                    if (weighIns.length < 1) continue;
                    const first = weighIns[0].weight;
                    const last = weighIns[weighIns.length - 1].weight;
                    const lost = +(first - last).toFixed(1);
                    if (lost > 0) {
                        const m = memberMap[mid];
                        entries.push({
                            memberId: mid,
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

            const snap = await getDocs(
                query(
                    collection(db, "weighIns"),
                    where("clubId", "==", clubId),
                    where("date", ">=", weekAgoStr),
                    orderBy("date", "asc")
                )
            );

            // Group by member — first vs last of week
            const memberWeighIns: Record<string, WeighIn[]> = {};
            for (const d of snap.docs) {
                const w = { id: d.id, ...d.data() } as WeighIn;
                if (!memberWeighIns[w.memberId]) memberWeighIns[w.memberId] = [];
                memberWeighIns[w.memberId].push(w);
            }

            // Get member info
            const membersSnap = await getDocs(
                query(collection(db, "users"), where("clubId", "==", clubId), where("role", "==", "member"))
            );
            const memberMap: Record<string, User> = {};
            for (const d of membersSnap.docs) memberMap[d.id] = d.data() as User;

            const alerts: DrasticChangeAlert[] = [];
            for (const [mid, weighIns] of Object.entries(memberWeighIns)) {
                if (weighIns.length < 2) continue;
                const first = weighIns[0].weight;
                const last = weighIns[weighIns.length - 1].weight;
                const change = +(first - last).toFixed(1); // positive = lost
                const m = memberMap[mid];

                if (change < -2) {
                    // Gained more than 2kg
                    alerts.push({
                        memberId: mid,
                        memberName: m?.name ?? "Unknown",
                        memberPhoto: m?.photo ?? "",
                        change,
                        type: "gained",
                    });
                } else if (change > 3) {
                    // Lost more than 3kg (too fast)
                    alerts.push({
                        memberId: mid,
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
