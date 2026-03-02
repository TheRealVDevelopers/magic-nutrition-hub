import { useQuery } from "@tanstack/react-query";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
} from "firebase/firestore";
import { Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Announcement } from "@/types/firestore";

function formatAnnouncementDate(ts: { toDate?: () => Date } | null | undefined): string {
    const date = ts?.toDate?.();
    if (!date) return "";
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) {
        return formatDistanceToNow(date, { addSuffix: true });
    }
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

export default function MemberAnnouncements() {
    const { userProfile } = useAuth();
    const { club } = useClubContext();

    const {
        data: announcements,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["announcements", club?.id],
        queryFn: async () => {
            if (!club?.id) return [];
            const q = query(
                collection(db, "announcements"),
                where("clubId", "==", club.id),
                where("isActive", "==", true),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Announcement[];
        },
        enabled: !!club?.id && !!userProfile,
    });

    if (isLoading) {
        return (
            <div
                className="min-h-screen p-4 pb-20"
                style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "#f8fffe" }}
            >
                <div className="mx-auto max-w-2xl space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="flex min-h-screen items-center justify-center p-4"
                style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "#f8fffe" }}
            >
                <p className="text-center text-red-600">
                    Failed to load announcements. Please try again.
                </p>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen p-4 pb-20"
            style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "#f8fffe" }}
        >
            <div className="mx-auto max-w-2xl space-y-4">
                <h1 className="text-xl font-bold" style={{ color: "#2d9653" }}>
                    Announcements
                </h1>

                {!announcements?.length ? (
                    <Card className="rounded-2xl border-0 bg-white shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Megaphone className="mb-4 h-16 w-16 text-muted-foreground/50" />
                            <p className="text-center text-muted-foreground">
                                No announcements yet
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {announcements.map((ann) => (
                            <Card
                                key={ann.id}
                                className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-shadow hover:shadow-md"
                            >
                                <CardHeader className="pb-2">
                                    <h2 className="text-base font-bold leading-tight" style={{ color: "#2d9653" }}>
                                        {ann.title}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {formatAnnouncementDate(ann.createdAt)}
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="whitespace-pre-wrap text-sm text-foreground/90">
                                        {ann.message}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
