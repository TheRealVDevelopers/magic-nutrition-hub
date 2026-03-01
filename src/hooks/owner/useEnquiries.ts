import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Enquiry } from "@/types/firestore";

export function useEnquiries(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-enquiries", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(collection(db, "enquiries"), where("clubId", "==", clubId), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry));
        },
    });
}

export function useUnreadEnquiryCount(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-enquiries-unread", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(collection(db, "enquiries"), where("clubId", "==", clubId), where("status", "==", "new"));
            const snap = await getDocs(q);
            return snap.size;
        },
        refetchInterval: 30000,
    });
}

export function useUpdateEnquiryStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ enquiryId, status, notes }: { enquiryId: string; status: Enquiry["status"]; notes?: string }) => {
            const updates: Record<string, unknown> = { status };
            if (notes !== undefined) updates.notes = notes;
            await updateDoc(doc(db, "enquiries", enquiryId), updates);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-enquiries"] });
            qc.invalidateQueries({ queryKey: ["owner-enquiries-unread"] });
        },
    });
}
