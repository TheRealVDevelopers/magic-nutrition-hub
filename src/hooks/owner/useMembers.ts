import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/types/firestore";

export function useMembers(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-members", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(collection(db, "users"), where("clubId", "==", clubId), where("role", "==", "member"), orderBy("name"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
        },
    });
}

export function useMember(memberId: string | null) {
    return useQuery({
        queryKey: ["owner-member", memberId],
        enabled: !!memberId,
        queryFn: async () => {
            const snap = await getDoc(doc(db, "users", memberId!));
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
            const q = query(collection(db, "users"), where("clubId", "==", data.clubId), where("role", "==", "member"));
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
            
            const ref = await addDoc(collection(db, "users"), memberDoc);
            
            // Create wallet
            await addDoc(collection(db, "wallets"), {
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
        mutationFn: async ({ memberId, data }: { memberId: string; data: Partial<User> }) => {
            await updateDoc(doc(db, "users", memberId), { ...data, updatedAt: Timestamp.now() } as any);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-member"] });
            qc.invalidateQueries({ queryKey: ["owner-members"] });
        },
    });
}
