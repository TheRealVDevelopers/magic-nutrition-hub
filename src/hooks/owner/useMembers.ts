import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types/firestore";

export function useMembers(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-members", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(collection(db, `clubs/${clubId}/members`), orderBy("name"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
        },
    });
}

export function useMember(clubId: string | null, memberId: string | null) {
    return useQuery({
        queryKey: ["owner-member", clubId, memberId],
        enabled: !!clubId && !!memberId,
        queryFn: async () => {
            const snap = await getDoc(doc(db, `clubs/${clubId}/members`, memberId!));
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() } as User;
        },
    });
}

export function useAddMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: { clubId: string; member: Partial<User> }) => {
            // Count existing members to generate ID
            const q = query(collection(db, `clubs/${data.clubId}/members`));
            const snap = await getDocs(q);
            const nextNum = snap.size + 1;
            const memberId = `MNC${String(nextNum).padStart(4, "0")}`;

            const now = Timestamp.now();
            const memberDoc = {
                ...data.member,
                clubId: data.clubId,
                originalClubId: data.clubId,
                role: "member" as const,
                status: "active" as const,
                qrCode: memberId,
                isClubOwner: false,
                ownedClubId: null,
                parentUserId: data.member.referredBy || null,
                treePath: memberId,
                createdAt: now,
                updatedAt: now,
            };

            const ref = await addDoc(collection(db, `clubs/${data.clubId}/members`), memberDoc);

            // Create wallet
            const { setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, `clubs/${data.clubId}/members/${ref.id}/wallet`, "data"), {
                userId: ref.id,
                clubId: data.clubId,
                currencyName: "MNC Currency",
                balance: 0,
                lastUpdated: now,
            });

            return { id: ref.id, memberId };
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["owner-members", vars.clubId] });
        },
    });
}

export function useUpdateMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ clubId, memberId, data }: { clubId: string; memberId: string; data: Partial<User> }) => {
            await updateDoc(doc(db, `clubs/${clubId}/members`, memberId), { ...data, updatedAt: Timestamp.now() } as any);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-member"] });
            qc.invalidateQueries({ queryKey: ["owner-members"] });
        },
    });
}
