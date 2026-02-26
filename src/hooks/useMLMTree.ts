import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { User } from "@/types/firestore";

export interface TreeNode {
    user: User;
    children: TreeNode[];
    depth: number;
}

export function useMyTree() {
    const { firebaseUser } = useAuth();
    const [tree, setTree] = useState<TreeNode | null>(null);
    const [directReferrals, setDirectReferrals] = useState(0);
    const [totalNetworkCount, setTotalNetworkCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!firebaseUser) return;
        const fetchTree = async () => {
            try {
                const uid = firebaseUser.uid;

                // 1. Fetch current user
                const rootSnap = await getDoc(doc(db, "users", uid));
                if (!rootSnap.exists()) throw new Error("User not found");
                const rootUser = { id: rootSnap.id, ...rootSnap.data() } as User;

                // 2. Fetch all users whose treePath contains the current user's ID
                // Note: checking if treePath contains uid
                const allUsersSnap = await getDocs(
                    query(collection(db, "users"), where("treePath", ">=", uid), where("treePath", "<=", uid + "\uf8ff"))
                );
                let downline = allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

                // Wait, the query above only works if treePath STARTS with uid. 
                // In our data model, treePath might be "parent1/parent2/uid/child".
                // Instead, a better way is to fetch ALL users in the club and filter in memory, 
                // OR rely on array-contains if we stored treePath as an array. 
                // Since it's a string, we cannot query "contains" efficiently in Firestore.
                // Let's just fetch ALL users for this club and build in memory, or use `originalClubId`.
                const clubUsersSnap = await getDocs(
                    query(collection(db, "users"), where("originalClubId", "==", rootUser.originalClubId))
                );
                const allUsersInClub = clubUsersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));

                // Filter those who have `uid` in their treePath (and are not the rootUser themselves)
                downline = allUsersInClub.filter(u => u.treePath.includes(uid) && u.id !== uid);

                // Build Tree structure recursively
                const buildTree = (user: User, depth: number): TreeNode => {
                    const childrenUsers = downline.filter(u => u.parentUserId === user.id);
                    const childrenNodes = childrenUsers.map(child => buildTree(child, depth + 1));
                    return {
                        user,
                        depth,
                        children: childrenNodes
                    };
                };

                const rootNode = buildTree(rootUser, 0);

                setTree(rootNode);
                setTotalNetworkCount(downline.length);
                setDirectReferrals(downline.filter(u => u.referredBy === uid || u.parentUserId === uid).length);
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchTree();
    }, [firebaseUser]);

    return { tree, directReferrals, totalNetworkCount, loading, error };
}

export function useUserBasicProfile(userId: string) {
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        const fetchProfile = async () => {
            try {
                const snap = await getDoc(doc(db, "users", userId));
                if (snap.exists()) setProfile({ id: snap.id, ...snap.data() } as User);
            } catch (e) { }
            setLoading(false);
        };
        fetchProfile();
    }, [userId]);

    return { profile, loading };
}

export function useDirectReferrals() {
    const { firebaseUser } = useAuth();
    const [referrals, setReferrals] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser) return;
        const fetchReferrals = async () => {
            try {
                const snap = await getDocs(
                    query(collection(db, "users"), where("referredBy", "==", firebaseUser.uid))
                );
                setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
            } catch (e) { }
            setLoading(false);
        };
        fetchReferrals();
    }, [firebaseUser]);

    return { referrals, count: referrals.length, loading, error: null };
}
