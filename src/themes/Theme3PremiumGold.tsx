import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme3PremiumGold({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop";

    // Use primaryColor as the 'gold' accent if possible, otherwise rely on a warm metallic look.
    const goldAccent = primaryColor || "#d4af37";

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-300 font-serif selection:bg-yellow-900 selection:text-white">
            {/* Nav */}
            <nav className="absolute top-0 inset-x-0 z-50 p-8 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    {club.logo && <img src={club.logo} alt="Logo" className="w-12 h-12 rounded-full border border-neutral-700 object-cover" />}
                    <span className="font-semibold text-xl tracking-widest uppercase text-white">{club.name}</span>
                </div>
            </nav>

            {/* Hero */}
            <header className="relative min-h-[90vh] flex items-center justify-center text-center px-6">
                <div className="absolute inset-0 z-0">
                    <img src={club.heroImage || defaultHero} alt="Hero" className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 via-neutral-950/80 to-neutral-950"></div>
                </div>
                <div className="relative z-10 max-w-3xl mx-auto mt-20">
                    <p className="text-sm font-medium tracking-[0.3em] uppercase mb-4" style={{ color: goldAccent }}>Exclusive Nutrition Club</p>
                    <h1 className="text-5xl sm:text-7xl font-light text-white leading-tight mb-8">
                        {club.tagline}
                    </h1>
                    <div className="w-24 h-px mx-auto mb-8" style={{ backgroundColor: goldAccent }}></div>
                    <a href="#about" className="inline-block border text-sm uppercase tracking-widest px-8 py-4 transition-all hover:bg-white hover:text-black border-neutral-600 text-white">
                        Discover More
                    </a>
                </div>
            </header>

            {/* About */}
            <section id="about" className="py-32 px-6 max-w-4xl mx-auto text-center">
                <h2 className="text-3xl text-white font-light tracking-wide mb-8">An Elevated Experience</h2>
                <p className="text-xl leading-relaxed text-neutral-400 mb-12 font-sans tracking-wide">
                    {club.tagline}
                </p>
                {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                    <div className="flex flex-col items-center">
                        <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="w-20 h-20 rounded-full object-cover mb-4" style={{ border: `2px solid ${goldAccent}` }} />
                        <span className="text-xs uppercase tracking-widest text-neutral-500">Curated by {club.ownerName}</span>
                    </div>
                )}
            </section>

            {/* Today's Special */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 bg-neutral-900 border-y border-neutral-800">
                    <div className="max-w-6xl mx-auto text-center">
                        <p className="text-sm tracking-[0.2em] uppercase mb-4" style={{ color: goldAccent }}>Exclusive Offerings</p>
                        <h2 className="text-4xl text-white font-light mb-16">Today's Selection</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 font-sans">
                            {todaysSpecial.map(product => (
                                <div key={product.id} className="text-center group">
                                    <div className="w-full aspect-[4/3] bg-neutral-800 mb-6 flex items-center justify-center p-8 transition-colors group-hover:bg-neutral-800/80">
                                        <h3 className="text-2xl font-serif text-white">{product.name}</h3>
                                    </div>
                                    <p className="text-neutral-400 text-sm mb-4">{product.category}</p>
                                    <p className="text-lg text-white tracking-widest">{(product.price ?? 0).toLocaleString()} {club.currencyName}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Memberships */}
            <section className="py-32 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl text-white font-light mb-6">Membership Privileges</h2>
                    <div className="w-16 h-px mx-auto" style={{ backgroundColor: goldAccent }}></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8 font-sans">
                    {membershipPlans.map(plan => (
                        <div key={plan.id} className="border border-neutral-800 p-10 flex flex-col items-center text-center transition-all hover:border-neutral-600 bg-neutral-900/50">
                            <h3 className="text-xl text-white uppercase tracking-widest mb-2 font-serif">{plan.name}</h3>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-8">{plan.durationDays ?? 0} Days</p>
                            <p className="text-3xl text-white mb-10" style={{ color: goldAccent }}>
                                {(plan.price ?? 0).toLocaleString()} <span className="text-sm text-neutral-500">{club.currencyName}</span>
                            </p>
                            <ul className="space-y-4 mb-12 flex-1 w-full text-sm text-neutral-400 text-left border-t border-neutral-800 pt-8">
                                {plan.benefits.map((benefit, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span style={{ color: goldAccent }}>•</span> {benefit}
                                    </li>
                                ))}
                            </ul>
                            <a href="#contact" className="text-xs uppercase tracking-[0.2em] text-white hover:text-neutral-400 pb-2 border-b" style={{ borderBottomColor: goldAccent }}>
                                Inquire Now
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-black py-24 px-6 text-center border-t border-neutral-900">
                <div className="max-w-xl mx-auto">
                    {club.logo && <img src={club.logo} alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-8 opacity-50 grayscale object-cover" />}
                    <h2 className="text-2xl text-white font-light mb-8 font-serif">{club.name}</h2>
                    <div className="font-sans text-sm text-neutral-500 space-y-4 mb-16 tracking-wide">
                        <p>{"Our Club"}</p>
                        {club.ownerPhone && <p>T: {club.ownerPhone}</p>}
                    </div>
                    <p className="text-xs text-neutral-700 tracking-widest uppercase">&copy; {new Date().getFullYear()} All Rights Reserved</p>
                </div>
            </footer>
        </div>
    );
}
