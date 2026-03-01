import { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useAnnouncements,
    useSendAnnouncement,
    useDeleteAnnouncement,
} from "@/hooks/owner/useAnnouncements";
import { useClubContext } from "@/lib/clubDetection";
import { useToast } from "@/hooks/use-toast";
import type { Announcement } from "@/types/firestore";

type Priority = "normal" | "important" | "urgent";

function PriorityBadge({ priority }: { priority?: string }) {
    const p = (priority || "normal") as Priority;
    const variants: Record<Priority, string> = {
        normal: "bg-gray-100 text-gray-700",
        important: "bg-amber-100 text-amber-800",
        urgent: "bg-red-100 text-red-800",
    };
    return (
        <Badge variant="secondary" className={variants[p]}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
        </Badge>
    );
}

export default function Announcements() {
    const { club } = useClubContext();
    const { toast } = useToast();
    const { data: announcements, isLoading } = useAnnouncements(club?.id ?? null);
    const sendAnn = useSendAnnouncement();
    const deleteAnn = useDeleteAnnouncement();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState<Priority>("normal");

    const handleSend = async () => {
        if (!club?.id || !title.trim() || !message.trim()) return;
        try {
            await sendAnn.mutateAsync({
                clubId: club.id,
                title: title.trim(),
                message: message.trim(),
                priority,
            });
            toast({ title: "Announcement posted" });
            setOpen(false);
            setTitle("");
            setMessage("");
            setPriority("normal");
        } catch {
            toast({ title: "Failed to post", variant: "destructive" });
        }
    };

    const handleDelete = async (a: Announcement) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await deleteAnn.mutateAsync(a.id);
            toast({ title: "Deleted" });
        } catch {
            toast({ title: "Failed to delete", variant: "destructive" });
        }
    };

    return (
        <div
            className="px-6 md:px-8 py-8 max-w-[900px] mx-auto"
            style={{ fontFamily: "'Nunito', sans-serif" }}
        >
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black" style={{ color: "#1a2e1a" }}>
                    Announcements
                </h1>
                <Button
                    onClick={() => setOpen(true)}
                    style={{ backgroundColor: "#2d9653" }}
                    className="text-white hover:opacity-90"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
            ) : !announcements?.length ? (
                <div className="rounded-2xl border bg-gray-50 p-12 text-center">
                    <Megaphone className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 font-semibold">No announcements yet</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setOpen(true)}
                        style={{ borderColor: "#2d9653", color: "#2d9653" }}
                    >
                        Create your first announcement
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((a) => (
                        <div
                            key={a.id}
                            className="rounded-2xl border bg-white p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="font-bold text-gray-900">{a.title}</h3>
                                    <PriorityBadge priority={(a as Announcement & { priority?: string }).priority} />
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{a.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {a.createdAt?.toDate?.()?.toLocaleDateString?.() ?? "—"}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                onClick={() => handleDelete(a)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>New Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Title *</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Announcement title"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Message *</Label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your announcement…"
                                rows={4}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="important">Important</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {title && message && (
                            <div className="rounded-lg border p-3 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-500 mb-1">Preview</p>
                                <p className="font-bold">{title}</p>
                                <p className="text-sm text-gray-600 mt-1">{message}</p>
                            </div>
                        )}
                        <Button
                            onClick={handleSend}
                            disabled={sendAnn.isPending || !title.trim() || !message.trim()}
                            className="w-full"
                            style={{ backgroundColor: "#2d9653" }}
                        >
                            {sendAnn.isPending ? "Sending…" : "Send"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
