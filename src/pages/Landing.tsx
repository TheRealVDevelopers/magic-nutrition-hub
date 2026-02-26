import { useMemo, useEffect } from "react";
import { useClubContext } from "@/lib/clubDetection";
import { themes } from "@/themes";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MembershipPlan, Product } from "@/types/firestore";

export default function Landing() {
    const { club, loading, error } = useClubContext();

    // Fetch membership plans
    const { data: membershipPlans = [] } = useQuery({
        queryKey: ["public", "membershipPlans", club?.id],
        queryFn: async () => {
            if (!club) return [];
            const snap = await getDocs(
                query(collection(db, "membershipPlans"), where("clubId", "==", club.id))
            );
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as MembershipPlan));
        },
        enabled: !!club,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch today's specials (assuming they are checked or just picking top 3 products for demo, since "todaysSpecial" isn't a direct field, let's just fetch all products and show some)
    const { data: todaysSpecial = [] } = useQuery({
        queryKey: ["public", "products", club?.id],
        queryFn: async () => {
            if (!club) return [];
            const snap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club.id))
            );
            // Just take the first 3 or any that are active. We'll take top 3 for the landing page.
            const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            return products.slice(0, 3);
        },
        enabled: !!club,
        staleTime: 5 * 60 * 1000,
    });

    // Handle dynamic SEO explicitly
    useEffect(() => {
        if (club) {
            document.title = `${club.name} | ${club.tagline}`;
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute("content", club.description || club.tagline);
            }
        }
    }, [club]);

    const activeTheme = useMemo(() => {
        if (!club) return themes[0]; // fallback
        const found = themes.find(t => t.id === club.theme);
        return found || themes[0];
    }, [club]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-wellness-cream">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !club) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-wellness-cream text-center p-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 mb-4">Space Not Found</h1>
                    <p className="text-slate-600">This domain is not configured with an active club.</p>
                </div>
            </div>
        );
    }

    // Render the selected theme
    const ThemeComponent = activeTheme.component;
    const primaryColor = club.primaryColor || activeTheme.previewColor;

    return (
        <ThemeComponent
            club={club}
            membershipPlans={membershipPlans}
            todaysSpecial={todaysSpecial}
            primaryColor={primaryColor}
        />
    );
}
