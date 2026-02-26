import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection, doc, getDocs, setDoc, updateDoc,
    query, where, onSnapshot, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { Attendance } from "@/types/firestore";

function today() {
    return new Date().toISOString().slice(0, 10);
}

// ─── useTodayAttendance (real-time) ─────────────────────────────────────

export function useTodayAttendance(type?: "member" | "volunteer") {
    const { club } = useClubContext();
    const [records, setRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!club) return;
        const constraints = [
            where("clubId", "==", club.id),
            where("date", "==", today()),
        ];
        if (type) constraints.push(where("type", "==", type));

        const q = query(collection(db, "attendance"), ...constraints);
        const unsub = onSnapshot(q,
            (snap) => {
                setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance));
                setLoading(false);
            },
            (err) => { setError(err.message); setLoading(false); }
        );
        return () => unsub();
    }, [club, type]);

    return { records, loading, error };
}

// ─── useAttendanceHistory ───────────────────────────────────────────────

export function useAttendanceHistory(startDate: string, endDate: string) {
    const { club } = useClubContext();
    const [records, setRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!club || !startDate || !endDate) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(
                    query(
                        collection(db, "attendance"),
                        where("clubId", "==", club.id),
                        where("date", ">=", startDate),
                        where("date", "<=", endDate)
                    )
                );
                setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance));
            } catch (err: any) { setError(err.message); }
            setLoading(false);
        };
        fetchData();
    }, [club, startDate, endDate]);

    return { records, loading, error };
}

// ─── useVolunteerHours ──────────────────────────────────────────────────

export function useVolunteerHours(volunteerId: string, month: string) {
    // month format: "2026-02"
    const { club } = useClubContext();
    const [records, setRecords] = useState<Attendance[]>([]);
    const [totalHours, setTotalHours] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!club || !volunteerId || !month) return;
        const startDate = month + "-01";
        const [y, m] = month.split("-").map(Number);
        const endDate = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

        const fetchData = async () => {
            setLoading(true);
            const snap = await getDocs(
                query(
                    collection(db, "attendance"),
                    where("clubId", "==", club.id),
                    where("userId", "==", volunteerId),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate)
                )
            );
            const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance);
            setRecords(recs);
            setTotalHours(recs.reduce((sum, r) => sum + (r.hoursWorked || 0), 0));
            setLoading(false);
        };
        fetchData();
    }, [club, volunteerId, month]);

    return { records, totalHours, loading };
}

// ─── useCheckInVolunteer ────────────────────────────────────────────────

export function useCheckInVolunteer() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async ({ userId, userName, userPhoto }: { userId: string; userName: string; userPhoto: string }) => {
            if (!club) throw new Error("Club not loaded");
            // Check for existing open check-in today
            const existing = await getDocs(
                query(
                    collection(db, "attendance"),
                    where("clubId", "==", club.id),
                    where("userId", "==", userId),
                    where("date", "==", today()),
                    where("type", "==", "volunteer")
                )
            );
            const openRecord = existing.docs.find((d) => !(d.data() as Attendance).checkOutTime);
            if (openRecord) throw new Error("Already checked in");

            const id = "att_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
            await setDoc(doc(db, "attendance", id), {
                id, userId, userName, userPhoto,
                clubId: club.id, type: "volunteer",
                checkInTime: Timestamp.now(), checkOutTime: null,
                hoursWorked: null, checkInMethod: "qr",
                date: today(),
            } as Attendance);
            return id;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    });
}

// ─── useCheckOutVolunteer ───────────────────────────────────────────────

export function useCheckOutVolunteer() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async (volunteerId: string) => {
            if (!club) throw new Error("Club not loaded");
            const snap = await getDocs(
                query(
                    collection(db, "attendance"),
                    where("clubId", "==", club.id),
                    where("userId", "==", volunteerId),
                    where("date", "==", today()),
                    where("type", "==", "volunteer")
                )
            );
            const openRecord = snap.docs.find((d) => !(d.data() as Attendance).checkOutTime);
            if (!openRecord) throw new Error("No open check-in found");

            const checkInTime = (openRecord.data() as Attendance).checkInTime.toDate();
            const now = new Date();
            const hoursWorked = Math.round(((now.getTime() - checkInTime.getTime()) / 3600000) * 100) / 100;

            await updateDoc(doc(db, "attendance", openRecord.id), {
                checkOutTime: Timestamp.now(),
                hoursWorked,
            });
            return hoursWorked;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    });
}

