import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection,
    doc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ClubFeedback } from "@/types/firestore";

// ─── useClubFeedback ─────────────────────────────────────────────────────
// Fetches messages/requests FROM club owners TO the super admin platform

export function useClubFeedback(clubId?: string) {
    return useQuery({
        queryKey: ["superadmin", "club-feedback", clubId ?? "all"],
        queryFn: async () => {
            let q;
            if (clubId) {
                q = query(
                    collection(db, "clubFeedback"),
                    where("clubId", "==", clubId),
                    orderBy("createdAt", "desc")
                );
            } else {
                q = query(
                    collection(db, "clubFeedback"),
                    orderBy("createdAt", "desc")
                );
            }
            const snap = await getDocs(q);
            return snap.docs.map((d) => {
                const data = d.data() as Omit<ClubFeedback, 'id'>;
                return { ...data, id: d.id } as ClubFeedback;
            });
        },
    });
}

// ─── useUpdateClubFeedbackStatus ─────────────────────────────────────────

export function useUpdateClubFeedbackStatus() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            feedbackId,
            status,
            reply,
        }: {
            feedbackId: string;
            status: ClubFeedback["status"];
            reply?: string;
        }) => {
            const updates: Record<string, unknown> = { status };
            if (reply !== undefined) {
                updates.reply = reply;
                updates.repliedAt = Timestamp.now();
            }
            await updateDoc(doc(db, "clubFeedback", feedbackId), updates);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["superadmin", "club-feedback"] });
        },
    });
}

// ─── useUnreadClubFeedbackCount ──────────────────────────────────────────

export function useUnreadClubFeedbackCount() {
    return useQuery({
        queryKey: ["superadmin", "club-feedback", "unread-count"],
        queryFn: async () => {
            const snap = await getDocs(
                query(
                    collection(db, "clubFeedback"),
                    where("status", "==", "new")
                )
            );
            return snap.size;
        },
        refetchInterval: 60_000,
    });
}

// ─── exportClubFeedbackToCSV ─────────────────────────────────────────────

export function exportClubFeedbackToCSV(items: ClubFeedback[], filename = "club-feedback.csv") {
    const headers = [
        "Club", "Sender", "Email", "Category", "Subject", "Message",
        "Status", "Reply", "Date",
    ];

    const rows = items.map((e) => [
        e.clubName,
        e.senderName,
        e.senderEmail,
        e.category,
        e.subject,
        e.message,
        e.status,
        e.reply ?? "",
        e.createdAt instanceof Timestamp
            ? e.createdAt.toDate().toLocaleDateString("en-IN")
            : "",
    ]);

    const csvContent = [headers, ...rows]
        .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
