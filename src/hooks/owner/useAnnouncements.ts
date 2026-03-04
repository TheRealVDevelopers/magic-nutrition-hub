import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Announcement } from "@/types/firestore";

export function useAnnouncements(clubId: string | null) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clubId) {
            setAnnouncements([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "announcements"),
            where("clubId", "==", clubId),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const results = snap.docs.map(
                    (d) => ({ id: d.id, ...d.data() } as Announcement)
                );
                setAnnouncements(results);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [clubId]);

    return { announcements, loading, error };
}

export function useSendAnnouncement(clubId: string | null) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<Announcement, "id" | "clubId" | "createdAt" | "createdBy" | "readBy">) => {
            if (!clubId) throw new Error("No club ID");

            await addDoc(collection(db, "announcements"), {
                ...data,
                clubId,
                createdBy: "owner",
                createdAt: serverTimestamp(),
                readBy: [],
            });
        },
        onSuccess: () => {
            // Invalidate if needed, though onSnapshot handles real-time lists
            qc.invalidateQueries({ queryKey: ["owner-announcements"] });
        },
    });
}

export function useDeleteAnnouncement() {
    return useMutation({
        mutationFn: async (announcementId: string) => {
            if (!announcementId) throw new Error("No announcement ID");
            await deleteDoc(doc(db, "announcements", announcementId));
        },
    });
}
