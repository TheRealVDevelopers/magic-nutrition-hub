import type { Theme } from "./types";

import Theme1BoldEnergetic from "./Theme1BoldEnergetic";
import Theme2CleanFresh from "./Theme2CleanFresh";
import Theme3PremiumGold from "./Theme3PremiumGold";
import Theme4OceanCalm from "./Theme4OceanCalm";
import Theme5VibrantPurple from "./Theme5VibrantPurple";
import Theme6NatureGreen from "./Theme6NatureGreen";
import Theme7MinimalWhite from "./Theme7MinimalWhite";
import Theme8SunsetWarm from "./Theme8SunsetWarm";
import Theme9NightMode from "./Theme9NightMode";
import Theme10ClassicRed from "./Theme10ClassicRed";

export const themes: Theme[] = [
    {
        id: "theme_1",
        name: "Bold & Energetic",
        description: "Dark, fitness-focused, impactful.",
        previewColor: "#f97316", // Orange
        component: Theme1BoldEnergetic
    },
    {
        id: "theme_2",
        name: "Clean & Fresh",
        description: "Light, health-focused, airy.",
        previewColor: "#22c55e", // Green
        component: Theme2CleanFresh
    },
    {
        id: "theme_3",
        name: "Premium Gold",
        description: "Dark, luxury, exclusive.",
        previewColor: "#eab308", // Yellow/Gold
        component: Theme3PremiumGold
    },
    {
        id: "theme_4",
        name: "Ocean Calm",
        description: "Light, wellness, serene.",
        previewColor: "#0ea5e9", // Sky Blue
        component: Theme4OceanCalm
    },
    {
        id: "theme_5",
        name: "Vibrant Purple",
        description: "Modern, young, gradient-heavy.",
        previewColor: "#a855f7", // Purple
        component: Theme5VibrantPurple
    },
    {
        id: "theme_6",
        name: "Nature Green",
        description: "Earthy, organic, calm.",
        previewColor: "#15803d", // Dark Green
        component: Theme6NatureGreen
    },
    {
        id: "theme_7",
        name: "Minimal White",
        description: "Clean, professional, typographic.",
        previewColor: "#171717", // Black/Dark Neutral
        component: Theme7MinimalWhite
    },
    {
        id: "theme_8",
        name: "Sunset Warm",
        description: "Inviting, community-focused, warm.",
        previewColor: "#f43f5e", // Rose/Coral
        component: Theme8SunsetWarm
    },
    {
        id: "theme_9",
        name: "Night Mode",
        description: "Techy, neon glow, cyber.",
        previewColor: "#3b82f6", // Blue (neon)
        component: Theme9NightMode
    },
    {
        id: "theme_10",
        name: "Classic Red",
        description: "Traditional, structured, trustworthy.",
        previewColor: "#ef4444", // Red
        component: Theme10ClassicRed
    }
];
