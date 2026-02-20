import { ArrowRight, Leaf, Users, Zap, TrendingUp, CheckCircle2, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Landing() {
    return (
        <div className="min-h-screen bg-wellness-cream font-sans selection:bg-primary/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                            <Leaf className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-lg leading-tight text-wellness-forest">Magic Nutrition Club</p>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Usha Prasad Enterprise</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#about" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">About</a>
                        <a href="#offers" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">What We Offer</a>
                        <a href="#transformations" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Results</a>
                        <Link to="/dashboard">
                            <Button className="btn-premium bg-primary hover:bg-wellness-forest text-white">
                                Management Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-secondary/30 to-transparent rounded-l-[100px]" />
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div className="animate-in space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-primary/20 text-wellness-forest font-bold text-xs uppercase tracking-wider">
                            <Zap className="w-3 h-3" /> Start Your Journey Today
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-wellness-forest leading-[1.1]">
                            Welcome to <span className="text-primary">Magic</span> Nutrition Club
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                            “Transform Your Health. Transform Your Life.” Join a community dedicated to your wellness journey through herbal nutrition and daily support.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/dashboard">
                                <Button className="btn-premium h-14 px-8 text-lg bg-primary hover:bg-wellness-forest shadow-premium">
                                    🌱 Explore Our System <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button variant="outline" className="btn-premium h-14 px-8 text-lg border-2 border-primary/20 text-primary hover:bg-primary/5">
                                Join Community
                            </Button>
                        </div>
                        <div className="flex items-center gap-6 pt-8">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-secondary flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm">
                                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="font-bold text-wellness-forest leading-none">500+ Members</p>
                                <p className="text-sm text-muted-foreground">Transforming lives daily</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative animate-float">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full scale-75" />
                        <div className="rounded-[40px] overflow-hidden shadow-premium border-8 border-white p-2 bg-white/50 backdrop-blur-sm">
                            <img
                                src="https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=1000"
                                alt="Athletic Performance"
                                className="rounded-[30px] w-full object-cover aspect-[4/5]"
                            />
                        </div>
                        {/* Floating Cards */}
                        <div className="absolute -bottom-10 -left-10 glass-card p-4 flex items-center gap-4 animate-float delay-700">
                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                                <TrendingUp className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold">Daily Progress</p>
                                <p className="font-black text-wellness-forest">+24% Energy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-24 bg-white relative">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1 grid grid-cols-2 gap-4">
                            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=500" className="rounded-2xl shadow-soft hover-lift w-full h-64 object-cover mt-8" alt="Enjoying Shake" />
                            <img src="https://images.unsplash.com/photo-1620703133606-23961d6e7714?q=80&w=500" className="rounded-2xl shadow-soft hover-lift w-full h-64 object-cover" alt="Measuring Results" />
                            <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=500" className="rounded-2xl shadow-soft hover-lift w-full h-64 object-cover" alt="Focus" />
                            <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=500" className="rounded-2xl shadow-soft hover-lift w-full h-64 object-cover mt-8" alt="Community" />
                        </div>
                        <div className="order-1 md:order-2 space-y-8">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Our Story</h2>
                            <h3 className="text-4xl md:text-5xl font-black text-wellness-forest">Why Magic Nutrition?</h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Magic Nutrition Club is a wellness-focused herbal nutrition community run by <span className="font-bold text-primary">Usha Prasad Enterprise</span>. We help individuals achieve their fitness goals through structured nutrition plans, daily check-ins, and community engagement.
                            </p>
                            <div className="grid gap-4">
                                {[
                                    { title: "Healthy Lifestyle", desc: "Long-term habits for sustainable health." },
                                    { title: "Positive Community", desc: "Grow together in an energetic environment." },
                                    { title: "Daily Accountability", desc: "Consistency is our secret ingredient." },
                                    { title: "Herbal Nutrition", desc: "Pure, natural, and effective products." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-secondary/20 transition-colors group">
                                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 className="text-primary w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-wellness-forest">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Offers Section */}
            <section id="offers" className="py-24 bg-wellness-cream">
                <div className="container mx-auto px-6 text-center space-y-16">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Our Services</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-wellness-forest">Everything You Need to Thrive</h3>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { title: "Herbal Nutrition Shakes", icon: "🥤", img: "https://images.unsplash.com/photo-1593095394430-fc1ca9fb99f3?q=80&w=400" },
                            { title: "Fitness & Wellness Games", icon: "🧘", img: "https://images.unsplash.com/photo-1552196564-97c1d8b1698e?q=80&w=400" },
                            { title: "Transformation Tracking", icon: "📈", img: "https://images.unsplash.com/photo-1583454110551-21f2fa2adfcd?q=80&w=400" },
                            { title: "Supportive Community", icon: "👥", img: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=400" }
                        ].map((offer, i) => (
                            <div key={i} className="premium-card p-0 overflow-hidden group hover:scale-[1.02] transition-all">
                                <div className="h-48 relative overflow-hidden">
                                    <img src={offer.img} alt={offer.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white text-3xl">{offer.icon}</div>
                                </div>
                                <div className="p-6 text-left">
                                    <h4 className="font-black text-wellness-forest text-xl mb-2">{offer.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Personalized approach to meet your unique health targets every single day.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Transformation Gallery */}
            <section id="transformations" className="py-24 bg-white overflow-hidden">
                <div className="container mx-auto px-6 text-center space-y-16">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Gallery</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-wellness-forest">Real Results. Real Members.</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            "photo-1534438327276-14e5300c3a38", // Fitness progress
                            "photo-1517836357463-d25dfeac3438", // Gym pose
                            "photo-1620703133606-23961d6e7714", // Measuring waist
                            "photo-1511130558090-003810ec418a", // Happiness/Growth
                            "photo-1594882645126-14020914d58d", // Outdoor run
                            "photo-1552196564-97c1d8b1698e", // Yoga stretch
                            "photo-1483721310020-03333e577076", // Workout focus
                            "photo-1506126613408-eca07ce68773"  // Mindfulness
                        ].map((imgId, i) => (
                            <div key={i} className="aspect-square relative group overflow-hidden rounded-2xl">
                                <img src={`https://images.unsplash.com/${imgId}?q=80&w=400`} alt="Member Transformation" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 shadow-inner" />
                                <div className="absolute inset-0 bg-wellness-forest/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                                    <Heart className="text-white fill-white w-8 h-8 mb-2" />
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Transformation</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="container mx-auto max-w-5xl rounded-[50px] bg-wellness-forest p-12 md:p-24 text-center items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl overflow-hidden" />

                    <div className="relative z-10 space-y-10 animate-in">
                        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                            Experience the Magic of <br />Nutrition & Wellness
                        </h2>
                        <p className="text-white/70 text-lg max-w-xl mx-auto">
                            Ready to take the first step towards a healthier you? Join Usha Prasad Enterprise and start your transformation today.
                        </p>
                        <div className="pt-4">
                            <Link to="/dashboard">
                                <Button className="btn-premium h-16 px-12 text-xl bg-white text-wellness-forest hover:bg-wellness-mint shadow-premium active:scale-95">
                                    Enter Management Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Leaf className="text-white w-5 h-5" />
                        </div>
                        <p className="font-bold text-wellness-forest">Magic Nutrition Club</p>
                    </div>
                    <p className="text-sm text-muted-foreground">© 2026 Usha Prasad Enterprise. All rights reserved.</p>
                    <div className="flex gap-6">
                        {["Terms", "Privacy", "Support"].map(tag => (
                            <a key={tag} href="#" className="text-sm font-bold text-muted-foreground hover:text-primary">{tag}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
