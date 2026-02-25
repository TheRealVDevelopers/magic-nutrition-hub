import { useState, useEffect } from "react";
import { useClubContext } from "@/lib/clubDetection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function KitchenDisplay() {
    const { club, loading: clubLoading } = useClubContext();
    const [pin, setPin] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kitchenPin, setKitchenPin] = useState<string | null>(null);

    // Fetch kitchen PIN from club document (NOT hardcoded)
    useEffect(() => {
        if (club?.kitchenPin) {
            setKitchenPin(club.kitchenPin);
        }
    }, [club]);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!kitchenPin) {
            setError("Kitchen display is not configured for this club.");
            return;
        }

        if (pin === kitchenPin) {
            setAuthenticated(true);
        } else {
            setError("Invalid PIN. Please try again.");
            setPin("");
        }
    };

    if (clubLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    // PIN entry screen
    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
                <div className="w-full max-w-sm">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                                <span className="text-white text-2xl">🍳</span>
                            </div>
                            <h1 className="text-2xl font-bold">Kitchen Display</h1>
                            <p className="text-sm text-muted-foreground">
                                {club?.name || "Magic Nutrition Club"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Enter the 4-digit kitchen PIN
                            </p>
                        </div>

                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="• • • •"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                className="text-center text-2xl tracking-[0.5em] font-mono"
                                autoFocus
                            />

                            {error && (
                                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-center">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={pin.length !== 4}
                            >
                                Enter Kitchen
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Kitchen orders screen (placeholder — will be built in a future phase)
    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">🍳 Kitchen Orders</h1>
                    <p className="text-gray-400 text-sm">{club?.name}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        setAuthenticated(false);
                        setPin("");
                    }}
                    className="text-gray-400 border-gray-700 hover:bg-gray-800"
                >
                    Lock
                </Button>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
                <p className="text-gray-500 text-lg">
                    No orders right now. Orders will appear here when placed.
                </p>
            </div>
        </div>
    );
}
