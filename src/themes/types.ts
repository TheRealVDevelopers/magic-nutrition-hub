import React from "react";
import type { Club, MembershipPlan, Product } from "@/types/firestore";

export interface LandingPageProps {
    club: Club;
    membershipPlans: MembershipPlan[];
    todaysSpecial: Product[];
    primaryColor: string;
}

export interface Theme {
    id: string; // e.g. "theme_1"
    name: string; // e.g. "Bold & Energetic"
    description: string;
    previewColor: string; // hex
    component: React.ComponentType<LandingPageProps>;
}
