import { useState, useEffect } from "react";
import { collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Club } from "@/types/firestore";

const GREEN = "#2d9653";

// Lookup club by clubId query param
function useClubFromParams() {
    const [params] = useSearchParams();
    const clubId = params.get("clubId") ?? "";

    return useQuery({
        queryKey: ["join-club", clubId],
        queryFn: async () => {
            if (!clubId) {
                // Try to load default if only one club
                const snap = await getDocs(collection(db, "clubs"));
                if (snap.size === 1) return { id: snap.docs[0].id, ...snap.docs[0].data() } as Club;
                return null;
            }
            const snap = await getDocs(query(collection(db, "clubs"), where("__name__", "==", clubId)));
            if (snap.empty) return null;
            return { id: snap.docs[0].id, ...snap.docs[0].data() } as Club;
        },
        enabled: true,
    });
}

// Validate that a memberId exists
async function validateMemberId(clubId: string, memberId: string): Promise<boolean> {
    if (!memberId.trim()) return true; // Empty = valid (optional field)
    const snap = await getDocs(query(collection(db, `clubs/${clubId}/members`), where("memberId", "==", memberId.trim())));
    return !snap.empty;
}

export default function Join() {
    const { data: club, isLoading: clubLoading } = useClubFromParams();

    const [form, setForm] = useState({
        name: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        dob: "",
        currentWeight: "",
        targetWeight: "",
        healthConditions: "",
        referredByMemberId: "",
        noReferrer: false,
    });

    const [referrerStatus, setReferrerStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (field === "referredByMemberId") setReferrerStatus("idle");
    };

    const checkReferrer = async () => {
        const id = form.referredByMemberId.trim();
        if (!id || form.noReferrer || !club) { setReferrerStatus("idle"); return; }
        setReferrerStatus("checking");
        const valid = await validateMemberId(club.id, id);
        setReferrerStatus(valid ? "valid" : "invalid");
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Name is required";
        if (!form.phone.trim()) errs.phone = "Phone is required";
        if (!form.noReferrer && form.referredByMemberId.trim() && referrerStatus === "invalid") {
            errs.referredByMemberId = "Member ID not found";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || !club) return;
        // If referrer is set but status not validated yet, check first
        if (!form.noReferrer && form.referredByMemberId.trim() && referrerStatus === "idle") {
            await checkReferrer();
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, `clubs/${club.id}/enquiries`), {
                clubId: club.id,
                name: form.name.trim(),
                phone: form.phone.trim(),
                whatsapp: form.whatsapp.trim() || form.phone.trim(),
                email: form.email.trim() || null,
                address: form.address.trim() || null,
                dob: form.dob || null,
                currentWeight: form.currentWeight ? parseFloat(form.currentWeight) : null,
                targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : null,
                healthConditions: form.healthConditions.trim() || null,
                referredByMemberId: (!form.noReferrer && form.referredByMemberId.trim()) ? form.referredByMemberId.trim() : null,
                status: "new",
                createdAt: Timestamp.now(),
                source: "join-page",
            });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (clubLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "Nunito, sans-serif" }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: GREEN }} />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ fontFamily: "Nunito, sans-serif" }}>
                <div>
                    <p className="text-2xl font-black text-gray-400">Club not found</p>
                    <p className="text-gray-400 mt-2">Please check your link and try again.</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
                style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "#f8fffe" }}
            >
                <CheckCircle className="w-20 h-20 mb-6" style={{ color: GREEN }} />
                <h1 className="text-3xl font-black text-gray-800 mb-3">Thank you! ✅</h1>
                <p className="text-lg text-gray-600 mb-6">
                    Your enquiry has been submitted.<br />Our team will contact you shortly.
                </p>
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-sm text-gray-500 mb-2">For immediate assistance, contact:</p>
                    <p className="font-black text-xl" style={{ color: GREEN }}>
                        {club.name}
                    </p>
                    {club.ownerPhone && (
                        <a href={`tel:${club.ownerPhone}`} className="text-lg font-bold text-blue-600 mt-1 block">
                            📞 {club.ownerPhone}
                        </a>
                    )}
                </div>
            </div>
        );
    }

    const inputClass = "rounded-xl border-gray-200";

    return (
        <div
            className="min-h-screen pb-16"
            style={{ fontFamily: "Nunito, sans-serif", backgroundColor: "#f8fffe" }}
        >
            {/* Header */}
            <div className="bg-white border-b shadow-sm px-5 py-5 flex items-center gap-4">
                {club.logo && (
                    <img src={club.logo} alt={club.name} className="h-12 object-contain rounded-xl" />
                )}
                <div>
                    <h1 className="text-xl font-black" style={{ color: GREEN }}>{club.name}</h1>
                    <p className="text-sm text-gray-500">Join us — fill out your details</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-5 pt-6 space-y-4">
                <h2 className="text-2xl font-black text-gray-800">New Member Enquiry</h2>
                <p className="text-sm text-gray-500">Fields marked with * are required.</p>

                {/* Name */}
                <Field label="Full Name *" error={errors.name}>
                    <Input className={inputClass} placeholder="Your full name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
                </Field>

                {/* Phone */}
                <Field label="Phone Number *" error={errors.phone}>
                    <Input className={inputClass} type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </Field>

                {/* WhatsApp */}
                <Field label="WhatsApp Number">
                    <Input className={inputClass} type="tel" placeholder="Same as phone or different" value={form.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} />
                </Field>

                {/* Email */}
                <Field label="Email">
                    <Input className={inputClass} type="email" placeholder="your@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                </Field>

                {/* Address */}
                <Field label="Address">
                    <Input className={inputClass} placeholder="Your address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
                </Field>

                {/* DOB */}
                <Field label="Date of Birth">
                    <Input className={inputClass} type="date" value={form.dob} onChange={(e) => handleChange("dob", e.target.value)} />
                </Field>

                {/* Weights */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Current Weight (kg)">
                        <Input className={inputClass} type="number" placeholder="e.g. 75" value={form.currentWeight} onChange={(e) => handleChange("currentWeight", e.target.value)} />
                    </Field>
                    <Field label="Target Weight (kg)">
                        <Input className={inputClass} type="number" placeholder="e.g. 65" value={form.targetWeight} onChange={(e) => handleChange("targetWeight", e.target.value)} />
                    </Field>
                </div>

                {/* Health conditions */}
                <Field label="Health Conditions">
                    <Textarea className={inputClass} rows={3} placeholder="Any health conditions we should know about..." value={form.healthConditions} onChange={(e) => handleChange("healthConditions", e.target.value)} />
                </Field>

                {/* Referral */}
                <Field label="Who referred you? (Member ID)" error={errors.referredByMemberId}>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                className={`${inputClass} flex-1 ${referrerStatus === "valid" ? "border-green-500" : referrerStatus === "invalid" ? "border-red-500" : ""}`}
                                placeholder="e.g. MNC-A-001"
                                value={form.referredByMemberId}
                                onChange={(e) => handleChange("referredByMemberId", e.target.value)}
                                onBlur={checkReferrer}
                                disabled={form.noReferrer}
                            />
                            {referrerStatus === "checking" && <Loader2 className="animate-spin w-5 h-5 self-center text-gray-400" />}
                            {referrerStatus === "valid" && <CheckCircle className="w-5 h-5 self-center text-green-500" />}
                        </div>
                        {referrerStatus === "invalid" && (
                            <p className="text-red-500 text-xs">Member ID not found</p>
                        )}
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={form.noReferrer}
                                onChange={(e) => {
                                    handleChange("noReferrer", e.target.checked);
                                    if (e.target.checked) handleChange("referredByMemberId", "");
                                }}
                                className="rounded"
                            />
                            No referrer / I came on my own
                        </label>
                    </div>
                </Field>

                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full h-14 rounded-2xl text-white text-base font-black"
                    style={{ backgroundColor: GREEN }}
                >
                    {submitting ? (
                        <><Loader2 className="animate-spin w-5 h-5 mr-2" />Submitting...</>
                    ) : (
                        "Submit Enquiry 🙌"
                    )}
                </Button>
            </div>
        </div>
    );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700">{label}</label>
            {children}
            {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        </div>
    );
}
