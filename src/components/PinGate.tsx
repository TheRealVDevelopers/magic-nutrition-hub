import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PinGateProps {
    type: "kitchen" | "admin";
    clubName: string;
    clubLogo: string;
    pinLength: number;
    isLoading: boolean;
    onVerify: (pin: string) => Promise<boolean>;
}

export default function PinGate({ type, clubName, clubLogo, pinLength, isLoading, onVerify }: PinGateProps) {
    const [digits, setDigits] = useState<string[]>(Array(pinLength).fill(""));
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [shaking, setShaking] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => { inputRefs.current[0]?.focus(); }, []);

    function handleDigitChange(index: number, value: string) {
        const cleaned = value.replace(/\D/g, "");
        if (!cleaned) return;

        const newDigits = [...digits];
        // Handle paste — distribute across boxes
        if (cleaned.length > 1) {
            const chars = cleaned.slice(0, pinLength).split("");
            chars.forEach((ch, i) => {
                if (index + i < pinLength) newDigits[index + i] = ch;
            });
            setDigits(newDigits);
            setError(null);
            const nextIdx = Math.min(index + chars.length, pinLength - 1);
            inputRefs.current[nextIdx]?.focus();
            // Auto-submit if all filled
            if (newDigits.every((d) => d !== "")) {
                submitPin(newDigits.join(""));
            }
            return;
        }

        newDigits[index] = cleaned[0];
        setDigits(newDigits);
        setError(null);

        // Move to next input
        if (index < pinLength - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all filled
        if (newDigits.every((d) => d !== "")) {
            submitPin(newDigits.join(""));
        }
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace") {
            e.preventDefault();
            const newDigits = [...digits];
            if (digits[index]) {
                newDigits[index] = "";
                setDigits(newDigits);
            } else if (index > 0) {
                newDigits[index - 1] = "";
                setDigits(newDigits);
                inputRefs.current[index - 1]?.focus();
            }
            setError(null);
        }
        if (e.key === "Enter") {
            const pin = digits.join("");
            if (pin.length === pinLength) submitPin(pin);
        }
    }

    async function submitPin(pin: string) {
        setVerifying(true);
        setError(null);
        try {
            const ok = await onVerify(pin);
            if (!ok) {
                setShaking(true);
                setError("Incorrect PIN. Please try again.");
                setTimeout(() => {
                    setShaking(false);
                    setDigits(Array(pinLength).fill(""));
                    inputRefs.current[0]?.focus();
                }, 500);
            }
        } catch {
            setError("Verification failed. Please try again.");
            setDigits(Array(pinLength).fill(""));
            inputRefs.current[0]?.focus();
        } finally {
            setVerifying(false);
        }
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, pinLength);
        if (!pasted) return;
        const newDigits = Array(pinLength).fill("");
        pasted.split("").forEach((ch, i) => { newDigits[i] = ch; });
        setDigits(newDigits);
        setError(null);
        const nextIdx = Math.min(pasted.length, pinLength - 1);
        inputRefs.current[nextIdx]?.focus();
        if (newDigits.every((d) => d !== "")) {
            submitPin(newDigits.join(""));
        }
    }

    const isKitchen = type === "kitchen";
    const icon = isKitchen ? "🍳" : "🔐";
    const title = isKitchen ? "Kitchen Access" : "Admin Access";
    const subtitle = `Enter ${pinLength}-digit PIN to continue`;
    const bgGradient = isKitchen
        ? "from-orange-50 via-white to-yellow-50"
        : "from-emerald-50 via-white to-green-50";
    const iconGradient = isKitchen
        ? "from-orange-500 to-yellow-500"
        : "from-emerald-600 to-green-500";

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bgGradient} p-4`}
            style={{ fontFamily: "'Nunito', sans-serif" }}>
            <div className="w-full max-w-sm">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 space-y-6">
                    {/* Club logo + info */}
                    <div className="text-center space-y-3">
                        {clubLogo ? (
                            <img src={clubLogo} alt={clubName} className="h-14 w-14 mx-auto rounded-xl object-cover border" />
                        ) : (
                            <div className={`h-14 w-14 mx-auto rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center`}>
                                <span className="text-white text-2xl">{icon}</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500 mt-1">{clubName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                        </div>
                    </div>

                    {/* PIN Boxes */}
                    <div
                        className={`flex justify-center gap-2 ${shaking ? "animate-shake" : ""}`}
                        onPaste={handlePaste}
                    >
                        {digits.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleDigitChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                disabled={verifying}
                                className={[
                                    "w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all",
                                    "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                                    error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white",
                                    verifying ? "opacity-50" : "",
                                ].join(" ")}
                                style={{ minWidth: 48, minHeight: 48 }}
                            />
                        ))}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
                            {error}
                        </div>
                    )}

                    {/* Submit button */}
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                        disabled={digits.some((d) => !d) || verifying}
                        onClick={() => submitPin(digits.join(""))}
                    >
                        {verifying ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying…</>
                        ) : (
                            `Enter ${isKitchen ? "Kitchen" : "Dashboard"}`
                        )}
                    </Button>
                </div>

                {/* Security note */}
                <p className="text-center text-[10px] text-gray-400 mt-4">
                    Contact your club admin if you don't have the PIN.
                </p>
            </div>

            {/* Shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-8px); }
                    40%, 80% { transform: translateX(8px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
}
