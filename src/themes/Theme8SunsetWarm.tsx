import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme8SunsetWarm({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=2085&auto=format&fit=crop";

    // Sunset gradient derived from coral/orange tones and optionally the primaryColor
    const sunsetGradient = `linear-gradient(135deg, ${primaryColor || '#f97316'} 0%, #fb923c 50%, #fcd34d 100%)`;

    return (
        <div className="min-h-screen bg-orange-50 font-sans text-orange-950 selection:bg-orange-200">
            {/* Nav & Hero */}
            <div className="relative overflow-hidden pb-16">
                <div className="absolute inset-0 z-0 h-[80vh] rounded-b-[4rem] sm:rounded-b-[8rem]" style={{ background: sunsetGradient }}>
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                <nav className="relative z-10 px-6 py-6 max-w-7xl mx-auto flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        {club.logo && <img src={club.logo} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" />}
                        <span className="font-bold text-xl tracking-tight">{club.name}</span>
                    </div>
                </nav>

                <header className="relative z-10 px-6 pt-20 pb-32 max-w-5xl mx-auto text-center text-white">
                    <h1 className="text-5xl sm:text-7xl font-extrabold mb-8 tracking-tighter drop-shadow-md">
                        {club.tagline}
                    </h1>
                    <p className="text-xl sm:text-2xl font-medium mb-12 max-w-2xl mx-auto opacity-90 drop-shadow-sm leading-relaxed">
                        {club.tagline}
                    </p>
                    <a href="#plans" className="inline-block px-10 py-5 bg-white text-orange-600 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg">
                        Dive Into Wellness
                    </a>
                </header>

                <div className="relative z-20 px-6 max-w-4xl mx-auto -mt-20">
                    <div className="aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-white">
                        <img src={club.heroImage || defaultHero} alt="Community" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>

            {/* Specials */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 max-w-6xl mx-auto">
                    <div className="flex flex-col items-center mb-16 text-center">
                        <span className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-2">Sunshine Picks</span>
                        <h2 className="text-4xl font-extrabold">Today's Specials</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {todaysSpecial.map(product => (
                            <div key={product.id} className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-orange-100/50">
                                <div className="w-12 h-12 rounded-full mb-6 flex items-center justify-center text-white font-bold" style={{ background: sunsetGradient }}>
                                    ✨
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-orange-900">{product.name}</h3>
                                <p className="text-orange-950/60 mb-8 min-h-[60px] leading-relaxed">{product.notes}</p>
                                <div className="flex items-end gap-2 border-t border-orange-50 pt-4">
                                    <span className="text-3xl font-extrabold text-orange-600">{product.pricePerUnit.toLocaleString()}</span>
                                    <span className="text-sm font-bold text-orange-400 uppercase mb-1">{club.currencyName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Memberships */}
            <section id="plans" className="py-24 px-6 bg-orange-100/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 relative">
                        <span className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-2 block">Join The Family</span>
                        <h2 className="text-4xl font-extrabold">Community Plans</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {membershipPlans.map(plan => (
                            <div key={plan.id} className="bg-white rounded-[2rem] p-10 shadow-sm border border-orange-100 flex flex-col relative overflow-hidden">
                                {plan.name.toLowerCase().includes('gold') && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 rounded-bl-full flex justify-end items-start p-4">
                                        <span className="text-xl">☀️</span>
                                    </div>
                                )}
                                <h3 className="text-2xl font-extrabold text-orange-900 mb-1">{plan.name}</h3>
                                <p className="text-orange-500 font-bold text-sm uppercase mb-8">{plan.durationDays} Days Duration</p>
                                <div className="flex items-baseline gap-2 mb-10">
                                    <span className="text-5xl font-extrabold text-orange-600">{plan.price.toLocaleString()}</span>
                                    <span className="text-orange-400 font-bold uppercase">{club.currencyName}</span>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.benefits.map((benefit, i) => (
                                        <li key={i} className="flex gap-3 text-orange-950/70 items-start">
                                            <svg className="w-6 h-6 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span className="pt-0.5">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-4 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all" style={{ background: sunsetGradient }}>
                                    Choose Plan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Owner & Footer */}
            <footer className="py-24 px-6 bg-white text-center">
                <div className="max-w-2xl mx-auto">
                    {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                        <div className="mb-8 hidden sm:block">
                            <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-orange-100" />
                            <p className="mt-4 font-bold text-orange-900">Your Host, {club.ownerName}</p>
                        </div>
                    )}
                    <h2 className="text-3xl font-extrabold text-orange-900 mb-8">{club.name}</h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-12 mb-12 text-orange-950/60 font-medium">
                        <div className="bg-orange-50 px-6 py-4 rounded-2xl">
                            <p className="text-xs uppercase text-orange-400 font-bold tracking-widest mb-1">Visit Us</p>
                            <p>{"Our Club"}</p>
                        </div>
                        {club.ownerPhone && (
                            <div className="bg-orange-50 px-6 py-4 rounded-2xl">
                                <p className="text-xs uppercase text-orange-400 font-bold tracking-widest mb-1">Call Us</p>
                                <p>{club.ownerPhone}</p>
                            </div>
                        )}
                    </div>
                    <p className="text-sm font-bold text-orange-300 uppercase tracking-widest">&copy; {new Date().getFullYear()} Community Wellness</p>
                </div>
            </footer>
        </div>
    );
}
