import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme4OceanCalm({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=2070&auto=format&fit=crop";

    // A soft, beachy gradient fallback
    const themeGradient = `linear-gradient(135deg, ${primaryColor}40, #e0f2fe)`;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-700 font-sans font-light">
            {/* Nav */}
            <nav className="absolute top-0 w-full p-6 z-20 flex justify-center">
                {club.logo && (
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-white">
                        <img src={club.logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
                    </div>
                )}
            </nav>

            {/* Hero */}
            <header className="relative pt-32 pb-40 px-6 text-center overflow-hidden" style={{ background: themeGradient }}>
                <div className="relative z-10 max-w-3xl mx-auto mt-12">
                    <h1 className="text-4xl sm:text-6xl font-normal text-slate-800 mb-6 tracking-tight">
                        {club.name}
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-xl mx-auto opacity-90">
                        {club.tagline}
                    </p>
                    <a href="#join" className="inline-block px-8 py-4 bg-white text-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow font-medium">
                        Begin Your Journey
                    </a>
                </div>
                {/* SVG Wave */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                    <svg className="relative block w-[calc(100%+1.3px)] h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.41,126,192.81,116.1,236.4,109.1,279.4,87.7,321.39,56.44Z" fill="#f8fafc"></path>
                    </svg>
                </div>
            </header>

            {/* About Split */}
            <section className="py-20 px-6 max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                <div className="flex-1 w-full relative">
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg shadow-slate-200">
                        <img src={club.heroImage || defaultHero} alt="About" className="w-full h-full object-cover" />
                    </div>
                    {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full overflow-hidden border-8 border-slate-50 shadow-sm hidden md:block">
                            <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-3 font-semibold">Our Philosophy</h2>
                    <h3 className="text-3xl text-slate-800 mb-6">{club.tagline}</h3>
                    {club.ownerName && <p className="text-slate-500 font-medium">— {club.ownerName}</p>}
                </div>
            </section>

            {/* Today's Special */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 bg-white relative">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl text-slate-800 mb-4">Today's Refreshments</h2>
                            <p className="text-slate-500">Carefully prepared for you today.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
                            {todaysSpecial.map(product => (
                                <div key={product.id} className="bg-slate-50 rounded-3xl p-8 hover:-translate-y-1 transition-transform border border-slate-100">
                                    <h3 className="text-xl font-medium text-slate-800 mb-3">{product.name}</h3>
                                    <p className="text-slate-500 mb-6 min-h-[50px]">{product.notes}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-medium text-slate-600">{product.pricePerUnit} {club.currencyName}</span>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm" style={{ color: primaryColor }}>
                                            +
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Plans */}
            <section id="join" className="py-24 px-6 max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl text-slate-800 mb-4">Find Your Rhythm</h2>
                    <p className="text-slate-500">Memberships designed around your lifestyle.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {membershipPlans.map((plan, idx) => (
                        <div key={plan.id} className={`bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col ${idx === 1 ? 'md:-translate-y-4 shadow-md' : ''}`}>
                            <h3 className="text-2xl font-medium text-slate-800 mb-2">{plan.name}</h3>
                            <p className="text-sm text-slate-400 mb-6">{plan.durationDays} Days</p>
                            <div className="text-4xl text-slate-800 font-light mb-8">
                                {plan.price} <span className="text-lg text-slate-400">{club.currencyName}</span>
                            </div>
                            <div className="h-px w-full bg-slate-100 mb-8"></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.benefits.map((benefit, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600 text-sm">
                                        <span style={{ color: primaryColor }}>✓</span> {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-800 text-slate-300 py-16 px-6 text-center text-sm">
                <div className="max-w-xl mx-auto mb-10 space-y-4">
                    <h2 className="text-2xl text-white font-normal mb-6">{club.name}</h2>
                    <p className="opacity-70">{"Our Club"}</p>
                    {club.ownerPhone && <p className="opacity-70">{club.ownerPhone}</p>}
                </div>
                <p className="opacity-50">&copy; {new Date().getFullYear()} {club.name}</p>
            </footer>
        </div>
    );
}
