import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme7MinimalWhite({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1490818387583-1baba5e638ca?q=80&w=2132&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            {/* Header */}
            <header className="px-8 py-12 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32 items-center">
                <div className="flex-1 w-full order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-16">
                        {club.logo && <img src={club.logo} alt="Logo" className="w-8 h-8 rounded-none object-cover" />}
                        <span className="font-bold text-sm tracking-widest uppercase">{club.name}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 leading-tight">
                        {club.tagline}
                    </h1>

                    <p className="text-lg text-neutral-500 mb-12 max-w-lg leading-relaxed">
                        {club.tagline}
                    </p>

                    <a href="#memberships" className="inline-flex items-center gap-4 font-bold text-sm uppercase tracking-widest pb-2 border-b-2 border-transparent hover:border-black transition-colors group" style={{ color: primaryColor }}>
                        <span>Explore memberships</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                </div>

                <div className="flex-1 w-full order-1 md:order-2">
                    <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                        <img src={club.heroImage || defaultHero} alt="Hero" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                    </div>
                </div>
            </header>

            {/* Specials */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-8 max-w-7xl mx-auto border-t border-neutral-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-2">Today's Selection</h2>
                            <p className="text-3xl font-medium tracking-tight text-black">Curated for today.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-12">
                        {todaysSpecial.map(product => (
                            <div key={product.id} className="group">
                                <div className="h-px w-full bg-neutral-200 mb-6 group-hover:bg-black transition-colors"></div>
                                <h3 className="text-xl font-medium mb-3">{product.name}</h3>
                                <p className="text-neutral-500 text-sm leading-relaxed min-h-[60px] mb-6">{product.category}</p>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">{(product.price ?? 0).toLocaleString()} <span className="text-xs text-neutral-400 ml-1">{club.currencyName}</span></span>
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Plans */}
            <section id="memberships" className="py-24 bg-neutral-50 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-2">Memberships</h2>
                        <p className="text-3xl font-medium tracking-tight text-black">Simple, transparent options.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-0 border border-neutral-200 bg-white">
                        {membershipPlans.map((plan, idx) => (
                            <div key={plan.id} className={`p-10 md:p-12 hover:bg-neutral-50 transition-colors ${idx !== membershipPlans.length - 1 ? 'border-b md:border-b-0 md:border-r border-neutral-200' : ''}`}>
                                <h3 className="text-lg font-bold uppercase tracking-widest mb-1">{plan.name}</h3>
                                <p className="text-xs text-neutral-400 uppercase tracking-widest mb-10">{plan.durationDays ?? 0} Days</p>

                                <div className="text-5xl font-light tracking-tight mb-12">
                                    {(plan.price ?? 0).toLocaleString()}
                                    <span className="text-sm font-bold text-neutral-400 tracking-widest ml-2 uppercase">{club.currencyName}</span>
                                </div>

                                <ul className="space-y-4 mb-20 flex-1">
                                    {plan.benefits.map((benefit, i) => (
                                        <li key={i} className="flex gap-4 text-sm text-neutral-600">
                                            <span className="font-bold" style={{ color: primaryColor }}>+</span> {benefit}
                                        </li>
                                    ))}
                                </ul>

                                <button className="w-full py-4 border border-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                                    Select
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-16 border-t border-neutral-100">
                <div>
                    <h2 className="text-2xl font-medium tracking-tight mb-4">{club.name}</h2>
                    <p className="text-neutral-500 text-sm max-w-sm leading-relaxed">{"Our Club"}</p>
                </div>

                <div className="flex flex-col md:!items-end gap-2 text-sm font-medium">
                    {club.ownerPhone && (
                        <a href={`tel:${club.ownerPhone}`} className="hover:text-neutral-500 transition-colors">Call: {club.ownerPhone}</a>
                    )}
                    <a href="#" className="hover:text-neutral-500 transition-colors">Email Us</a>
                    <p className="text-neutral-400 mt-4 text-xs uppercase tracking-widest">&copy; {new Date().getFullYear()}</p>
                </div>
            </footer>
        </div>
    );
}
