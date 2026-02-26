import { Clock, AlertCircle } from "lucide-react";
import type { TopupRequest } from "@/types/firestore";

interface Props {
    request: TopupRequest;
    currencyName: string;
}

export default function PendingRequestBanner({ request, currencyName }: Props) {
    const timeAgo = request.requestedAt?.toDate?.()
        ? getTimeAgo(request.requestedAt.toDate())
        : "";

    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 animate-in">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                    Your request for {request.requestedAmount.toLocaleString()} {currencyName} is waiting for admin approval
                </p>
                {timeAgo && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        <span>Requested {timeAgo}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}
