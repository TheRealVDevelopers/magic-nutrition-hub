import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme9NightMode({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=2070&auto=format&fit=crop";

    // Primary color as a glowing neon
    const neonGlow = primaryColor || '#3b82f6';
    const neonShadow = `0 0 10px ${neonGlow}40, 0 0 20px ${neonGlow}20`;
    const neonTextShadow = `0 0 5px ${neonGlow}60, 0 0 10px ${neonGlow}40`;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-zinc-800">
            {/* Header */}
            <header className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 border-b border-zinc-900 overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>

                <nav className="absolute top-0 w-full p-8 flex justify-between items-center z-20">
                    <div className="flex items-center gap-4">
                        {club.logo && <img src={club.logo} alt="Logo" className="w-10 h-10 rounded-sm object-cover filter brightness-110" />}
                        <span className="font-black text-xl tracking-tighter text-white" style={{ textShadow: neonTextShadow }}>{club.name}</span>
                    </div>
                </nav>

                <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 mt-16">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 font-mono">
                            System / Online
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6 tracking-tighter mix-blend-screen">
                            {club.tagline}
                        </h1>
                        <p className="text-lg text-zinc-500 mb-10 max-w-md mx-auto md:mx-0 font-medium">
                            {club.tagline}
                        </p>
                        <a href="#plans" className="inline-block px-10 py-4 bg-zinc-900 text-white font-bold uppercase tracking-widest text-sm transition-all hover:bg-zinc-800 border" style={{ borderColor: neonGlow, boxShadow: neonShadow }}>
                            Initialize
                        </a>
                    </div>
                    <div className="flex-1 w-full relative">
                        {/* Image framed with neon */}
                        <div className="aspect-square relative z-10 p-2 bg-zinc-900 border" style={{ borderColor: neonGlow, boxShadow: neonShadow }}>
                            <img src={club.heroImage || defaultHero} alt="Hero" className="w-full h-full object-cover filter grayscale contrast-125 brightness-90" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Owner Section */}
            {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                <section className="py-20 px-6 border-b border-zinc-900/50 bg-[#0f0f0f]">
                    <div className="max-w-4xl mx-auto flex items-center justify-center gap-8">
                        <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt={club.ownerName} className="w-20 h-20 object-cover border border-zinc-800 p-1" />
                        <div>
                            <p className="text-sm font-mono text-zinc-500 uppercase">Operator</p>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{club.ownerName}</h2>
                        </div>
                    </div>
                </section>
            )}

            {/* Modules (Specials) */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 border-b border-zinc-900/50">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-16 border-l-4 pl-6" style={{ borderColor: neonGlow }}>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Active Modules</h2>
                            <p className="text-zinc-500 font-mono text-sm">Today's specialized enhancements</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {todaysSpecial.map((product, idx) => (
                                <div key={product.id} className="bg-[#141414] border border-zinc-800 p-8 hover:border-zinc-700 transition-colors relative group">
                                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-xs font-mono font-bold border-b border-l border-zinc-800 text-zinc-600">
                                        0{idx + 1}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-zinc-300">{product.name}</h3>
                                    <p className="text-zinc-500 text-sm mb-8 min-h-[60px]">{product.category}</p>
                                    <div className="flex justify-between items-baseline border-t border-zinc-900 pt-6">
                                        <div className="font-mono text-xl text-white">
                                            {product.price} <span className="text-xs text-zinc-600 ml-1">{club.currencyName}</span>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: neonGlow }}>Available</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Plans */}
            <section id="plans" className="py-24 px-6 relative overflow-hidden bg-[#0a0a0a]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ backgroundColor: neonGlow }}></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Access Levels</h2>
                        <div className="flex justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-800"></span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: neonGlow }}></span>
                            <span className="w-2 h-2 rounded-full bg-zinc-800"></span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {membershipPlans.map((plan, idx) => (
                            <div key={plan.id} className={`bg-[#141414] border p-8 flex flex-col ${idx === 1 ? 'border-zinc-700 shadow-2xl relative md:-translate-y-4' : 'border-zinc-800'}`}>
                                {idx === 1 && <div className="absolute -top-px left-0 w-full h-1" style={{ backgroundColor: neonGlow, boxShadow: neonShadow }}></div>}

                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{plan.name}</h3>
                                <p className="font-mono text-xs text-zinc-500 mb-8 uppercase tracking-widest pl-0.5">{plan.durationDays ?? 0} Cycles</p>

                                <div className="mb-10 pl-0.5">
                                    <span className="text-5xl font-black text-white">{plan.price}</span>
                                    <span className="font-mono text-sm text-zinc-600 ml-2">{club.currencyName}</span>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.benefits.map((benefit, i) => (
                                        <li key={i} className="flex gap-4 text-zinc-400 text-sm items-start">
                                            <span className="font-mono text-xs mt-1" style={{ color: neonGlow }}>{'>'}</span> {benefit}
                                        </li>
                                    ))}
                                </ul>

                                <button className="w-full py-4 text-xs font-bold uppercase tracking-widest text-black bg-zinc-200 hover:bg-white transition-colors">
                                    Upgrade
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-zinc-900 bg-[#050505]">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-xs font-mono text-zinc-600 uppercase tracking-widest">
                    <div className="flex flex-col gap-2">
                        <span className="text-white font-bold text-sm tracking-tighter">{club.name}</span>
                        <span>{"Our Club"}</span>
                        {club.ownerPhone && <span>Comms: {club.ownerPhone}</span>}
                    </div>
                    <div className="text-right">
                        <span>SYS.VER 1.0.0</span>
                        <p className="mt-2 opacity-50">&copy; {new Date().getFullYear()} Ntwk. All rights.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
