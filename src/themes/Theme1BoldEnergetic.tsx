import React from "react";
import type { LandingPageProps } from "./types";
import { format } from "date-fns";

export default function Theme1BoldEnergetic({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500 selection:text-white pb-20">
            {/* Hero Section */}
            <header className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={club.heroImage || defaultHero}
                        alt={club.name}
                        className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                        onError={(e) => { (e.target as HTMLImageElement).src = defaultHero; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    {club.logo && (
                        <img src={club.logo} alt="Logo" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-8 border-4 border-white/10 shadow-2xl object-cover" />
                    )}
                    <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter mb-4 pb-2" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                        {club.name}
                    </h1>
                    <p className="text-xl sm:text-2xl font-medium text-slate-300 mb-10 tracking-wide max-w-2xl mx-auto">
                        {club.tagline}
                    </p>
                    <a
                        href="#contact"
                        className="inline-block px-10 py-5 text-lg font-bold uppercase tracking-widest rounded-none transition-transform hover:scale-105"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Join Us Now
                    </a>
                </div>
            </header>

            {/* About Section */}
            <section className="py-24 px-6 max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">About The Club</h2>
                        <h3 className="text-4xl font-black mb-6 uppercase">Unleash Your <span style={{ color: primaryColor }}>Potential</span></h3>
                        <p className="text-lg text-slate-400 leading-relaxed italic border-l-4 pl-4" style={{ borderColor: primaryColor }}>
                            "{club.tagline}"
                        </p>
                    </div>
                    {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                        <div className="relative">
                            <div className="absolute inset-0 transform translate-x-4 translate-y-4 border-2" style={{ borderColor: primaryColor }}></div>
                            <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="relative z-10 w-full aspect-square object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                            <div className="absolute bottom-6 left-[-1rem] z-20 bg-white text-black p-4 inline-block font-bold uppercase">
                                Hosted by {club.ownerName}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Today's Special */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 bg-slate-900 border-y border-white/5">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Daily Focus</h2>
                                <h3 className="text-4xl font-black uppercase">Today's <span style={{ color: primaryColor }}>Specials</span></h3>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {todaysSpecial.map(product => (
                                <div key={product.id} className="group relative bg-slate-950 p-6 border border-white/10 hover:border-white/30 transition-colors">
                                    <div className="w-16 h-1 bg-slate-800 mb-6 group-hover:bg-white transition-colors" style={{ backgroundColor: primaryColor }}></div>
                                    <h4 className="text-2xl font-bold mb-2">{product.name}</h4>
                                    <p className="text-slate-400 mb-6 min-h-[60px]">{product.category}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-black">{(product.price ?? 0).toLocaleString()} {club.currencyName}</span>
                                        <span className="text-xs uppercase font-bold px-3 py-1 bg-white text-black">Available Today</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Memberships */}
            <section className="py-24 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Commit To Greatness</h2>
                    <h3 className="text-4xl font-black uppercase">Membership <span style={{ color: primaryColor }}>Plans</span></h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {membershipPlans.map(plan => (
                        <div key={plan.id} className="relative bg-slate-900 border border-white/10 p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300">
                            {plan.name.toLowerCase().includes('gold') && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 text-xs font-bold uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}
                            <h4 className="text-2xl font-black uppercase mb-2">{plan.name}</h4>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-black" style={{ color: primaryColor }}>{(plan.price ?? 0).toLocaleString()}</span>
                                <span className="text-slate-400 font-bold uppercase">{club.currencyName}</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <div className="w-4 h-4 mt-1 bg-white shrink-0" style={{ backgroundColor: primaryColor, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-center text-slate-500 font-bold uppercase mb-4">Duration: {plan.durationDays ?? 0} Days</p>
                            <a
                                href="#contact"
                                className="block w-full text-center py-4 font-bold uppercase tracking-widest bg-white text-black hover:bg-slate-200 transition-colors"
                            >
                                Select Plan
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact / Footer */}
            <footer id="contact" className="bg-black pt-24 px-6 pb-12 text-center border-t-8" style={{ borderColor: primaryColor }}>
                <div className="max-w-3xl mx-auto mb-16">
                    <h2 className="text-5xl font-black uppercase mb-8">Ready To <span style={{ color: primaryColor }}>Start?</span></h2>
                    <p className="text-xl text-slate-400 mb-10">Visit us or call today to schedule your first session.</p>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12">
                        {club.ownerPhone && (
                            <div className="bg-slate-900 px-8 py-6 w-full md:w-auto border border-white/10">
                                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Call Us</p>
                                <p className="text-2xl font-bold">{club.ownerPhone}</p>
                            </div>
                        )}
                        {"Our Club" && (
                            <div className="bg-slate-900 px-8 py-6 w-full md:w-auto border border-white/10">
                                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Location</p>
                                <p className="text-lg font-bold">{"Our Club"}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-slate-600 text-sm font-bold uppercase tracking-widest pt-8 border-t border-white/10">
                    &copy; {new Date().getFullYear()} {club.name}. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
}
