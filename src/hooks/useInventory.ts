import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc,
    query, where, orderBy, onSnapshot,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { Product } from "@/types/firestore";

// Helper: current date object truncated to start of day
function todayDate() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

// ─── useClubProducts ───────────────────────────────────────────────────

export function useClubProducts() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["inventory", "products", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club!.id), orderBy("createdAt", "desc"))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
        },
        enabled: !!club,
    });
}

// ─── useProductById ────────────────────────────────────────────────────

export function useProductById(productId: string) {
    return useQuery({
        queryKey: ["inventory", "product", productId],
        queryFn: async () => {
            const snap = await getDoc(doc(db, "products", productId));
            if (!snap.exists()) throw new Error("Product not found");
            return { id: snap.id, ...snap.data() } as Product;
        },
        enabled: !!productId,
    });
}

// ─── useLowStockProducts (real-time) ───────────────────────────────────

export function useLowStockProducts() {
    const { club } = useClubContext();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useState(() => {
        if (!club) return;
        const q = query(
            collection(db, "products"),
            where("clubId", "==", club.id)
        );
        const unsub = onSnapshot(q, (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
            // Filter here because Firestore doesn't allow `stock <= lowStockThreshold` (two fields comparing) in query
            const lowStock = all.filter((p) => p.stock <= p.lowStockThreshold);
            setProducts(lowStock);
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });
        return () => unsub();
    });

    return { products, loading, error };
}

// ─── useExpiringProducts ───────────────────────────────────────────────

export function useExpiringProducts(daysAhead: number = 7) {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["inventory", "expiring", club?.id, daysAhead],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club!.id))
            );
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
            const now = new Date();
            const cutoff = new Date();
            cutoff.setDate(now.getDate() + daysAhead);

            return all.filter((p) => {
                if (!p.expiryDate) return false;
                const exp = p.expiryDate.toDate();
                return exp >= now && exp <= cutoff;
            }).sort((a, b) => a.expiryDate!.toMillis() - b.expiryDate!.toMillis());
        },
        enabled: !!club,
    });
}

// ─── useExpiredProducts ────────────────────────────────────────────────

export function useExpiredProducts() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["inventory", "expired", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club!.id))
            );
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
            const now = new Date();

            return all.filter((p) => {
                if (!p.expiryDate) return false;
                return p.expiryDate.toDate() < now;
            }).sort((a, b) => b.expiryDate!.toMillis() - a.expiryDate!.toMillis());
        },
        enabled: !!club,
    });
}

// ─── useAddProduct ─────────────────────────────────────────────────────

export function useAddProduct() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async (data: Omit<Product, "id" | "clubId" | "createdAt" | "updatedAt">) => {
            if (!club) throw new Error("Club not loaded");
            const id = "prod_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
            const prod: Product = {
                ...data,
                id,
                clubId: club.id,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            await setDoc(doc(db, "products", id), prod);
            return id;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["inventory"] });
            qc.invalidateQueries({ queryKey: ["orders", "products"] });
        },
    });
}

// ─── useUpdateProduct ──────────────────────────────────────────────────

export function useUpdateProduct() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, data }: { productId: string; data: Partial<Product> }) => {
            await updateDoc(doc(db, "products", productId), {
                ...data,
                updatedAt: Timestamp.now(),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["inventory"] });
            qc.invalidateQueries({ queryKey: ["orders", "products"] });
        },
    });
}

// ─── useRestockProduct ─────────────────────────────────────────────────

export function useRestockProduct() {
    const qc = useQueryClient();
    const { firebaseUser } = useAuth();

    return useMutation({
        mutationFn: async ({ productId, currentStock, addedQty, note }: {
            productId: string; currentStock: number; addedQty: number; note: string;
        }) => {
            if (!firebaseUser) throw new Error("User not found");
            const newStock = currentStock + addedQty;
            const logId = "rstk_" + Date.now();

            // Update product stock
            await updateDoc(doc(db, "products", productId), {
                stock: newStock,
                updatedAt: Timestamp.now(),
            });

            // Add restock log
            await setDoc(doc(db, `products/${productId}/restockLog`, logId), {
                id: logId,
                quantity: addedQty,
                date: Timestamp.now(),
                addedBy: firebaseUser.uid,
                note,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["inventory"] });
        },
    });
}

// ─── useToggleTodaysSpecial ────────────────────────────────────────────

export function useToggleTodaysSpecial() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
            await updateDoc(doc(db, "products", productId), {
                isAvailableToday: isActive,
                updatedAt: Timestamp.now(),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["inventory"] });
            qc.invalidateQueries({ queryKey: ["orders", "products"] });
        },
    });
}
