import { useState } from "react";
import { Megaphone, Pin, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    useMyAnnouncements,
    useMarkAsRead,
    useMarkAllAsRead
} from "@/hooks/member/useMemberAnnouncements";
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

function AnnouncementCard({
    ann,
    memberId,
    expanded,
    onToggle
}: {
    ann: Announcement;
    memberId: string;
    expanded: boolean;
    onToggle: () => void;
}) {
    const isUnread = !ann.readBy?.includes(memberId);

    let borderColor = "bg-emerald-500";
    if (ann.priority === "urgent") borderColor = "bg-red-500";
    if (ann.priority === "important") borderColor = "bg-yellow-400";

    return (
        <div
            onClick={onToggle}
            className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all cursor-pointer hover:shadow-md ${isUnread ? 'bg-emerald-50/10' : ''}`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderColor}`} />
            <div className="p-4 pl-5">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        {ann.isPinned && <Pin className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 flex-shrink-0" />}
                        <h2 className={`text-base leading-tight pr-2 ${isUnread ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {ann.title}
                        </h2>
                    </div>
                    {isUnread && (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 flex-shrink-0">
                            New
                        </Badge>
                    )}
                </div>

                <p className={`text-sm text-gray-600 mt-2 ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                    {ann.message}
                </p>

                <p className="text-xs text-gray-400 font-medium mt-3">
                    {formatAnnouncementDate(ann.createdAt)}
                </p>
            </div>
        </div>
    );
}

export default function MemberAnnouncements() {
    const { userProfile } = useAuth();
    const { club } = useClubContext();

    const {
        announcements,
        loading,
        error,
    } = useMyAnnouncements(
        club?.id ?? null,
        userProfile?.id ?? null,
        userProfile?.memberType,
        userProfile?.membershipTier
    );

    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    // Track which cards are expanded
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const handleToggle = (ann: Announcement) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(ann.id)) {
            newExpanded.delete(ann.id);
        } else {
            newExpanded.add(ann.id);
            // Mark as read if unread
            if (userProfile?.id && !ann.readBy?.includes(userProfile.id)) {
                markAsRead.mutate({ announcementId: ann.id, memberId: userProfile.id, clubId: club?.id || "" });
            }
        }
        setExpandedIds(newExpanded);
    };

    const handleMarkAllRead = () => {
        if (!userProfile?.id || !announcements) return;
        markAllAsRead.mutate({ announcements, memberId: userProfile.id, clubId: club?.id || "" });
    };

    if (loading) {
        return (
            <div
                className="min-h-screen p-6 pb-24"
                style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "#f8fffe" }}
            >
                <div className="mx-auto max-w-2xl space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-28 rounded-2xl" />
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
                <p className="text-center text-red-600 font-bold bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                    Failed to load announcements. Please try again.
                </p>
            </div>
        );
    }

    const unreadCount = announcements?.filter(a => !a.readBy?.includes(userProfile?.id || "")).length || 0;

    return (
        <div
            className="min-h-screen p-4 md:p-6 pb-24"
            style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "#f8fffe" }}
        >
            <div className="mx-auto max-w-2xl space-y-6">

                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 leading-tight">
                            Announcements
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Updates from your club</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8 px-2 -mr-2"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {!announcements?.length ? (
                    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
                        <Megaphone className="mb-4 h-12 w-12 text-gray-300" />
                        <h2 className="text-lg font-bold text-gray-900 mb-1">No announcements yet</h2>
                        <p className="text-gray-500 font-medium text-sm">
                            Your club will post updates here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <AnnouncementCard
                                key={ann.id}
                                ann={ann}
                                memberId={userProfile?.id || ""}
                                expanded={expandedIds.has(ann.id)}
                                onToggle={() => handleToggle(ann)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
