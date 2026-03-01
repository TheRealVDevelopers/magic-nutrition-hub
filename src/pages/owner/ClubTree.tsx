import { useState } from "react";
import { GitBranch, Users, Globe, ChevronDown, ChevronRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClubTree } from "@/hooks/owner/useClubTree";
import { useClubContext } from "@/lib/clubDetection";
import { useMemberCountByClub } from "@/hooks/useSuperAdmin";
import type { Club } from "@/types/firestore";

interface ClubTreeNode {
    club: Club;
    memberCount: number;
    children: ClubTreeNode[];
}

function TreeNode({ node, depth }: { node: ClubTreeNode; depth: number }) {
    const [open, setOpen] = useState(depth < 2);
    const hasChildren = node.children.length > 0;
    const c = node.club;

    return (
        <div style={{ paddingLeft: depth > 0 ? 32 : 0 }} className={depth > 0 ? "relative" : ""}>
            {depth > 0 && (
                <div
                    className="absolute -left-6 top-0 h-7 w-6 border-l-2 border-b-2 border-gray-200 rounded-bl-lg"
                    aria-hidden
                />
            )}
            <div className="flex items-start gap-2 py-2">
                {hasChildren ? (
                    <button
                        onClick={() => setOpen(!open)}
                        className="mt-1.5 p-0.5 rounded hover:bg-gray-100 text-muted-foreground"
                    >
                        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                ) : (
                    <span className="w-5" />
                )}
                <div className="flex-1 min-w-0 rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-base">{c.name}</p>
                        <Badge
                            variant={c.status === "active" ? "default" : "destructive"}
                            className={`text-xs ${c.status === "active" ? "!bg-[#2d9653] !border-[#2d9653]" : ""}`}
                        >
                            {c.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {node.memberCount} members
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {c.ownerName}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" /> {c.domain}
                    </p>
                </div>
            </div>
            {open && hasChildren && (
                <div className="relative ml-2" style={{ borderLeft: "2px solid #e5e7eb", marginLeft: 12 }}>
                    {node.children.map((child) => (
                        <TreeNode key={child.club.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ClubTree() {
    const { club } = useClubContext();
    const { data: children, isLoading } = useClubTree(club?.id ?? null);
    const { data: memberCount } = useMemberCountByClub(club?.id ?? "");

    if (!club) return null;

    return (
        <div
            className="min-h-screen px-4 md:px-6 py-8 overflow-x-auto"
            style={{ fontFamily: "'Nunito', sans-serif" }}
        >
            <div className="max-w-3xl mx-auto">
                <header className="flex items-center gap-2 mb-6">
                    <GitBranch className="w-7 h-7" style={{ color: "#2d9653" }} />
                    <h1 className="text-2xl font-black" style={{ color: "#2d9653" }}>
                        Club Network
                    </h1>
                </header>

                <div
                    className="rounded-2xl border-2 p-6 mb-8"
                    style={{ borderColor: "#2d9653", backgroundColor: "rgba(45, 150, 83, 0.05)" }}
                >
                    <p className="text-xl font-bold">{club.name}</p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {club.ownerName}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="w-4 h-4" /> {club.domain}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {memberCount ?? 0} active members
                    </Badge>
                </div>

                <h2 className="text-lg font-semibold mb-4">Child Clubs</h2>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                    </div>
                ) : !children || children.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">No child clubs in your network</p>
                ) : (
                    <div className="space-y-1">
                        {children.map((node) => (
                            <TreeNode key={node.club.id} node={node} depth={0} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
