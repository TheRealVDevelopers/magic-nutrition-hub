import { useState } from "react";
import { ArrowRight, Leaf, Zap, TrendingUp, CheckCircle2, Heart, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Landing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (
        <div className="min-h-screen bg-wellness-cream font-sans selection:bg-primary/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border safe-area-top">
                <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow flex-shrink-0">
                            <Leaf className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-sm sm:text-lg leading-tight text-wellness-forest truncate">Magic Nutrition Club</p>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold truncate">Usha Prasad Enterprise</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        <a href="#about" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">About</a>
                        <a href="#offers" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">What We Offer</a>
                        <a href="#transformations" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Results</a>
                        <Link to="/dashboard">
                            <Button className="btn-premium bg-primary hover:bg-wellness-forest text-white">
                                Management Dashboard
                            </Button>
                        </Link>
                    </div>
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-2 border-primary/20 text-primary touch-manipulation">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] sm:max-w-[320px] p-0 gap-0 border-r border-border">
                            <div className="p-6 border-b border-border flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                                    <Leaf className="text-white w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-wellness-forest">Magic Nutrition Club</p>
                                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Usha Prasad Enterprise</p>
                                </div>
                            </div>
                            <div className="flex flex-col p-4 gap-1">
                                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary/30 hover:text-primary min-h-[48px] touch-manipulation">About</a>
                                <a href="#offers" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary/30 hover:text-primary min-h-[48px] touch-manipulation">What We Offer</a>
                                <a href="#transformations" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-secondary/30 hover:text-primary min-h-[48px] touch-manipulation">Results</a>
                                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mt-4">
                                    <Button className="w-full btn-premium h-12 bg-primary hover:bg-wellness-forest text-white">
                                        Management Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-secondary/30 to-transparent rounded-l-[100px]" />
                <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="animate-in space-y-5 sm:space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-secondary/50 border border-primary/20 text-wellness-forest font-bold text-xs uppercase tracking-wider">
                            <Zap className="w-3 h-3" /> Start Your Journey Today
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-wellness-forest leading-[1.15]">
                            Welcome to <span className="text-primary">Magic</span> Nutrition Club
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                            “Transform Your Health. Transform Your Life.” Join a community dedicated to your wellness journey through herbal nutrition and daily support.
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
                            <Link to="/dashboard" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto btn-premium h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-primary hover:bg-wellness-forest shadow-premium min-h-[48px] touch-manipulation">
                                    🌱 Explore Our System <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full sm:w-auto btn-premium h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg border-2 border-primary/20 text-primary hover:bg-primary/5 min-h-[48px] touch-manipulation">
                                Join Community
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6 pt-6 sm:pt-8">
                            <div className="flex -space-x-3 sm:-space-x-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-white bg-secondary flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm">
                                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Member" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="font-bold text-wellness-forest leading-none text-sm sm:text-base">500+ Members</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Transforming lives daily</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative animate-float order-first md:order-none">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full scale-75" />
                        <div className="rounded-2xl sm:rounded-[30px] md:rounded-[40px] overflow-hidden shadow-premium border-4 sm:border-8 border-white p-1.5 sm:p-2 bg-white/50 backdrop-blur-sm">
                            <img
                                src="https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=1000&v=1"
                                alt="Healthy people enjoying nutrition shakes and wellness"
                                className="rounded-xl sm:rounded-[24px] md:rounded-[30px] w-full object-cover aspect-[4/5]"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-4 sm:-bottom-10 sm:-left-10 glass-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 animate-float delay-700 hidden sm:flex">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent flex items-center justify-center">
                                <TrendingUp className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold">Daily Progress</p>
                                <p className="font-black text-wellness-forest text-sm sm:text-base">+24% Energy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-16 sm:py-20 md:py-24 bg-white relative">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                        <div className="order-2 md:order-1 grid grid-cols-2 gap-2 sm:gap-4">
                            <img src="https://images.pexels.com/photos/775031/pexels-photo-775031.jpeg?auto=compress&cs=tinysrgb&w=500&v=1" className="rounded-xl sm:rounded-2xl shadow-soft hover-lift w-full h-40 sm:h-56 md:h-64 object-cover mt-6 sm:mt-8" alt="Herbal nutrition shakes" />
                            <img src="https://images.pexels.com/photos/434295/pexels-photo-434295.jpeg?auto=compress&cs=tinysrgb&w=500&v=1" className="rounded-xl sm:rounded-2xl shadow-soft hover-lift w-full h-40 sm:h-56 md:h-64 object-cover" alt="Fresh fruits and healthy eating" />
                            <img src="https://images.pexels.com/photos/5644870/pexels-photo-5644870.jpeg?auto=compress&cs=tinysrgb&w=500&v=1" className="rounded-xl sm:rounded-2xl shadow-soft hover-lift w-full h-40 sm:h-56 md:h-64 object-cover" alt="Fresh salads and sprouts" />
                            <img src="https://images.pexels.com/photos/864939/pexels-photo-864939.jpeg?auto=compress&cs=tinysrgb&w=500&v=1" className="rounded-xl sm:rounded-2xl shadow-soft hover-lift w-full h-40 sm:h-56 md:h-64 object-cover mt-6 sm:mt-8" alt="Community group sessions" />
                        </div>
                        <div className="order-1 md:order-2 space-y-5 md:space-y-8">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Our Story</h2>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-wellness-forest">Why Magic Nutrition?</h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Magic Nutrition Club is a wellness-focused herbal nutrition community run by <span className="font-bold text-primary">Usha Prasad Enterprise</span>. We help individuals achieve their fitness goals through structured nutrition plans, daily check-ins, and community engagement.
                            </p>
                            <div className="grid gap-4">
                                {[
                                    { title: "Healthy Lifestyle", desc: "Long-term habits for sustainable health." },
                                    { title: "Positive Community", desc: "Grow together in an energetic environment." },
                                    { title: "Daily Accountability", desc: "Consistency is our secret ingredient." },
                                    { title: "Herbal Nutrition", desc: "Pure, natural, and effective products." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl hover:bg-secondary/20 transition-colors group">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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
            <section id="offers" className="py-16 sm:py-20 md:py-24 bg-wellness-cream">
                <div className="container mx-auto px-4 sm:px-6 text-center space-y-10 md:space-y-16">
                    <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Our Services</h2>
                        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-wellness-forest">Everything You Need to Thrive</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 md:gap-8">
                        {[
                            { title: "Herbal Nutrition Shakes", icon: "🥤", img: "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Herbal nutrition shakes and smoothies" },
                            { title: "Fitness & Wellness Games", icon: "🧘", img: "https://images.pexels.com/photos/6339345/pexels-photo-6339345.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Fitness and wellness activities" },
                            { title: "Transformation Tracking", icon: "📈", img: "https://images.pexels.com/photos/1552245/pexels-photo-1552245.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Transformation and progress tracking" },
                            { title: "Supportive Community", icon: "👥", img: "https://images.pexels.com/photos/864939/pexels-photo-864939.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Supportive wellness community" }
                        ].map((offer, i) => (
                            <div key={i} className="premium-card p-0 overflow-hidden group hover:scale-[1.02] transition-all">
                                <div className="h-40 sm:h-48 relative overflow-hidden">
                                    <img src={offer.img} alt={offer.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white text-3xl">{offer.icon}</div>
                                </div>
                                <div className="p-4 sm:p-6 text-left">
                                    <h4 className="font-black text-wellness-forest text-lg sm:text-xl mb-1 sm:mb-2">{offer.title}</h4>
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
            <section id="transformations" className="py-16 sm:py-20 md:py-24 bg-white overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 text-center space-y-10 md:space-y-16">
                    <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Gallery</h2>
                        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-wellness-forest">Real Results. Real Members.</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                        {[
                            { img: "https://images.pexels.com/photos/6339345/pexels-photo-6339345.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Fitness transformation progress" },
                            { img: "https://images.pexels.com/photos/6339488/pexels-photo-6339488.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Body measurement and tracking" },
                            { img: "https://images.pexels.com/photos/864990/pexels-photo-864990.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Gym workout results" },
                            { img: "https://images.pexels.com/photos/917660/pexels-photo-917660.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Health and nutrition success" },
                            { img: "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Wellness transformation" },
                            { img: "https://images.pexels.com/photos/1552245/pexels-photo-1552245.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Yoga and flexibility progress" },
                            { img: "https://images.pexels.com/photos/6150627/pexels-photo-6150627.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Training and dedication" },
                            { img: "https://images.pexels.com/photos/1472887/pexels-photo-1472887.jpeg?auto=compress&cs=tinysrgb&w=400&v=1", alt: "Real member results" }
                        ].map((item, i) => (
                            <div key={i} className="aspect-square relative group overflow-hidden rounded-2xl">
                                <img src={item.img} alt={item.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 shadow-inner" />
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
            <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6">
                <div className="container mx-auto max-w-5xl rounded-3xl sm:rounded-[40px] md:rounded-[50px] bg-wellness-forest p-8 sm:p-12 md:p-16 lg:p-24 text-center items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl overflow-hidden" />

                    <div className="relative z-10 space-y-6 sm:space-y-10 animate-in">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                            Experience the Magic of <br className="hidden sm:block" /> Nutrition & Wellness
                        </h2>
                        <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto">
                            Ready to take the first step towards a healthier you? Join Usha Prasad Enterprise and start your transformation today.
                        </p>
                        <div className="pt-2 sm:pt-4">
                            <Link to="/dashboard">
                                <Button className="btn-premium h-14 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl bg-white text-wellness-forest hover:bg-wellness-mint shadow-premium active:scale-95 w-full sm:w-auto min-h-[48px] touch-manipulation">
                                    Enter Management Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 sm:py-12 border-t border-border">
                <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 text-center md:text-left">
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
