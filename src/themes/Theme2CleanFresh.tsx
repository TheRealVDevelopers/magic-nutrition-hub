import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme2CleanFresh({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-green-200">
            {/* Header */}
            <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-md z-50 border-b border-stone-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {club.logo && <img src={club.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover" />}
                        <span className="font-bold text-xl tracking-tight">{club.name}</span>
                    </div>
                    <a href="#contact" className="px-5 py-2.5 rounded-full text-white font-medium text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                        Join Us
                    </a>
                </div>
            </nav>

            {/* Hero Section Split Layout */}
            <header className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <div className="flex-1 text-center lg:text-left">
                        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6 bg-stone-100" style={{ color: primaryColor }}>
                            Welcome to Wellness
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-stone-900">
                            {club.tagline}
                        </h1>
                        <p className="text-lg text-stone-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            {club.tagline}
                        </p>
                        <a href="#plans" className="inline-flex items-center justify-center px-8 py-4 rounded-full text-white font-medium text-lg shadow-sm hover:shadow-md transition-all" style={{ backgroundColor: primaryColor }}>
                            View Memberships
                        </a>
                    </div>
                    <div className="flex-1 w-full max-w-xl">
                        <div className="relative aspect-[4/5] lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                            <img src={club.heroImage || defaultHero} alt="Hero" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </header>

            {/* About Owner */}
            {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                <section className="py-20 bg-white">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="w-32 h-32 rounded-full object-cover mx-auto mb-6 shadow-md border-4 border-white" />
                        <h2 className="text-2xl font-bold mb-2 text-stone-900">Meet {club.ownerName}</h2>
                        <p className="text-stone-500">Club Owner & Wellness Coach</p>
                    </div>
                </section>
            )}

            {/* Today's Special */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 max-w-7xl mx-auto border-t border-stone-100">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-stone-900 mb-4">Fresh Today</h2>
                        <p className="text-stone-500 max-w-2xl mx-auto">Nourish your body with today's specially selected items.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {todaysSpecial.map(product => (
                            <div key={product.id} className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-stone-100 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-stone-50" style={{ color: primaryColor }}>
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-3">{product.name}</h3>
                                <p className="text-stone-500 mb-6 flex-1">{product.category}</p>
                                <div className="text-2xl font-extrabold text-stone-900">
                                    {(product.price ?? 0).toLocaleString()} <span className="text-sm text-stone-400 font-medium">{club.currencyName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Plans */}
            <section id="plans" className="py-24 px-6 bg-stone-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-stone-900 mb-4">Choose Your Path</h2>
                        <p className="text-stone-500 max-w-2xl mx-auto">Simple, transparent pricing for your wellness journey.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {membershipPlans.map(plan => (
                            <div key={plan.id} className="bg-white rounded-3xl p-8 shadow-sm flex flex-col relative overflow-hidden">
                                {plan.name.toLowerCase().includes('silver') && (
                                    <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: primaryColor }}></div>
                                )}
                                <h3 className="text-xl font-bold text-stone-900 mb-2">{plan.name}</h3>
                                <p className="text-stone-500 text-sm mb-6">{plan.durationDays ?? 0} Days Access</p>
                                <div className="mb-8">
                                    <span className="text-4xl font-extrabold text-stone-900">{(plan.price ?? 0).toLocaleString()}</span>
                                    <span className="text-stone-500 font-medium ml-2">{club.currencyName}</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start text-stone-600 text-sm">
                                            <svg className="w-5 h-5 mr-3 shrink-0" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                                <a href="#contact" className="block text-center w-full py-4 rounded-full font-medium transition-colors bg-stone-50 text-stone-900 hover:bg-stone-100">
                                    Get Started
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-stone-900 text-stone-400 py-16 px-6 text-center">
                <div className="max-w-xl mx-auto mb-10">
                    <h2 className="text-3xl font-bold text-white mb-6">Start Today</h2>
                    <p className="mb-8">{"Our Club"}</p>
                    {club.ownerPhone && (
                        <a href={`tel:${club.ownerPhone}`} className="inline-flex items-center justify-center px-8 py-4 rounded-full text-white font-medium text-lg transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                            Call {club.ownerPhone}
                        </a>
                    )}
                </div>
                <div className="pt-8 border-t border-stone-800 text-sm">
                    &copy; {new Date().getFullYear()} {club.name}. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
