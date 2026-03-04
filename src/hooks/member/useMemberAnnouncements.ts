import { useEffect, useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    arrayUnion,
    writeBatch,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Announcement } from "@/types/firestore";

function isAnnouncementForMember(
    announcement: Announcement,
    memberType?: string | null,
    membershipTier?: string | null
): boolean {
    const target = announcement.sentTo;

    // Safety check for future-scheduled announcements
    if (announcement.scheduledFor && announcement.scheduledFor.toDate() > new Date()) {
        return false;
    }

    if (target === "All Members") return true;

    const isVisiting = memberType === "visiting" || (!membershipTier && !memberType);
    const isPaid = !isVisiting;

    // Using simple lowercased matching or direct compares
    if (target === "Visiting Members Only") return isVisiting;
    if (target === "All Paid Members") return isPaid;

    const tier = (membershipTier || memberType || "").toLowerCase();

    if (target === "Bronze Members") return tier === "bronze";
    if (target === "Silver Members") return tier === "silver";
    if (target === "Gold Members") return tier === "gold";
    if (target === "Platinum Members") return tier === "platinum";

    // Fallback just in case
    return true;
}

export function useMyAnnouncements(
    clubId: string | null,
    memberId: string | null,
    memberType?: string | null,
    membershipTier?: string | null
) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clubId || !memberId) {
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
                const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));

                // Filter for this specific member
                const filtered = results.filter((a) => isAnnouncementForMember(a, memberType, membershipTier));

                // Sort pinned first, then by date descending
                filtered.sort((a, b) => {
                    if (a.isPinned !== b.isPinned) {
                        return a.isPinned ? -1 : 1;
                    }
                    const aTime = a.createdAt?.toMillis() ?? 0;
                    const bTime = b.createdAt?.toMillis() ?? 0;
                    return bTime - aTime;
                });

                setAnnouncements(filtered);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [clubId, memberId, memberType, membershipTier]);

    return { announcements, loading, error };
}

export function useUnreadAnnouncementsCount(
    clubId: string | null,
    memberId: string | null,
    memberType?: string | null,
    membershipTier?: string | null
) {
    const { announcements } = useMyAnnouncements(clubId, memberId, memberType, membershipTier);

    const unreadCount = useMemo(() => {
        if (!memberId || !announcements) return 0;
        return announcements.filter(a => !a.readBy?.includes(memberId)).length;
    }, [announcements, memberId]);

    return unreadCount;
}

export function useMarkAsRead() {
    return useMutation({
        mutationFn: async ({ announcementId, memberId }: { announcementId: string, memberId: string }) => {
            if (!announcementId || !memberId) throw new Error("Missing params");

            const ref = doc(db, "announcements", announcementId);
            await updateDoc(ref, {
                readBy: arrayUnion(memberId)
            });
        }
    });
}

export function useMarkAllAsRead() {
    return useMutation({
        mutationFn: async ({ announcements, memberId }: { announcements: Announcement[], memberId: string }) => {
            if (!announcements || !memberId) return;

            const unread = announcements.filter(a => !a.readBy?.includes(memberId));
            if (unread.length === 0) return;

            const batch = writeBatch(db);
            unread.forEach(a => {
                const ref = doc(db, "announcements", a.id);
                batch.update(ref, {
                    readBy: arrayUnion(memberId)
                });
            });

            await batch.commit();
        }
    });
}
