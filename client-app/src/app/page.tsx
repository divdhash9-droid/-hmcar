'use client';

import { motion } from "framer-motion";
import { Search, Car, Shield, Clock, ArrowRight, Gauge, Zap, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();

  const features = [
    {
      icon: Shield,
      title: isRTL ? "أمن وموثوقية" : "Security & Trust",
      desc: isRTL ? "تعاملات آمنة ومضمونة بشكل كامل" : "Fully secured and guaranteed transactions"
    },
    {
      icon: Clock,
      title: isRTL ? "مزادات حية" : "Live Auctions",
      desc: isRTL ? "شارك في المزادات المباشرة بسهولة" : "Participate in live auctions effortlessly"
    },
    {
      icon: Car,
      title: isRTL ? "تصدير عالمي" : "Global Export",
      desc: isRTL ? "نوفر لك السيارات من جميع أنحاء العالم" : "We provide cars from all around the world"
    }
  ];

  const collections = [
    {
      title: isRTL ? "المعرض" : "INVENTORY",
      desc: isRTL ? "تصفح مخزوننا الحصري" : "Browse our exclusive selection",
      href: "/showroom",
      icon: Car,
      image: "https://images.unsplash.com/photo-1603584173870-7f394da8846c?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: isRTL ? "المزادات" : "AUCTIONS",
      desc: isRTL ? "شارك في المزايدات الحية" : "Join live bidding battles",
      href: "/auctions",
      icon: Zap,
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: isRTL ? "قطع الغيار" : "PARTS",
      desc: isRTL ? "قطع أصلية معتمدة" : "Certified genuine components",
      href: "/parts",
      icon: Gauge,
      image: "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />

      {/* Cinematic Background Atmosphere */}
      <div className="bg-grid-overlay opacity-20" />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Floating Light Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-luxury-gold/5 blur-[220px] rounded-full animate-float-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cinematic-neon-blue/5 blur-[200px] rounded-full" />

        {/* Noise Grain */}
        <div className="absolute inset-0 opacity-[0.03] animate-grain"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* ===== FULL-SCREEN VIDEO BACKGROUND ===== */}
        <div className="absolute inset-0 z-0">
          {/* Video Element - Full Screen & Clear */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.7) saturate(1.1)' }}
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>

          {/* Subtle Gradient Overlay - Bottom only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

          {/* Corner Frames - Gold Accent */}
          <div className="absolute top-6 left-6 w-24 h-24 border-l-2 border-t-2 border-[#c5a059]/40" />
          <div className="absolute top-6 right-6 w-24 h-24 border-r-2 border-t-2 border-[#c5a059]/40" />
          <div className="absolute bottom-6 left-6 w-24 h-24 border-l-2 border-b-2 border-[#c5a059]/40" />
          <div className="absolute bottom-6 right-6 w-24 h-24 border-r-2 border-b-2 border-[#c5a059]/40" />

          {/* Scan Line Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[#c5a059]/40 to-transparent"
              style={{ animation: 'scanLine 5s linear infinite' }}
            />
          </div>
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 z-[1] opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(197,160,89,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(197,160,89,0.3) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-12 pt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full"
          >
            <div className="w-2 h-2 bg-luxury-gold rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-luxury-gold">
              {isRTL ? "نظام آمن • وصول عالمي للنخبة" : "SYSTEM ONLINE • ELITE ACCESS"}
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none"
            style={{
              background: 'linear-gradient(to bottom, #ffffff 0%, #888888 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            HM CAR
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            {t('heroSubtitle')}
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const query = formData.get('q');
              const brand = formData.get('brand');
              const price = formData.get('price');
              const params = new URLSearchParams();
              if (query) params.append('q', query.toString());
              if (brand) params.append('brand', brand.toString());
              if (price) params.append('price', price.toString());
              router.push(`/search?${params.toString()}`);
            }} className="flex flex-col md:flex-row gap-4 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl">
              <div className="flex-1 relative">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/40", isRTL ? "right-4" : "left-4")} />
                <input
                  type="text"
                  name="q"
                  placeholder={t('searchPlaceholder')}
                  className={cn(
                    "w-full bg-transparent border-0 py-4 text-white placeholder:text-white/40 focus:outline-none",
                    isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
                  )}
                />
              </div>

              <select
                name="brand"
                className={cn(
                  "bg-transparent border-0 py-4 px-6 text-white/60 focus:outline-none cursor-pointer appearance-none",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                <option value="" className="bg-black">{t('allBrands')}</option>
                <option value="toyota" className="bg-black">Toyota</option>
                <option value="mercedes" className="bg-black">Mercedes</option>
                <option value="bmw" className="bg-black">BMW</option>
                <option value="lexus" className="bg-black">Lexus</option>
              </select>

              <select
                name="price"
                className={cn(
                  "bg-transparent border-0 py-4 px-6 text-white/60 focus:outline-none cursor-pointer appearance-none",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                <option value="" className="bg-black">{t('priceRange')}</option>
                <option value="0-100000" className="bg-black">0 - 100K</option>
                <option value="100000-500000" className="bg-black">100K - 500K</option>
                <option value="500000+" className="bg-black">500K+</option>
              </select>

              <button
                type="submit"
                className="px-10 py-4 bg-white text-black font-black text-sm uppercase tracking-wider rounded-2xl hover:bg-luxury-gold transition-all"
              >
                {t('searchBtn')}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Features - Cinematic 3D Cards */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: 10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group relative p-10 rounded-[2rem] text-center overflow-hidden cursor-pointer"
              style={{
                background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(15,15,15,0.95) 100%)',
                border: '1px solid rgba(197, 160, 89, 0.15)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                transform: 'perspective(1000px)',
                transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
              }}
              whileHover={{
                y: -15,
                rotateX: 5,
                boxShadow: '0 40px 80px -20px rgba(197, 160, 89, 0.3), 0 0 40px rgba(197, 160, 89, 0.1)'
              }}
            >
              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(197, 160, 89, 0.15) 0%, transparent 60%)'
                }}
              />

              {/* Icon Container - 3D */}
              <div className="relative w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.2) 0%, rgba(197, 160, 89, 0.05) 100%)',
                  border: '1px solid rgba(197, 160, 89, 0.3)',
                  boxShadow: '0 10px 30px rgba(197, 160, 89, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <feature.icon className="w-10 h-10 text-[#c5a059]" style={{ filter: 'drop-shadow(0 0 10px rgba(197, 160, 89, 0.5))' }} />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-black mb-4 text-white group-hover:text-[#c5a059] transition-colors">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>

              {/* Bottom Accent Line */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#c5a059] to-transparent transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Collections - Cinematic 3D Cards */}
      <section className="relative z-10 py-32 px-6 overflow-hidden">
        {/* Section Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c5a059]/5 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto space-y-20 relative">
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <div className="text-sm font-black uppercase tracking-[0.5em] text-[#c5a059] mb-4">
                {isRTL ? "استكشف الفئات" : "EXPLORE CATEGORIES"}
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                {isRTL ? "المجموعات " : "THE DIGITAL "}
                <span className="text-[#c5a059]">{isRTL ? "الرقمية" : "COLLECTION"}</span>
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { ...collections[0], title: t('showroom') },
              { ...collections[1], title: t('auctions') },
              { ...collections[2], title: t('spareParts') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, rotateY: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className="group"
                style={{ perspective: '1500px' }}
              >
                <Link
                  href={item.href}
                  className="relative block aspect-[3/4] overflow-hidden rounded-[2rem]"
                  style={{
                    background: 'linear-gradient(145deg, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%)',
                    border: '1px solid rgba(197, 160, 89, 0.15)',
                    boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)',
                    transform: 'translateZ(0)',
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  {/* Image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c5a059]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Top Corner Accent */}
                  <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-[#c5a059]/30 group-hover:border-[#c5a059] transition-colors duration-500" />

                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="space-y-5 transform group-hover:-translate-y-3 transition-transform duration-500">
                      {/* Icon - 3D Glassmorphism */}
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          boxShadow: '0 15px 35px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                        }}
                      >
                        <item.icon className="w-10 h-10 text-white group-hover:text-[#c5a059] transition-colors duration-500" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }} />
                      </div>

                      {/* Text */}
                      <div>
                        <h3 className="text-3xl font-black tracking-tight mb-2 group-hover:text-[#c5a059] transition-colors duration-500">{item.title}</h3>
                        <p className="text-white/50 text-sm">{item.desc}</p>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <span className="text-xs font-black uppercase tracking-wider text-[#c5a059]">
                          {isRTL ? "استكشف" : "EXPLORE"}
                        </span>
                        <ArrowRight className={cn("w-5 h-5 text-[#c5a059]", isRTL && "rotate-180")} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Glow Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c5a059] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="text-3xl font-black tracking-tight">
            HM <span className="text-luxury-gold">CAR</span>
          </div>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            {isRTL
              ? "وجهتك الأولى لامتلاك السيارات الفاخرة وقطع الغيار النادرة في المملكة العربية السعودية"
              : "Your ultimate destination for luxury cars and rare spare parts in Saudi Arabia"
            }
          </p>
          <div className="flex justify-center gap-8 text-xs text-white/20 font-black uppercase tracking-wider">
            <span>© 2026 HM CAR</span>
            <span>•</span>
            <span>{isRTL ? "جميع الحقوق محفوظة" : "ALL RIGHTS RESERVED"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
