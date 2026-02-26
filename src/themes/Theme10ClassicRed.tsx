import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme10ClassicRed({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=2070&auto=format&fit=crop";

    // Classic brand feel: Red (or primary), White, Dark Gray
    const brandColor = primaryColor || '#dc2626';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* Top Bar */}
            <div className="w-full h-2" style={{ backgroundColor: brandColor }}></div>

            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {club.logo && <img src={club.logo} alt="Logo" className="w-10 h-10 object-contain" />}
                        <span className="font-extrabold text-2xl tracking-tight text-gray-900">{club.name}</span>
                    </div>
                    {club.ownerPhone && (
                        <div className="hidden sm:flex items-center gap-2 font-semibold text-sm">
                            <span className="text-gray-500">Call Us:</span>
                            <span style={{ color: brandColor }}>{club.ownerPhone}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Layered */}
            <section className="relative bg-gray-900">
                <div className="absolute inset-0 z-0">
                    <img src={club.heroImage || defaultHero} alt="Hero" className="w-full h-full object-cover opacity-50" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-48 flex flex-col items-center text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-wider drop-shadow-md max-w-4xl">
                        {club.tagline}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 font-medium mb-10 max-w-2xl drop-shadow">
                        {club.tagline}
                    </p>
                    <a href="#plans" className="inline-block px-12 py-4 text-white font-bold text-lg uppercase tracking-wider rounded-sm hover:-translate-y-1 transition-transform shadow-lg" style={{ backgroundColor: brandColor }}>
                        Join The Club
                    </a>
                </div>
            </section>

            {/* Strip */}
            <div className="py-6 px-6 text-center text-white font-bold uppercase tracking-widest text-sm" style={{ backgroundColor: brandColor }}>
                Nutrition • Community • Results
            </div>

            {/* Coach Section */}
            {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                <section className="py-16 px-6 bg-white border-b border-gray-200">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 justify-center">
                        <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-md" />
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-black text-gray-900 uppercase">Coach {club.ownerName}</h2>
                            <p className="text-gray-500 font-medium text-lg">Your Personal Wellness Guide</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Specials Grid */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2">Today's <span style={{ color: brandColor }}>Specials</span></h2>
                        <div className="w-16 h-1 mx-auto" style={{ backgroundColor: brandColor }}></div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {todaysSpecial.map(product => (
                            <div key={product.id} className="bg-white border border-gray-200 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-shadow group rounded-xl">
                                <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center font-bold text-white text-xl shadow-inner transition-transform group-hover:scale-110" style={{ backgroundColor: brandColor }}>
                                    {product.name.charAt(0)}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                                <p className="text-gray-500 text-sm mb-6 flex-1">{product.notes}</p>
                                <div className="text-2xl font-black text-gray-900 w-full pt-4 border-t border-gray-100">
                                    {product.pricePerUnit} <span className="text-xs text-gray-400 font-bold uppercase">{club.currencyName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Plans */}
            <section id="plans" className="py-24 px-6 bg-gray-900 text-white pattern-bg">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .pattern-bg {
                        background-color: #111827;
                        background-image: radial-gradient(#374151 1px, transparent 1px);
                        background-size: 20px 20px;
                    }
                `}} />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Membership <span style={{ color: brandColor }}>Levels</span></h2>
                        <div className="w-16 h-1 mx-auto" style={{ backgroundColor: brandColor }}></div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 items-start">
                        {membershipPlans.map((plan, idx) => (
                            <div key={plan.id} className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
                                {idx === 1 && (
                                    <div className="absolute top-0 right-0 py-1 px-4 text-xs font-bold text-white uppercase" style={{ backgroundColor: brandColor }}>
                                        Popular
                                    </div>
                                )}
                                <div className="p-8 pb-6 border-b border-gray-100 bg-gray-50 text-center">
                                    <h3 className="text-2xl font-black uppercase tracking-widest text-gray-800">{plan.name}</h3>
                                    <p className="text-gray-500 font-medium text-sm mt-1">{plan.durationDays} Days</p>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="text-center mb-8">
                                        <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                                        <span className="text-lg font-bold text-gray-400 ml-1">{club.currencyName}</span>
                                    </div>
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {plan.benefits.map((benefit, i) => (
                                            <li key={i} className="flex gap-3 text-gray-600 font-medium items-start">
                                                <svg className="w-5 h-5 shrink-0" style={{ color: brandColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="w-full py-4 text-white font-bold uppercase tracking-widest text-sm rounded-sm hover:-translate-y-0.5 transition-transform shadow-md" style={{ backgroundColor: brandColor }}>
                                        Select Plan
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 pt-16 pb-8 px-6 text-center">
                <div className="max-w-4xl mx-auto mb-10">
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">{club.name}</h2>
                    <p className="text-gray-600 font-medium max-w-md mx-auto mb-8">{"Our Club"}</p>
                    {club.ownerPhone && (
                        <p className="inline-flex items-center justify-center font-bold text-xl px-6 py-3 border-2 rounded-full" style={{ borderColor: brandColor, color: brandColor }}>
                            {club.ownerPhone}
                        </p>
                    )}
                </div>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider pt-8 border-t border-gray-100">
                    &copy; {new Date().getFullYear()} {club.name}. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
}
