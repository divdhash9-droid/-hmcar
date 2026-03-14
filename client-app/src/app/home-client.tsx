"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Shield, Truck, CreditCard, Award, Star, Zap, Globe,
  MessageCircle, Smartphone, Download, Link as LinkIcon, ArrowUpRight,
  ArrowRight, RefreshCw, Car, Play, Check, ChevronLeft, ChevronRight,
  Quote, Phone, Instagram, Facebook, Youtube, Send, Linkedin,
  Mail, Search, Gavel, Cog, Info, User, LogOut, Menu, X, Tag, Languages
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import LandingShowcase from "@/components/LandingShowcase";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";
import { cn } from "@/lib/utils";
import { useStandalone } from "@/lib/useStandalone";

const rawText = (value: string) => value;
const getCarMakeLabel = (car: CarType) => {
  const make = car.make;
  return typeof make === 'object' && make
    ? make.name || car.title || rawText('')
    : make || car.title || rawText('');
};

export type CarType = {
  id?: string;
  name?: string;
  title?: string;
  images?: string[];
  year?: number | string;
  make?: { name?: string } | string;
  price?: number | string;
  model?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
};

interface HomeClientProps {
  latestCars: CarType[];
}

export default function HomeClient({ latestCars }: HomeClientProps) {
  const { isRTL, toggleLanguage } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { socket, isConnected } = useSocket();
  const { siteInfo, homeContent, formatPrice, features } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [videoHeight, setVideoHeight] = useState<string>("55vh");
  const [deferredInstall, setDeferredInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const isStandalone = useStandalone();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInstalled(!!localStorage.getItem('pwa_installed'));
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredInstall(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); localStorage.setItem('pwa_installed', '1'); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SW_UPDATED') setShowUpdateBanner(true);
      });
    }
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    const { outcome } = await deferredInstall.userChoice;
    if (outcome === 'accepted') { setIsInstalled(true); localStorage.setItem('pwa_installed', '1'); }
    setDeferredInstall(null);
  };

  useEffect(() => {
    if (isStandalone && isLoggedIn) {
      router.replace('/client/dashboard');
    }
  }, [isStandalone, isLoggedIn, router]);

  useEffect(() => {
    const updateHeight = () => {
      const top = liveRef.current ? liveRef.current.offsetTop : 0;
      if (top > 0) setVideoHeight(`${top}px`);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const txt = {
    brand: siteInfo?.siteName || (isRTL ? "اتش ام كار" : "HM CAR"),
    featuredTitle: isRTL ? "السيارات المميزة" : "Featured Cars",
    featuredSubtitle: isRTL ? "اختياراتنا المتميزة لك" : "Our Premium Selection",
    testimonialsTitle: isRTL ? "آراء عملائنا" : "What Our Clients Say",
    downloadTitle: isRTL ? "حمّل تطبيقنا الآن" : "Download Our App",
    downloadSubtitle: isRTL ? "تابع المزادات أينما كنت" : "Follow auctions anywhere",
    appStore: isRTL ? "App Store" : "App Store",
    playStore: isRTL ? "Google Play" : "Google Play",
    whyTitle: isRTL ? "لماذا تختارنا؟" : "Why Choose Us?",
    whySubtitle: isRTL ? "نقدم لك تجربة فريدة في عالم السيارات" : "We offer you a unique experience",
    rights: isRTL ? "جميع الحقوق محفوظة" : "All Rights Reserved",
    privacy: isRTL ? "سياسة الخصوصية" : "Privacy Policy",
    terms: isRTL ? "شروط الاستخدام" : "Terms of Use",
  };

  const testimonials = [
    { name: isRTL ? "أحمد محمد" : "Ahmed Mohammed", role: isRTL ? "تاجر سيارات" : "Car Dealer", text: isRTL ? "تجربة رائعة مع HM CAR، حصلت على أفضل السيارات بأسعار مميزة جداً" : "Amazing experience with HM CAR, got the best cars at great prices", rating: 5 },
    { name: isRTL ? "خالد العمر" : "Khaled Al-Omar", role: isRTL ? "مستثمر" : "Investor", text: isRTL ? "نظام المزادات سهل وسريع، والشحن وصل في الوقت المحدد" : "Auction system is easy and fast, shipping arrived on time", rating: 5 },
    { name: isRTL ? "سعد القحطاني" : "Saad Al-Qahtani", role: isRTL ? "مدير شركة" : "Company Manager", text: isRTL ? "خدمة العملاء ممتازة والفريق محترف جداً في التعامل" : "Excellent customer service and very professional team", rating: 5 }
  ];

  const lucideIcons: Record<string, any> = { Shield, Truck, CreditCard, Award, Zap, Globe, Star, Smartphone, MessageCircle, Sparkles, Car };

  const [socialConfig, setSocialConfig] = useState<{ whatsapp?: string; links: { platform: string; url: string }[] }>({
    whatsapp: '+821080880014',
    links: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'snapchat', url: 'https://snapchat.com' },
    ]
  });

  useEffect(() => {
    api.settings.getPublic().then(res => {
      if (res.success && res.data.socialLinks) {
        const sl = res.data.socialLinks;
        const linksArray = Object.entries(sl)
          .filter(([k, v]) => k !== 'whatsapp' && v && String(v).startsWith('http'))
          .map(([k, v]) => ({ platform: k, url: v as string }));
        setSocialConfig({
          whatsapp: sl.whatsapp || '+821080880014',
          links: linksArray.length > 0 ? linksArray : socialConfig.links
        });
      }
    });
    api.brands.list().then(res => setBrands(res?.brands || []));
  }, []);

  const SocialSVGIcons: Record<string, React.FC<{ className?: string }>> = {
    whatsapp: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>),
    instagram: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>),
    tiktok: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>),
    snapchat: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.449-1.243.734-3.033 1.049-.106.15-.135.735-.15 1.064-.015.194-.015.391-.045.57-.045.245-.24.419-.504.419h-.044c-.166 0-.332-.060-.54-.121-.315-.09-.72-.194-1.215-.194-.224 0-.464.016-.72.061-.42.075-.764.23-1.125.406-.689.345-1.484.75-2.878.75h-.196c-1.393 0-2.189-.405-2.878-.75-.36-.176-.705-.331-1.125-.406-.254-.045-.495-.061-.72-.061-.498 0-.9.105-1.215.194-.209.061-.375.121-.54.121h-.044c-.262 0-.458-.174-.504-.419-.03-.179-.03-.376-.045-.57-.016-.329-.045-.914-.15-1.064-1.79-.315-2.793-.6-3.033-1.049-.03-.076-.045-.15-.045-.225-.016-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.21-.645.119-.869-.195-.45-.883-.675-1.333-.81-.135-.044-.254-.09-.344-.119-1.137-.44-1.196-.96-.602-1.29.15-.061.33-.09.509-.09.12 0 .3.016.465.104.374.181.732.285 1.033.301.197 0 .326-.045.401-.09-.015-.175-.015-.345-.03-.51l-.003-.06c-.104-1.627-.23-3.654.299-4.847C7.856 1.069 11.215.793 12.206.793z" /></svg>),
  };

  const platformColors: Record<string, string> = {
    whatsapp: 'text-green-400', instagram: 'text-pink-400', tiktok: 'text-white', snapchat: 'text-yellow-300'
  };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-black" dir={isRTL ? "rtl" : "ltr"}>
      {!isStandalone && <Navbar />}
      
      {/* Translation & Video Hero */}
      <div className="fixed top-6 right-6 z-50">
        <button onClick={toggleLanguage} className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-cinematic-neon-gold transition-all">
          <Languages className="w-6 h-6 text-accent-gold" />
        </button>
      </div>

      <CinematicVideoBackground
        videoSrc={homeContent?.heroVideoUrl || "/videos/hero.mp4"}
        fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
        mobileImage="/images/hmcar.jpg"
        overlayOpacity={0.55}
        height={videoHeight}
      />

      <LandingShowcase isRTL={isRTL} latestCars={latestCars} />

      <div className="space-y-24 pb-20">
        
        {/* [[ARABIC_COMMENT]] قسم السيارات المميزة */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div>
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cinematic-neon-gold/30 bg-cinematic-neon-gold/10 backdrop-blur-md mb-4">
                <Sparkles className="w-4 h-4 text-cinematic-neon-gold" />
                <span className="text-sm text-cinematic-neon-gold tracking-wider font-bold uppercase">{txt.featuredSubtitle}</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black text-white font-display italic uppercase tracking-tighter" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>
                {txt.featuredTitle}
              </h2>
            </div>
            <Link href="/cars">
              <motion.button whileHover={{ scale: 1.05 }} className="px-8 py-3 rounded-full bg-cinematic-neon-gold text-black font-black uppercase tracking-widest text-xs shadow-2xl">
                {isRTL ? "تصفح المعرض" : "VIEW INVETORY"}
              </motion.button>
            </Link>
          </motion.div>

          {latestCars && latestCars.length > 0 ? (
            <div className="relative overflow-hidden py-10">
              <motion.div className="flex gap-8" animate={{ x: isRTL ? ["-50%", "0%"] : ["0%", "-50%"] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
                {[...latestCars, ...latestCars].map((car, index) => (
                  <div key={index} className="w-[300px] shrink-0 group cursor-pointer" onClick={() => router.push(`/cars/${car.id}`)}>
                    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 transition-all duration-700 group-hover:border-cinematic-neon-gold/50 group-hover:shadow-[0_0_50px_rgba(201,169,110,0.2)]">
                      <Image src={car.images?.[0] || "/images/placeholder.jpg"} alt={car.title || "Car"} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" sizes="300px" />
                      <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">{getCarMakeLabel(car)}</p>
                        <h3 className="text-xl font-black text-white uppercase italic truncate mb-4">{car.title}</h3>
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <span className="text-cinematic-neon-gold font-black text-lg">{formatPrice(Number(car.price || 0))}</span>
                          <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-cinematic-neon-gold transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-20 rounded-4xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl">
              <p className="text-white/30 italic font-medium uppercase tracking-widest">{isRTL ? "لا توجد سيارات ممتازة حالياً.. ترقبوا قريباً" : "No exclusive cars at the moment.. stay tuned"}</p>
            </div>
          )}
        </section>

        {/* [[ARABIC_COMMENT]] قسم لماذا نحن؟ */}
        <section ref={liveRef} className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto hide-in-app">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cinematic-neon-gold/30 bg-cinematic-neon-gold/10 backdrop-blur-md mb-4">
              <Award className="w-4 h-4 text-cinematic-neon-gold" />
              <span className="text-sm text-cinematic-neon-gold tracking-wider font-bold uppercase">{txt.whySubtitle}</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-white font-display italic uppercase tracking-tighter">{txt.whyTitle}</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.slice(0, 3).map((feature: any, i: number) => (
              <motion.div key={i} className="p-10 rounded-4xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl hover:border-cinematic-neon-gold/30 transition-all group" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-cinematic-neon-gold to-[#8b7355] flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform">
                  {lucideIcons[feature.icon] ? React.createElement(lucideIcons[feature.icon], { className: "w-8 h-8 text-black" }) : <Shield className="w-8 h-8 text-black" />}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase italic">{feature.title}</h3>
                <p className="text-white/45 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* [[ARABIC_COMMENT]] قسم آراء العملاء */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto hide-in-app">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
             <h2 className="text-4xl md:text-5xl font-black text-white font-display italic uppercase tracking-tighter">{txt.testimonialsTitle}</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testi, i) => (
              <motion.div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-3xl" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="flex gap-1 mb-6">
                  {[...Array(testi.rating)].map((_, idx) => <Star key={idx} className="w-4 h-4 text-cinematic-neon-gold fill-cinematic-neon-gold" />)}
                </div>
                <p className="text-white/70 italic mb-8 leading-relaxed font-medium">"{testi.text}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-cinematic-neon-gold to-[#444] flex items-center justify-center text-black font-black">{testi.name.charAt(0)}</div>
                  <div>
                    <h4 className="text-white font-bold uppercase text-sm tracking-widest">{testi.name}</h4>
                    <p className="text-white/30 text-xs font-bold uppercase">{testi.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* [[ARABIC_COMMENT]] قسم تحميل التطبيق */}
        {!isStandalone && (
          <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto hide-in-app">
            <motion.div className="relative overflow-hidden rounded-5xl border border-cinematic-neon-gold/20 bg-linear-to-br from-cinematic-neon-gold/10 via-black to-transparent p-12 text-center shadow-3xl" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cinematic-neon-gold/10 rounded-full blur-3xl" />
              <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-cinematic-neon-gold to-orange-700 flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10 animate-bounce">
                <Smartphone className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter z-10 relative">{txt.downloadTitle}</h2>
              <p className="text-white/50 text-lg mb-12 font-medium z-10 relative">{txt.downloadSubtitle}</p>
              
              <div className="flex flex-wrap justify-center gap-6 relative z-10">
                {deferredInstall ? (
                  <motion.button onClick={handleInstallPWA} whileHover={{ scale: 1.05 }} className="px-10 py-5 rounded-2xl bg-cinematic-neon-gold text-black font-black uppercase tracking-[0.2em] text-sm shadow-[0_0_50px_rgba(201,169,110,0.4)]">
                    {isRTL ? "تثبيت التطبيق الآن" : "INSTALL APP NOW"}
                  </motion.button>
                ) : (
                  <div className="flex flex-wrap justify-center gap-4">
                     <button className="flex items-center gap-4 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-cinematic-neon-gold transition-colors">
                        <Download className="w-5 h-5" /> {txt.appStore}
                     </button>
                     <button className="flex items-center gap-4 px-8 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-colors">
                        <Download className="w-5 h-5" /> {txt.playStore}
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        )}

        {/* [[ARABIC_COMMENT]] قسم الوكالات */}
        {brands.length > 0 && (
          <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
             <div className="flex flex-wrap justify-center gap-10 opacity-30 invert">
                {brands.map((b, i) => (
                  <div key={i} className="w-24 h-24 relative grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <Image src={b.logoUrl || "/images/placeholder.jpg"} alt={b.name} fill className="object-contain" />
                  </div>
                ))}
             </div>
          </section>
        )}

      </div>

      {/* [[ARABIC_COMMENT]] الفوتر والبار السفلي */}
      <footer className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-black border-t border-white/5 hide-in-app">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div>
              <h3 className="text-3xl font-black text-cinematic-neon-gold italic uppercase tracking-tighter mb-4">{txt.brand}</h3>
              <p className="text-white/40 max-w-md font-medium">{siteInfo?.siteDescription || (isRTL ? "وجهتك الأولى للسيارات الفاخرة الكورية" : "Your first destination for premium Korean cars")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href={socialConfig.whatsapp ? `https://wa.me/${socialConfig.whatsapp.replace(/\D/g, '')}` : "#"} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 hover:bg-green-400/10 transition-all">
                <SocialSVGIcons.whatsapp className="w-6 h-6" />
              </a>
              {socialConfig.links.map((link, i) => {
                const Svg = SocialSVGIcons[link.platform] || MessageCircle;
                const clr = platformColors[link.platform] || "text-white";
                return (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${clr} hover:bg-white/10 transition-all`}>
                    <Svg className="w-6 h-6" />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold uppercase tracking-widest text-white/20">
            <p>© 2026 {txt.brand}. {txt.rights}</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-white transition-colors">{txt.privacy}</Link>
              <Link href="#" className="hover:text-white transition-colors">{txt.terms}</Link>
            </div>
          </div>
        </div>
      </footer>

      {showUpdateBanner && (
        <motion.div initial={{ y: -80 }} animate={{ y: 0 }} className="fixed top-0 left-0 right-0 z-9999 bg-cinematic-neon-gold text-black px-6 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 font-black uppercase text-sm">
            <RefreshCw className="w-5 h-5 animate-spin" /> {isRTL ? "🎉 تحديث جديد متوفر!" : "🎉 NEW UPDATE AVAILABLE!"}
          </div>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-black text-white rounded-lg font-black text-xs uppercase tracking-widest">
            {isRTL ? "تحديث الآن" : "UPDATE NOW"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
