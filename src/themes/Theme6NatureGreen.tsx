import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme6NatureGreen({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2026&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-[#f4f1ea] text-[#3e4e3e] font-serif selection:bg-green-700 selection:text-white">
            {/* Header / Nav */}
            <header className="relative w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img src={club.heroImage || defaultHero} alt="Nature" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#2d3a2d]/70 mix-blend-multiply"></div>
                </div>

                <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center text-[#f4f1ea]">
                    <div className="flex items-center gap-4">
                        {club.logo && <img src={club.logo} alt="Logo" className="w-12 h-12 rounded-full border border-[#f4f1ea] object-cover" />}
                        <span className="font-bold text-2xl tracking-tighter">{club.name}</span>
                    </div>
                </nav>

                <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center text-[#f4f1ea]">
                    <h1 className="text-5xl md:text-7xl mb-6 leading-tight drop-shadow-md">
                        {club.tagline}
                    </h1>
                    <div className="w-24 h-1 mx-auto mb-10 opacity-80" style={{ backgroundColor: primaryColor }}></div>
                    <a href="#discover" className="inline-block px-10 py-5 rounded-sm uppercase tracking-widest text-sm font-bold bg-[#f4f1ea] transition-all hover:bg-white" style={{ color: primaryColor }}>
                        Discover Nature
                    </a>
                </div>
            </header>

            {/* Organic About Section */}
            <section id="discover" className="py-24 px-6 relative overflow-hidden">
                <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-green-900/5 blur-3xl"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-green-900/5 blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="block text-sm uppercase tracking-[0.3em] font-sans mb-4" style={{ color: primaryColor }}>Our Roots</span>
                    <h2 className="text-3xl md:text-5xl leading-relaxed mb-12 text-[#2d3a2d]">
                        "{club.tagline}"
                    </h2>
                    {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                        <div className="inline-block">
                            <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 p-1" style={{ borderColor: primaryColor }} />
                            <p className="font-sans uppercase tracking-widest text-sm font-bold">{club.ownerName}</p>
                            <p className="font-sans text-xs uppercase tracking-widest opacity-60">Cultivator</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Earthy Product Section */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 bg-[#2d3a2d] text-[#f4f1ea]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl mb-4 font-bold">Harvest of the Day</h2>
                            <p className="font-sans tracking-wide opacity-80">Fresh picks from our organic selection.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {todaysSpecial.map((product, idx) => (
                                <div key={product.id} className={`p-8 border border-white/10 hover:border-white/30 transition-colors ${idx % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}>
                                    <h3 className="text-2xl font-bold mb-3">{product.name}</h3>
                                    <p className="font-sans text-sm opacity-70 mb-6 leading-relaxed min-h-[60px]">{product.category}</p>
                                    <div className="flex justify-between items-end font-sans">
                                        <div>
                                            <span className="text-xl font-bold mr-1">{product.price}</span>
                                            <span className="text-xs uppercase tracking-widest opacity-60">{club.currencyName}</span>
                                        </div>
                                        <div className="text-xs uppercase tracking-widest font-bold px-3 py-1" style={{ backgroundColor: primaryColor, color: '#f4f1ea' }}>Fresh</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Natural Plans */}
            <section className="py-24 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="block text-sm uppercase tracking-[0.3em] font-sans mb-4" style={{ color: primaryColor }}>Grow With Us</span>
                    <h2 className="text-4xl text-[#2d3a2d] font-bold">Membership Plans</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {membershipPlans.map(plan => (
                        <div key={plan.id} className="bg-white p-10 border border-[#e0ddcd] shadow-sm relative group">
                            <div className="absolute top-0 left-0 w-full h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ backgroundColor: primaryColor }}></div>
                            <h3 className="text-2xl font-bold text-[#2d3a2d] mb-1">{plan.name}</h3>
                            <p className="font-sans text-xs uppercase tracking-widest opacity-60 mb-6">{plan.durationDays ?? 0} Days</p>
                            <div className="mb-8 font-sans">
                                <span className="text-4xl font-bold text-[#2d3a2d]" style={{ color: primaryColor }}>{plan.price}</span>
                                <span className="text-sm font-bold opacity-60 ml-2 uppercase">{club.currencyName}</span>
                            </div>
                            <ul className="space-y-4 mb-10 font-sans text-sm">
                                {plan.benefits.map((benefit, i) => (
                                    <li key={i} className="flex gap-4 items-start border-b border-[#f4f1ea] pb-4 last:border-0 last:pb-0">
                                        <span className="font-serif italic text-lg opacity-40">0{i + 1}</span>
                                        <span className="pt-0.5">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <a href="#contact" className="block w-full text-center py-4 font-sans text-xs font-bold uppercase tracking-widest border border-[#2d3a2d] text-[#2d3a2d] hover:bg-[#2d3a2d] hover:text-[#f4f1ea] transition-colors">
                                Plant Your Seed
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* Minimal Footer */}
            <footer id="contact" className="py-24 px-6 bg-[#1a231a] text-[#8e9d8e] text-center font-sans tracking-wide">
                <div className="max-w-2xl mx-auto">
                    <h2 className="font-serif text-3xl text-[#f4f1ea] mb-8">{club.name}</h2>
                    <div className="flex flex-col md:flex-row justify-center gap-6 mb-12 text-sm uppercase tracking-widest">
                        <span>{"Our Club"}</span>
                        <span className="hidden md:inline">•</span>
                        {club.ownerPhone && <span>T: {club.ownerPhone}</span>}
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] opacity-50">&copy; {new Date().getFullYear()} {club.name}</p>
                </div>
            </footer>
        </div>
    );
}
