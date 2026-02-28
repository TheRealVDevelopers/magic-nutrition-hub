import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { themes } from "@/themes/index";
import { useAllClubs } from "@/hooks/useSuperAdmin";
import type { Club, MembershipPlan, Product } from "@/types/firestore";

// ─── Mock data ───────────────────────────────────────────────────────────

const MOCK_CLUB = {
    id: "preview_club",
    name: "Magic Nutrition Club",
    currencyName: "MNC Coins",
    domain: "preview.test",
    parentClubId: null,
    treePath: "preview_club",
    theme: "theme_1",
    primaryColor: "#8B5CF6",
    logo: "",
    heroImage: "",
    tagline: "Your Health, Our Mission",
    ownerName: "Usha Prasad",
    ownerPhone: "+91 9876543210",
    ownerUserId: "preview_owner",
    status: "active" as const,
    maintenancePaid: true,
    maintenanceDueDate: null,
    kitchenPin: "1234",
    createdAt: null,
    createdBy: "superadmin",
} as unknown as Club;

const MOCK_PLANS: MembershipPlan[] = [
    {
        id: "gold",
        clubId: "preview_club",
        name: "Gold",
        price: 999,
        durationDays: 30,
        benefits: ["Daily shakes", "Weight tracking", "Priority service", "Referral bonus"],
        color: "#F59E0B",
        isActive: true,
        createdAt: null as any,
    },
    {
        id: "silver",
        clubId: "preview_club",
        name: "Silver",
        price: 699,
        durationDays: 30,
        benefits: ["Daily shakes", "Weight tracking", "Standard service"],
        color: "#6B7280",
        isActive: true,
        createdAt: null as any,
    },
    {
        id: "bronze",
        clubId: "preview_club",
        name: "Bronze",
        price: 499,
        durationDays: 30,
        benefits: ["Daily shakes", "Basic tracking"],
        color: "#92400E",
        isActive: true,
        createdAt: null as any,
    },
];

const MOCK_PRODUCTS: Product[] = [
    {
        id: "1",
        clubId: "preview_club",
        name: "Classic Chocolate Shake",
        category: "shake",
        price: 80,
        stock: 50,
        lowStockThreshold: 10,
        expiryDate: null as any,
        photo: "",
        isAvailableToday: true,
        createdAt: null as any,
        updatedAt: null as any,
    },
    {
        id: "2",
        clubId: "preview_club",
        name: "Strawberry Delight",
        category: "shake",
        price: 80,
        stock: 30,
        lowStockThreshold: 10,
        expiryDate: null as any,
        photo: "",
        isAvailableToday: true,
        createdAt: null as any,
        updatedAt: null as any,
    },
    {
        id: "3",
        clubId: "preview_club",
        name: "Vanilla Dream",
        category: "shake",
        price: 80,
        stock: 40,
        lowStockThreshold: 10,
        expiryDate: null as any,
        photo: "",
        isAvailableToday: true,
        createdAt: null as any,
        updatedAt: null as any,
    },
];

const DEFAULT_PRIMARY_COLOR = "#8B5CF6";

// ─── Component ───────────────────────────────────────────────────────────

export default function ThemeTestPage() {
    const [selectedThemeId, setSelectedThemeId] = useState<string>("theme_1");
    const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
    const [hexInput, setHexInput] = useState(DEFAULT_PRIMARY_COLOR);

    const { data: allClubs } = useAllClubs();

    const selectedIndex = themes.findIndex((t) => t.id === selectedThemeId);
    const selectedTheme = themes[selectedIndex];
    const ThemeComponent = selectedTheme?.component;

    const clubsUsingTheme = allClubs?.filter((c) => c.theme === selectedThemeId).length ?? 0;

    function goToPrev() {
        const prev = (selectedIndex - 1 + themes.length) % themes.length;
        setSelectedThemeId(themes[prev].id);
    }

    function goToNext() {
        const next = (selectedIndex + 1) % themes.length;
        setSelectedThemeId(themes[next].id);
    }

    function handleHexInputChange(value: string) {
        setHexInput(value);
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            setPrimaryColor(value);
        }
    }

    function handleColorPickerChange(value: string) {
        setPrimaryColor(value);
        setHexInput(value);
    }

    function resetColor() {
        setPrimaryColor(DEFAULT_PRIMARY_COLOR);
        setHexInput(DEFAULT_PRIMARY_COLOR);
    }

    const mockClubWithColor: Club = {
        ...MOCK_CLUB,
        primaryColor,
    } as unknown as Club;

    return (
        <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-8">
            {/* ── Top bar ──────────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-b border-border px-4 py-3 flex flex-wrap items-center gap-3 z-10 shadow-sm">
                {/* Title */}
                <div className="flex items-center gap-2 mr-2">
                    <Palette className="w-5 h-5 text-violet-600" />
                    <span className="font-bold text-gray-900 text-sm hidden sm:inline">
                        Theme Testing — All 10 Themes
                    </span>
                    <span className="font-bold text-gray-900 text-sm sm:hidden">Themes</span>
                </div>

                {/* Prev / Next */}
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={goToPrev}
                        className="h-8 w-8 p-0"
                        title="Previous theme"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={goToNext}
                        className="h-8 w-8 p-0"
                        title="Next theme"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {/* Dropdown */}
                <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                    <SelectTrigger className="h-8 w-52 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {themes.map((t, i) => (
                            <SelectItem key={t.id} value={t.id} className="text-xs">
                                <span className="flex items-center gap-2">
                                    <span
                                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: t.previewColor }}
                                    />
                                    Theme {i + 1} — {t.name}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Current theme info */}
                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: selectedTheme?.previewColor }}
                    />
                    <span className="text-sm font-semibold text-gray-800">
                        Theme {selectedIndex + 1} — {selectedTheme?.name}
                    </span>
                    <span className="hidden sm:inline text-xs text-muted-foreground">
                        {selectedTheme?.description}
                    </span>
                </div>

                {/* Club usage counter */}
                <div className="ml-auto flex items-center gap-1.5 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                        {allClubs === undefined ? "…" : clubsUsingTheme} club
                        {clubsUsingTheme !== 1 ? "s" : ""} using this theme
                    </span>
                </div>
            </div>

            {/* ── Theme preview ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto relative">
                {ThemeComponent ? (
                    <ThemeComponent
                        club={mockClubWithColor}
                        membershipPlans={MOCK_PLANS}
                        todaysSpecial={MOCK_PRODUCTS}
                        primaryColor={primaryColor}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Theme not found
                    </div>
                )}
            </div>

            {/* ── Floating color panel (bottom-right) ───────────────────── */}
            <div className="fixed bottom-6 right-6 z-50 bg-white border border-border rounded-2xl shadow-xl p-4 w-64 space-y-3">
                <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-gray-800">Primary Color</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Color swatch / native picker */}
                    <label className="cursor-pointer flex-shrink-0">
                        <span
                            className="block w-9 h-9 rounded-lg border-2 border-white shadow"
                            style={{ backgroundColor: primaryColor }}
                        />
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => handleColorPickerChange(e.target.value)}
                            className="sr-only"
                        />
                    </label>

                    {/* Hex input */}
                    <input
                        type="text"
                        value={hexInput}
                        onChange={(e) => handleHexInputChange(e.target.value)}
                        maxLength={7}
                        placeholder="#8B5CF6"
                        className="flex-1 h-9 px-3 text-sm font-mono border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 text-xs"
                    onClick={resetColor}
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to default
                </Button>
            </div>
        </div>
    );
}
