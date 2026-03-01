import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/firestore";

export function useMenuItems(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-menu", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(collection(db, "products"), where("clubId", "==", clubId), orderBy("category"), orderBy("name"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        },
    });
}

export function useAddMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: { clubId: string; item: Partial<Product> }) => {
            const now = Timestamp.now();
            await addDoc(collection(db, "products"), {
                clubId: data.clubId,
                name: data.item.name || "",
                category: data.item.category || "other",
                price: data.item.price || 0,
                stock: data.item.stock ?? 100,
                lowStockThreshold: data.item.lowStockThreshold ?? 10,
                expiryDate: null,
                photo: data.item.photo || "",
                isAvailableToday: data.item.isAvailableToday ?? true,
                createdAt: now,
                updatedAt: now,
            });
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["owner-menu", vars.clubId] });
        },
    });
}

export function useUpdateMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<Product> }) => {
            await updateDoc(doc(db, "products", itemId), { ...data, updatedAt: Timestamp.now() } as any);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-menu"] });
        },
    });
}

export function useDeleteMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (itemId: string) => {
            await deleteDoc(doc(db, "products", itemId));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-menu"] });
        },
    });
}

export function useToggleAvailability() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ itemId, available }: { itemId: string; available: boolean }) => {
            await updateDoc(doc(db, "products", itemId), { isAvailableToday: available, updatedAt: Timestamp.now() });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-menu"] });
        },
    });
}
