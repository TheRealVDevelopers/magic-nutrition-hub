import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, setDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Attendance } from "@/types/firestore";

function todayStr() {
    return new Date().toISOString().split("T")[0];
}

export function useAttendanceByDate(clubId: string | null, date?: string) {
    const d = date || todayStr();
    return useQuery({
        queryKey: ["owner-attendance", clubId, d],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(
                collection(db, "attendance"),
                where("clubId", "==", clubId),
                where("date", "==", d),
                orderBy("checkInTime", "desc")
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance));
        },
    });
}

export function useMarkAttendance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            clubId: string;
            userId: string;
            userName: string;
            userPhoto: string;
            method: Attendance["checkInMethod"];
            date?: string;
        }) => {
            const now = Timestamp.now();
            const date = data.date ?? todayStr();
            const docId = `${data.clubId}_${date}_${data.userId}`;
            await setDoc(doc(db, "attendance", docId), {
                userId: data.userId,
                userName: data.userName,
                userPhoto: data.userPhoto || "",
                clubId: data.clubId,
                type: "member",
                checkInTime: now,
                checkOutTime: null,
                hoursWorked: null,
                checkInMethod: data.method,
                date,
            });
            return docId;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["owner-attendance", vars.clubId] });
        },
    });
}

export function useAttendanceStats(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-attendance-stats", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const today = todayStr();
            const q = query(collection(db, "attendance"), where("clubId", "==", clubId), where("date", "==", today));
            const snap = await getDocs(q);
            return { todayCount: snap.size, records: snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance)) };
        },
    });
}
