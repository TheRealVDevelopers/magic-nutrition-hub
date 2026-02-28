import React from "react";
import type { LandingPageProps } from "./types";

export default function Theme5VibrantPurple({ club, membershipPlans, todaysSpecial, primaryColor }: LandingPageProps) {
    const defaultHero = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop";

    // Dynamic gradient based on primaryColor
    const gradientBg = `linear-gradient(135deg, ${primaryColor} 0%, #a855f7 100%)`;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Hero */}
            <header className="relative w-full min-h-[85vh] flex flex-col items-center justify-center p-6 text-center rounded-b-[3rem] sm:rounded-b-[5rem] overflow-hidden" style={{ background: gradientBg }}>
                {/* Decorative blob */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full mix-blend-overlay blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-black/10 rounded-full mix-blend-overlay blur-3xl"></div>

                <div className="relative z-10 w-full max-w-4xl mx-auto">
                    {club.logo && (
                        <div className="inline-block p-2 bg-white/20 backdrop-blur-md rounded-3xl mb-8 border border-white/20 shadow-xl">
                            <img src={club.logo} alt="Logo" className="w-20 h-20 rounded-2xl object-cover" />
                        </div>
                    )}
                    <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6 drop-shadow-sm">
                        {club.name}
                    </h1>
                    <p className="text-xl sm:text-2xl text-white/90 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        {club.tagline}
                    </p>
                    <a href="#join" className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 font-bold text-lg rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
                        Get Started Today
                    </a>
                </div>
            </header>

            {/* Image / About Card */}
            <section className="relative -mt-24 px-6 max-w-5xl mx-auto z-20">
                <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-10 items-center">
                    <div className="w-full md:w-1/2 aspect-[4/3] rounded-[1.5rem] overflow-hidden relative shadow-inner">
                        <img src={club.heroImage || defaultHero} alt="Club" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-bold text-sm tracking-wide mb-4">About Us</div>
                        <h2 className="text-3xl font-extrabold mb-4">{club.tagline}</h2>
                        <div className="flex items-center gap-4 mt-8">
                            {(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`) && (
                                <img src={(`https://ui-avatars.com/api/?name=${encodeURIComponent(club.ownerName)}&background=random`)} alt="Owner" className="w-14 h-14 rounded-full object-cover border-2 border-slate-200" />
                            )}
                            <div>
                                <p className="font-bold">{club.ownerName}</p>
                                <p className="text-slate-500 text-sm">Club Director</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Specials */}
            {todaysSpecial && todaysSpecial.length > 0 && (
                <section className="py-24 px-6 max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold mb-4">Today's Specials</h2>
                        <p className="text-lg text-slate-500">Grab them while they're hot (or cold!)</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {todaysSpecial.map(product => (
                            <div key={product.id} className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all border border-slate-100 group">
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-violet-600 transition-colors">{product.name}</h3>
                                <p className="text-slate-500 mb-8">{product.category}</p>
                                <div className="flex justify-between items-center px-6 py-4 bg-slate-50 rounded-2xl">
                                    <span className="font-extrabold text-2xl">{product.price}</span>
                                    <span className="text-slate-400 font-bold">{club.currencyName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Memberships */}
            <section id="join" className="py-24 px-6 bg-slate-900 text-white rounded-[3rem] mx-4 sm:mx-8 mb-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold mb-4">Choose Your Plan</h2>
                        <p className="text-slate-400 text-lg">No hidden fees, cancel anytime.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {membershipPlans.map(plan => (
                            <div key={plan.id} className="bg-slate-800 rounded-[2.5rem] p-8 flex flex-col border border-slate-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-slate-400 font-medium mb-6">{plan.durationDays ?? 0} Days</p>
                                <div className="mb-8">
                                    <span className="text-5xl font-extrabold" style={{ color: primaryColor }}>{plan.price}</span>
                                    <span className="text-slate-400 text-sm font-bold ml-2">{club.currencyName}</span>
                                </div>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.benefits.map((benefit, i) => (
                                        <li key={i} className="flex gap-3 text-slate-300">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                            </div>
                                            <span className="pt-0.5">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-5 rounded-2xl font-bold text-slate-900 text-lg transition-transform hover:scale-[1.02]" style={{ backgroundColor: primaryColor }}>
                                    Select Plan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 text-center text-slate-500 font-medium">
                <div className="max-w-xl mx-auto mb-8 space-y-4">
                    <p className="text-slate-800 font-extrabold text-2xl mb-6">{club.name}</p>
                    <p className="bg-slate-100 inline-block px-4 py-2 rounded-xl">{"Our Club"}</p>
                    {club.ownerPhone && <p className="bg-slate-100 inline-block px-4 py-2 rounded-xl ml-2">{club.ownerPhone}</p>}
                </div>
                <p>&copy; {new Date().getFullYear()} All Rights Reserved.</p>
            </footer>
        </div>
    );
}
