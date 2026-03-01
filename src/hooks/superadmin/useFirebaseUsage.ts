import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    doc,
    getDoc,
    updateDoc,
    increment,
    setDoc,
    Timestamp,
} from "firebase/firestore";
import { ref, listAll, getMetadata } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { UsageStats } from "@/types/firestore";

// ─── Cost constants ──────────────────────────────────────────────────────

const USD_TO_INR = 84;
const STORAGE_COST_PER_GB = 0.026; // USD/GB/month
const READS_COST_PER_100K = 0.06;  // USD per 100k reads
const WRITES_COST_PER_100K = 0.18; // USD per 100k writes

// ─── useClubStorageUsage ─────────────────────────────────────────────────

export function useClubStorageUsage(clubId: string) {
    return useQuery({
        queryKey: ["superadmin", "storage", clubId],
        queryFn: async () => {
            const rootRef = ref(storage, `clubs/${clubId}`);
            const allFiles: { name: string; size: number; path: string }[] = [];

            async function listRecursive(folderRef: ReturnType<typeof ref>) {
                const result = await listAll(folderRef);
                await Promise.all(
                    result.items.map(async (itemRef) => {
                        const meta = await getMetadata(itemRef);
                        allFiles.push({
                            name: itemRef.name,
                            size: meta.size ?? 0,
                            path: itemRef.fullPath,
                        });
                    })
                );
                await Promise.all(
                    result.prefixes.map((prefix) => listRecursive(prefix))
                );
            }

            try {
                await listRecursive(rootRef);
            } catch {
                // Storage path might not exist yet — return empty
            }

            const totalBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
            const totalMB = totalBytes / (1024 * 1024);

            return { files: allFiles, totalMB, totalBytes };
        },
        enabled: !!clubId,
    });
}

// ─── useClubUsageStats ───────────────────────────────────────────────────

export function useClubUsageStats(clubId: string) {
    return useQuery({
        queryKey: ["superadmin", "usageStats", clubId],
        queryFn: async () => {
            const snap = await getDoc(doc(db, "clubs", clubId, "usageStats", "counters"));
            if (!snap.exists()) {
                return { reads: 0, writes: 0, lastUpdated: null } as UsageStats & { lastUpdated: null };
            }
            return snap.data() as UsageStats;
        },
        enabled: !!clubId,
    });
}

// ─── useClubCostEstimate ─────────────────────────────────────────────────

export function useClubCostEstimate(clubId: string) {
    const storageQuery = useClubStorageUsage(clubId);
    const usageQuery = useClubUsageStats(clubId);

    const storageGB = (storageQuery.data?.totalMB ?? 0) / 1024;
    const reads = usageQuery.data?.reads ?? 0;
    const writes = usageQuery.data?.writes ?? 0;

    const storageCostUSD = storageGB * STORAGE_COST_PER_GB;
    const readsCostUSD = (reads / 100_000) * READS_COST_PER_100K;
    const writesCostUSD = (writes / 100_000) * WRITES_COST_PER_100K;
    const totalCostUSD = storageCostUSD + readsCostUSD + writesCostUSD;
    const totalCostINR = totalCostUSD * USD_TO_INR;

    return {
        storageMB: storageQuery.data?.totalMB ?? 0,
        storageGB,
        reads,
        writes,
        storageCostINR: storageCostUSD * USD_TO_INR,
        readsCostINR: readsCostUSD * USD_TO_INR,
        writesCostINR: writesCostUSD * USD_TO_INR,
        totalCostUSD,
        totalCostINR,
        isLoading: storageQuery.isLoading || usageQuery.isLoading,
        constants: { USD_TO_INR, STORAGE_COST_PER_GB, READS_COST_PER_100K, WRITES_COST_PER_100K },
    };
}

// ─── incrementUsage ──────────────────────────────────────────────────────

export async function incrementUsage(clubId: string, type: "read" | "write") {
    const statsRef = doc(db, "clubs", clubId, "usageStats", "counters");
    try {
        await updateDoc(statsRef, {
            [type === "read" ? "reads" : "writes"]: increment(1),
            lastUpdated: Timestamp.now(),
        });
    } catch {
        // Doc might not exist yet — create it
        await setDoc(
            statsRef,
            {
                reads: type === "read" ? 1 : 0,
                writes: type === "write" ? 1 : 0,
                lastUpdated: Timestamp.now(),
            },
            { merge: true }
        );
    }
}
