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
            const membersQ = query(collection(db, `clubs/${clubId}/members`));
            const memberSnap = await getDocs(membersQ);

            let allAttendance: Attendance[] = [];

            for (const memberDoc of memberSnap.docs) {
                const q = query(
                    collection(db, `clubs/${clubId}/members/${memberDoc.id}/attendance`),
                    where("date", "==", d),
                    orderBy("checkInTime", "desc")
                );
                const aSnap = await getDocs(q);
                for (const doc of aSnap.docs) {
                    allAttendance.push({ id: doc.id, ...doc.data() } as Attendance);
                }
            }
            // re-sort combined list by desc checkInTime
            return allAttendance.sort((a, b) => b.checkInTime.toMillis() - a.checkInTime.toMillis());
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
            const docId = date; // Can just use date as doc id for simplicity since it's nested per member

            await setDoc(doc(db, `clubs/${data.clubId}/members/${data.userId}/attendance`, docId), {
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
            qc.invalidateQueries({ queryKey: ["owner-attendance-stats", vars.clubId] });
        },
    });
}

export function useAttendanceStats(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-attendance-stats", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const today = todayStr();

            const membersQ = query(collection(db, `clubs/${clubId}/members`));
            const memberSnap = await getDocs(membersQ);

            let allAttendance: Attendance[] = [];
            for (const memberDoc of memberSnap.docs) {
                const q = query(collection(db, `clubs/${clubId}/members/${memberDoc.id}/attendance`), where("date", "==", today));
                const aSnap = await getDocs(q);
                for (const d of aSnap.docs) {
                    allAttendance.push({ id: d.id, ...d.data() } as Attendance);
                }
            }

            return { todayCount: allAttendance.length, records: allAttendance };
        },
    });
}
