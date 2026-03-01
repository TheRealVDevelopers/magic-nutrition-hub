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
import type { Enquiry } from "@/types/firestore";

// ─── useEnquiries ────────────────────────────────────────────────────────

export function useEnquiries(clubId?: string) {
    return useQuery({
        queryKey: ["superadmin", "enquiries", clubId ?? "all"],
        queryFn: async () => {
            let q;
            if (clubId) {
                q = query(
                    collection(db, "enquiries"),
                    where("clubId", "==", clubId),
                    orderBy("createdAt", "desc")
                );
            } else {
                q = query(
                    collection(db, "enquiries"),
                    orderBy("createdAt", "desc")
                );
            }
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Enquiry);
        },
    });
}

// ─── useUpdateEnquiryStatus ──────────────────────────────────────────────

export function useUpdateEnquiryStatus() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({
            enquiryId,
            status,
        }: {
            enquiryId: string;
            status: Enquiry["status"];
        }) => {
            await updateDoc(doc(db, "enquiries", enquiryId), { status });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["superadmin", "enquiries"] });
        },
    });
}

// ─── useUnreadEnquiryCount ───────────────────────────────────────────────

export function useUnreadEnquiryCount() {
    return useQuery({
        queryKey: ["superadmin", "enquiries", "unread-count"],
        queryFn: async () => {
            const snap = await getDocs(
                query(
                    collection(db, "enquiries"),
                    where("status", "==", "new")
                )
            );
            return snap.size;
        },
        refetchInterval: 60_000,
    });
}

// ─── exportEnquiriesToCSV ────────────────────────────────────────────────

export function exportEnquiriesToCSV(enquiries: Enquiry[], filename = "enquiries.csv") {
    const headers = [
        "Name", "Phone", "WhatsApp", "Email", "Address", "DOB",
        "Current Weight", "Target Weight", "Health Conditions",
        "Referred By", "Status", "Date",
    ];

    const rows = enquiries.map((e) => [
        e.name,
        e.phone,
        e.whatsapp ?? "",
        e.email ?? "",
        e.address ?? "",
        e.dob ?? "",
        e.currentWeight ?? "",
        e.targetWeight ?? "",
        e.healthConditions ?? "",
        e.referredBy ?? "",
        e.status,
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