// ─── useCheckInMember ───────────────────────────────────────────────────

export function useCheckInMember() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async ({ userId, userName, userPhoto, method }: {
            userId: string; userName: string; userPhoto: string;
            method: "qr" | "manual" | "mobile";
        }) => {
            if (!club) throw new Error("Club not loaded");
            // Check if already checked in today
            const existing = await getDocs(
                query(
                    collection(db, "attendance"),
                    where("clubId", "==", club.id),
                    where("userId", "==", userId),
                    where("date", "==", today()),
                    where("type", "==", "member")
                )
            );
            if (existing.size > 0) {
                const rec = existing.docs[0].data() as Attendance;
                return { alreadyCheckedIn: true, checkInTime: rec.checkInTime };
            }

            const id = "att_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
            await setDoc(doc(db, "attendance", id), {
                id, userId, userName, userPhoto,
                clubId: club.id, type: "member",
                checkInTime: Timestamp.now(), checkOutTime: null,
                hoursWorked: null, checkInMethod: method,
                date: today(),
            } as Attendance);
            return { alreadyCheckedIn: false, checkInTime: Timestamp.now() };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    });
}

// ─── useIsVolunteerCheckedIn ────────────────────────────────────────────

export function useIsVolunteerCheckedIn(volunteerId: string) {
    const { club } = useClubContext();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [attendanceRecord, setAttendanceRecord] = useState<Attendance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!club || !volunteerId) { setLoading(false); return; }
        const q = query(
            collection(db, "attendance"),
            where("clubId", "==", club.id),
            where("userId", "==", volunteerId),
            where("date", "==", today()),
            where("type", "==", "volunteer")
        );
        const unsub = onSnapshot(q, (snap) => {
            const openRec = snap.docs.find((d) => !(d.data() as Attendance).checkOutTime);
            if (openRec) {
                setIsCheckedIn(true);
                setAttendanceRecord({ id: openRec.id, ...openRec.data() } as Attendance);
            } else {
                setIsCheckedIn(false);
                setAttendanceRecord(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [club, volunteerId]);

    return { isCheckedIn, attendanceRecord, loading };
}

// ─── useAllVolunteersStatus (for reception grid) ────────────────────────

export function useAllVolunteersStatus() {
    const { club } = useClubContext();
    const [statusMap, setStatusMap] = useState<Record<string, Attendance | null>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!club) return;
        const q = query(
            collection(db, "attendance"),
            where("clubId", "==", club.id),
            where("date", "==", today()),
            where("type", "==", "volunteer")
        );
        const unsub = onSnapshot(q, (snap) => {
            const map: Record<string, Attendance | null> = {};
            snap.docs.forEach((d) => {
                const rec = { id: d.id, ...d.data() } as Attendance;
                // Only track open (not checked out) records
                if (!rec.checkOutTime) {
                    map[rec.userId] = rec;
                }
            });
            setStatusMap(map);
            setLoading(false);
        });
        return () => unsub();
    }, [club]);

    return { statusMap, loading };
}

// ─── useManualCheckIn (owner/staff manually checks in a member) ─────────

export function useManualCheckIn() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async ({ userId, userName, userPhoto }: {
            userId: string; userName: string; userPhoto: string;
        }) => {
            if (!club) throw new Error("Club not loaded");
            const existing = await getDocs(
                query(
                    collection(db, "attendance"),
                    where("clubId", "==", club.id),
                    where("userId", "==", userId),
                    where("date", "==", today()),
                    where("type", "==", "member")
                )
            );
            if (existing.size > 0) throw new Error("Already checked in today");

            const id = "att_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
            await setDoc(doc(db, "attendance", id), {
                id, userId, userName, userPhoto,
                clubId: club.id, type: "member",
                checkInTime: Timestamp.now(), checkOutTime: null,
                hoursWorked: null, checkInMethod: "manual",
                date: today(),
            } as Attendance);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    });
}
