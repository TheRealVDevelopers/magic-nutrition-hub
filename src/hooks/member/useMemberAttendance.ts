import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Attendance } from "@/types/firestore";

export function useMyAttendance(memberId: string | null, clubId: string | null) {
    return useQuery({
        queryKey: ["member-attendance", memberId, clubId],
        enabled: !!memberId && !!clubId,
        queryFn: async () => {
            const q = query(collection(db, `clubs/${clubId}/members/${memberId}/attendance`), orderBy("date", "desc"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance));
        },
    });
}

export function computeAttendanceStats(records: Attendance[]) {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthCount = records.filter(r => r.date.startsWith(thisMonth)).length;
    const allTimeCount = records.length;

    // Current streak
    const dates = [...new Set(records.map(r => r.date))].sort().reverse();
    let streak = 0;
    const today = now.toISOString().split("T")[0];
    let checkDate = new Date(today);
    for (const d of dates) {
        const expected = checkDate.toISOString().split("T")[0];
        if (d === expected) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (d < expected) {
            break;
        }
    }

    return { thisMonthCount, allTimeCount, streak };
}
