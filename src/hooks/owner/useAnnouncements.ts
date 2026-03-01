import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, addDoc, deleteDoc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Announcement } from "@/types/firestore";

export function useAnnouncements(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-announcements", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(collection(db, "announcements"), where("clubId", "==", clubId), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
        },
    });
}

export function useSendAnnouncement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: { clubId: string; title: string; message: string; priority?: string }) => {
            await addDoc(collection(db, "announcements"), {
                clubId: data.clubId,
                title: data.title,
                message: data.message,
                postedBy: "owner",
                createdAt: Timestamp.now(),
                expiresAt: null,
                isActive: true,
                priority: data.priority || "normal",
            });
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["owner-announcements", vars.clubId] });
        },
    });
}

export function useDeleteAnnouncement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (annId: string) => {
            await deleteDoc(doc(db, "announcements", annId));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-announcements"] });
        },
    });
}
