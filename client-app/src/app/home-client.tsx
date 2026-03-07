"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Shield,
  Truck, CreditCard, Award, Star, Zap, Globe,
  MessageCircle, Smartphone, Download, Link as LinkIcon, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";
import { useLanguage } from "@/lib/LanguageContext";
import { getSocialIcon } from "@/lib/socialIcons";
import { api } from "@/lib/api";

import LandingShowcase from "@/components/LandingShowcase";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";

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

export const revalidate = 60;

export default function HomeClient({ latestCars }: HomeClientProps) {
  const { isRTL } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { socket, isConnected } = useSocket();
  const { siteInfo, homeContent, formatPrice, features } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [videoHeight, setVideoHeight] = useState<string>("55vh");
  const [activeDock, setActiveDock] = useState<"reviews" | "app" | null>(null);
  const router = useRouter();

  // تتبع دخول العميل وإبلاغ الأدمن في الوقت الحقيقي
  useEffect(() => {
    if (isLoggedIn && user && socket && isConnected) {
      const userId = (user as { _id?: string; id?: string })._id || (user as { _id?: string; id?: string }).id;
      socket.emit('user_navigation', {
        userId,
        userName: user.name,
        page: isRTL ? 'الصفحة الرئيسية' : 'Home Page',
        timestamp: new Date()
      });
    }
  }, [isLoggedIn, user, socket, isConnected, isRTL]);
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
    viewAll: isRTL ? "عرض الكل" : "View All",
    bidNow: isRTL ? "المزايدة الآن" : "Bid Now",
    liveAuctions: isRTL ? "مزادات مباشرة" : "Live Auctions",
    liveSubtitle: isRTL ? "انضم الآن وشارك في المنافسة" : "Join Now & Compete",
    endingSoon: isRTL ? "ينتهي قريباً" : "Ending Soon",
    currentBid: isRTL ? "المزايدة الحالية" : "Current Bid",
    whyTitle: isRTL ? "لماذا تختارنا؟" : "Why Choose Us?",
    whySubtitle: isRTL ? "نقدم لك تجربة فريدة في عالم السيارات" : "We offer you a unique experience",
    testimonialsTitle: isRTL ? "آراء عملائنا" : "What Our Clients Say",
    downloadTitle: isRTL ? "حمّل تطبيقنا الآن" : "Download Our App",
    downloadSubtitle: isRTL ? "تابع المزادات أينما كنت" : "Follow auctions anywhere",
    appStore: isRTL ? "App Store" : "App Store",
    playStore: isRTL ? "Google Play" : "Google Play",
    quickLinks: isRTL ? "روابط سريعة" : "Quick Links",
    support: isRTL ? "الدعم" : "Support",
    newsletter: isRTL ? "النشرة البريدية" : "Newsletter",
    subscribe: isRTL ? "اشترك" : "Subscribe",
    rights: isRTL ? "جميع الحقوق محفوظة" : "All Rights Reserved",
    privacy: isRTL ? "سياسة الخصوصية" : "Privacy Policy",
    terms: isRTL ? "شروط الاستخدام" : "Terms of Use",
  };



  // خريطة لتنسيق الأيقونات من مسمياتها في قاعدة البيانات
  const lucideIcons: Record<string, any> = {
    Shield, Truck, CreditCard, Award, Zap, Globe, Star, Smartphone, MessageCircle, Heart: Sparkles
  };

  const currentFeatures = features.length > 0 ? features : [
    { icon: 'Shield', title: isRTL ? "ضمان شامل" : "Full Warranty", desc: isRTL ? "ضمان شامل على جميع السيارات" : "Comprehensive warranty on all cars" },
    { icon: 'Truck', title: isRTL ? "شحن عالمي" : "Global Shipping", desc: isRTL ? "توصيل إلى أي مكان في العالم" : "Delivery to anywhere worldwide" },
    { icon: 'CreditCard', title: isRTL ? "دفع آمن" : "Secure Payment", desc: isRTL ? "طرق دفع متعددة وآمنة" : "Multiple secure payment methods" },
    { icon: 'Award', title: isRTL ? "فحص شامل" : "Full Inspection", desc: isRTL ? "فحص 200 نقطة للسيارات" : "200-point vehicle inspection" },
    { icon: 'Zap', title: isRTL ? "مزايدة سريعة" : "Quick Bid", desc: isRTL ? "نظام مزايدة فوري وسريع" : "Instant and fast bidding system" },
    { icon: 'Globe', title: isRTL ? "سيارات كورية" : "Korean Cars", desc: isRTL ? "أفضل السيارات الكورية" : "Best Korean vehicles" }
  ];

  /* Use global formatPrice */

  const testimonials = [
    { name: isRTL ? "أحمد محمد" : "Ahmed Mohammed", role: isRTL ? "تاجر سيارات" : "Car Dealer", text: isRTL ? "تجربة رائعة مع HM CAR، حصلت على أفضل السيارات بأسعار مميزة جداً" : "Amazing experience with HM CAR, got the best cars at great prices", rating: 5 },
    { name: isRTL ? "خالد العمر" : "Khaled Al-Omar", role: isRTL ? "مستثمر" : "Investor", text: isRTL ? "نظام المزادات سهل وسريع، والشحن وصل في الوقت المحدد" : "Auction system is easy and fast, shipping arrived on time", rating: 5 },
    { name: isRTL ? "سعد القحطاني" : "Saad Al-Qahtani", role: isRTL ? "مدير شركة" : "Company Manager", text: isRTL ? "خدمة العملاء ممتازة والفريق محترف جداً في التعامل" : "Excellent customer service and very professional team", rating: 5 }
  ];

  const [socialConfig, setSocialConfig] = useState<{ whatsapp?: string; links: { platform: string; url: string }[] }>({ whatsapp: "", links: [] });

  useEffect(() => {
    // جلب روابط التواصل الاجتماعي من الإعدادات العامة
    const fetchSocialLinks = async () => {
      try {
        const response = await api.settings.getPublic();
        if (response.success && response.data.socialLinks) {
          const sl = response.data.socialLinks;
          const linksArray = Object.entries(sl)
            .filter(([k, v]) => k !== 'whatsapp' && v)
            .map(([k, v]) => ({ platform: k, url: v as string }));

          setSocialConfig({
            whatsapp: sl.whatsapp || "",
            links: linksArray
          });
        }
      } catch (err) {
        console.error("Failed to fetch social links", err);
      }
    };
    fetchSocialLinks();
  }, []);

  // خريطة لرسم الأيقونات بناءً على الصور المخصصة التي وفرها المستخدم
  const homeCustomIcons: { [key: string]: string } = {
    whatsapp: '/images/icons/whatsapp.jpg',
    instagram: '/images/icons/instagram.jpg',
    facebook: '/images/icons/facebook.jpg',
    tiktok: '/images/icons/tiktok.jpg',
  };

  const whatsappUrl = socialConfig.whatsapp ? `https://wa.me/${String(socialConfig.whatsapp).replace(/\D/g, '')}` : "#";

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />



      {/* Cinematic Video Background */}
      <CinematicVideoBackground
        videoSrc={homeContent?.heroVideoUrl || "/videos/hero.mp4"}
        fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
        mobileImage="/images/hmcar.jpg"
        overlayOpacity={0.55}
        height={videoHeight}
      />

      {/* New Cinematic Landing Showcase */}
      <LandingShowcase isRTL={isRTL} latestCars={latestCars} />

      {/* Featured Cars Section */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div>
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 backdrop-blur-md mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-4 h-4 text-[#c9a96e]" />
                <span className="text-sm text-[#c9a96e] tracking-wider">{txt.featuredSubtitle}</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-display" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>
                {txt.featuredTitle}
              </h2>
            </div>

          </motion.div>

          <div className="relative z-10 mb-6">
            <div className="relative z-20 flex justify-end gap-2 mb-4">
              <button
                onClick={() => setActiveDock(prev => (prev === "reviews" ? null : "reviews"))}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${activeDock === "reviews"
                  ? "bg-[#c9a96e] text-black shadow-[0_0_12px_rgba(201,169,110,0.5)]"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  }`}
                aria-label="آراء العملاء"
              >
                <Star className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDock(prev => (prev === "app" ? null : "app"))}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${activeDock === "app"
                  ? "bg-[#c9a96e] text-black shadow-[0_0_12px_rgba(201,169,110,0.5)]"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  }`}
                aria-label="تحميل التطبيق"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            {activeDock === "reviews" && (
              <div>
                <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-display" style={{ textShadow: "0 0 30px rgba(201,169,110,0.3)" }}>{txt.testimonialsTitle}</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {testimonials.map((testimonial, index) => (
                    <motion.div key={index} className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.15 }}>
                      <div className="flex gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-[#c9a96e] fill-[#c9a96e]" />
                        ))}
                      </div>
                      <p className="text-white/80 mb-5 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a96e] to-[#8b7355] flex items-center justify-center text-black font-bold">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white">{testimonial.name}</p>
                          <p className="text-sm text-white/50">{testimonial.role}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {activeDock === "app" && (
              <div>
                <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-display" style={{ textShadow: "0 0 30px rgba(201,169,110,0.3)" }}>{txt.downloadTitle}</h2>
                  <p className="text-white/60">{txt.downloadSubtitle}</p>
                </motion.div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <motion.button className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-[#c9a96e] transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Download className="w-5 h-5" />
                    {txt.appStore}
                  </motion.button>
                  <motion.button className="flex items-center gap-3 px-6 py-3 border border-white/30 text-white rounded-xl font-bold hover:bg-white/10 transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Download className="w-5 h-5" />
                    {txt.playStore}
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 overflow-hidden py-4">
            <motion.div
              className="flex gap-4"
              animate={{ x: isRTL ? ["-100%", "0%"] : ["0%", "-100%"] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              {([...latestCars, ...latestCars]).map((car, index) => (
                <div
                  key={index}
                  className="min-w-[14rem] h-36 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden cursor-pointer"
                  onClick={() => router.push(isLoggedIn ? "/showroom" : "/login")}
                >
                  <div className="relative w-full h-28">
                    <Image
                      src={car.images && car.images.length > 0 ? car.images[0] : "/images/placeholder.jpg"}
                      alt={car.title || "Car"}
                      fill
                      sizes="224px"
                      priority={index < 4}
                      className="object-cover"
                    />
                  </div>
                  <div className="px-3 py-1.5 text-white text-xs line-clamp-1 flex justify-between items-center">
                    <span>{typeof car.make === 'object' ? car.make?.name : (car.make || car.title || "")}</span>
                    <span className="text-[#c9a96e] font-bold">{formatPrice(Number(car.price || 0))}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* الشريط السفلي الثابت - أيقونات التواصل الديناميكية */}
      {/* يظهر فقط إذا كان الأدمن قد أضاف روابط تواصل */}
      {(socialConfig.whatsapp || socialConfig.links.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3 bg-black/70 border-t border-white/10 backdrop-blur-xl px-4 py-2">
              {/* واتساب */}
              {socialConfig.whatsapp && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                  <motion.div whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    {homeCustomIcons.whatsapp
                      ? <img src={homeCustomIcons.whatsapp} alt="WhatsApp" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-green-600 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-white" /></div>}
                  </motion.div>
                </a>
              )}
              {/* باقي روابط التواصل بصور حقيقية */}
              {socialConfig.links.map((item, idx) => (
                <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" title={item.platform}>
                  <motion.div whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shadow-lg">
                    {homeCustomIcons[item.platform]
                      ? <img src={homeCustomIcons[item.platform]} alt={item.platform} className="w-full h-full object-cover" />
                      : (() => { const Icon = getSocialIcon(item.platform); return Icon ? <Icon className="w-5 h-5 text-white" /> : <LinkIcon className="w-5 h-5 text-white/50" />; })()}
                  </motion.div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── قسم التواصل الاجتماعي - يظهر فقط إذا أضاف الأدمن روابط ── */}
      {(socialConfig.whatsapp || socialConfig.links.length > 0) && (
        <section className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Globe className="w-5 h-5 text-[#c9a96e]" />
              <h3 className="text-lg font-bold text-white">{isRTL ? 'روابط التواصل الاجتماعي' : 'Social Media'}</h3>
            </motion.div>

            {/* أيقونات التواصل - تظهر مباشرة بدون زر */}
            <div className="flex flex-wrap items-center gap-4">
              {socialConfig.whatsapp && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                  <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    {homeCustomIcons.whatsapp
                      ? <img src={homeCustomIcons.whatsapp} alt="WhatsApp" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-green-600 flex items-center justify-center"><MessageCircle className="w-6 h-6 text-white" /></div>}
                  </motion.div>
                </a>
              )}
              {socialConfig.links.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" title={link.platform}>
                  <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shadow-lg">
                    {homeCustomIcons[link.platform]
                      ? <img src={homeCustomIcons[link.platform]} alt={link.platform} className="w-full h-full object-cover" />
                      : (() => { const Icon = getSocialIcon(link.platform); return Icon ? <Icon className="w-6 h-6 text-white" /> : <LinkIcon className="w-6 h-6 text-white" />; })()}
                  </motion.div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── AVAILABLE CARS CREATIVE TICKER ── */}
      {/* [[ARABIC_COMMENT]] إخفاء القسم بالكامل إذا لم تكن هناك سيارات مضافة للمعرض */}
      {latestCars && latestCars.length > 0 && (
        <section ref={liveRef} className="relative z-10 py-16 bg-gradient-to-b from-transparent via-[#c9a96e]/5 to-transparent overflow-hidden">
          <div className="max-w-[100vw] mx-auto">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <motion.div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(201,169,110,0.15)]" whileHover={{ scale: 1.05 }}>
                <Sparkles className="w-5 h-5 text-[#c9a96e] animate-pulse" />
                <span className="text-sm font-black text-[#c9a96e] tracking-[0.2em] uppercase">{isRTL ? "تشكيلة المعرض" : "SHOWROOM COLLECTION"}</span>
              </motion.div>
              <h2 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-4" style={{ textShadow: "0 0 40px rgba(201,169,110,0.4)" }}>
                {isRTL ? "سيارات متوفرة الآن" : "AVAILABLE CARS"}
              </h2>
              <p className="text-white/50 text-sm font-medium uppercase tracking-[0.1em]">{isRTL ? "اكتشف أحدث الموديلات المضافة إلى مستودعاتنا" : "DISCOVER THE LATEST MODELS ADDED TO OUR INVENTORY"}</p>
            </motion.div>

            {/* New Ticker Layered Container */}
            <div className="relative w-full overflow-hidden py-10">
              {/* Gradient Mask for fading edges */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none" />

              <motion.div
                className="flex gap-8 cursor-grab active:cursor-grabbing w-max px-8"
                animate={{ x: isRTL ? ["0%", "50%"] : ["-50%", "0%"] }}
                transition={{ duration: latestCars.length * 6, repeat: Infinity, ease: "linear" }}
                whileHover={{ animationPlayState: "paused" }}
              >
                {/* Clone the array to make infinite scrolling seamless */}
                {[...latestCars, ...latestCars, ...latestCars, ...latestCars].map((car, index) => {
                  const makeName = typeof car.make === 'object' ? car.make?.name : car.make;
                  return (
                    <motion.div
                      key={index}
                      className="group relative w-[340px] h-[460px] rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden shadow-2xl hover:border-[#c9a96e]/50 transition-all duration-700 flex-shrink-0"
                      onClick={() => router.push(isLoggedIn ? `/showroom/${car.id || (car as any)._id}` : '/login')}
                      whileHover={{ y: -10 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black z-10 pointer-events-none" />

                      <Image
                        src={car.images && car.images.length > 0 ? car.images[0] : "/images/placeholder.jpg"}
                        alt={car.title || car.name || "Car"}
                        fill
                        sizes="340px"
                        className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                      />

                      {/* Content Details */}
                      <div className="absolute z-20 inset-0 flex flex-col justify-end p-8">
                        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] uppercase font-black tracking-widest text-[#c9a96e] backdrop-blur-md">
                              {car.year || new Date().getFullYear()}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] uppercase font-black tracking-widest text-white/70 backdrop-blur-md">
                              {makeName || "AUTO"}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-white italic uppercase leading-tight mb-2 group-hover:text-[#c9a96e] transition-colors line-clamp-2">
                            {car.title || car.name}
                          </h3>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-xl font-black text-[#c9a96e]">
                              {formatPrice(Number(car.price || 0))}
                            </div>
                            <button className="w-10 h-10 rounded-full bg-[#c9a96e] flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_15px_rgba(201,169,110,0.4)]">
                              <ArrowUpRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            <div className="flex justify-center mt-8 relative z-30 pointer-events-auto">
              <button
                onClick={() => router.push('/showroom')}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#c9a96e]/40 hover:bg-[#c9a96e]/10 transition-all backdrop-blur-xl"
              >
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white group-hover:text-[#c9a96e] transition-colors">
                  {isRTL ? "تصفح جميع السيارات" : "BROWSE ALL CARS"}
                </span>
                <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-[#c9a96e] transition-colors" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Dynamic from Settings */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 backdrop-blur-md mb-4" whileHover={{ scale: 1.05 }}>
              <Award className="w-4 h-4 text-[#c9a96e]" />
              <span className="text-sm text-[#c9a96e] tracking-wider">{txt.whySubtitle}</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-display" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>{txt.whyTitle}</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFeatures.map((feature: { icon: string; title: string; titleEn?: string; desc: string; descEn?: string }, index: number) => {
              const Icon = lucideIcons[feature.icon] || Shield;
              return (
                <motion.div key={index} className="group relative" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                  <div className="relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-[#c9a96e]/30 hover:bg-white/[0.05]">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#c9a96e]/20 rounded-full blur-3xl group-hover:bg-[#c9a96e]/30 transition-all" />
                    <div className="relative z-10">
                      <motion.div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#c9a96e] to-[#8b7355] flex items-center justify-center mb-6" whileHover={{ rotate: 10, scale: 1.1 }}>
                        <Icon className="w-7 h-7 text-black" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">{isRTL ? feature.title : (feature.titleEn || feature.title)}</h3>
                      <p className="text-white/60">{isRTL ? feature.desc : (feature.descEn || feature.desc)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>



      {false && (
        <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-display" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>{txt.testimonialsTitle}</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} className="relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.15 }}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-[#c9a96e] fill-[#c9a96e]" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a96e] to-[#8b7355] flex items-center justify-center text-black font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{testimonial.name}</p>
                      <p className="text-sm text-white/50">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {false && (
        <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div className="relative overflow-hidden rounded-3xl p-8 md:p-16" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#c9a96e]/30 via-[#020202] to-[#8b7355]/20" />
              <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-20" />
              <motion.div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#c9a96e]/30 blur-3xl" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity }} />
              <motion.div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#c9a96e]/20 blur-3xl" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity }} />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 text-center md:text-left">
                  <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/10 backdrop-blur-md mb-6" whileHover={{ scale: 1.05 }}>
                    <Smartphone className="w-4 h-4 text-[#c9a96e]" />
                    <span className="text-sm text-[#c9a96e] tracking-wider">App</span>
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white font-display mb-4" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>{txt.downloadTitle}</h2>
                  <p className="text-white/60 mb-8">{txt.downloadSubtitle}</p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <motion.button className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-[#c9a96e] transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <Download className="w-5 h-5" />
                      {txt.appStore}
                    </motion.button>
                    <motion.button className="flex items-center gap-3 px-6 py-3 border border-white/30 text-white rounded-xl font-bold hover:bg-white/10 transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <Download className="w-5 h-5" />
                      {txt.playStore}
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <motion.div className="relative w-64 h-[500px] rounded-3xl border-4 border-white/20 overflow-hidden bg-gradient-to-b from-[#c9a96e]/20 to-transparent" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Smartphone className="w-24 h-24 text-[#c9a96e]/30" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <footer className="relative z-10 py-10 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-[#c9a96e] font-display mb-2" style={{ textShadow: "0 0 20px rgba(201,169,110,0.3)" }}>{siteInfo?.siteName || 'HM CAR'}</h3>
              <p className="text-white/60 text-sm">{siteInfo?.siteDescription || (isRTL ? "وجهتك الأولى للسيارات الفاخرة وقطع الغيار الأصلية من كوريا الجنوبية" : "Your first destination for luxury cars and genuine parts from South Korea")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/support">
                <motion.div whileHover={{ scale: 1.08 }} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#c9a96e] hover:border-[#c9a96e]/40 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10a7 7 0 0 1 14 0v4a4 4 0 0 1-4 4h-1v2h-2v-2h-1a4 4 0 0 1-4-4z"></path></svg>
                </motion.div>
              </Link>
              {socialConfig.whatsapp && (
                <Link href="/social">
                  <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 transition-all">
                    <img src="/images/icons/whatsapp.jpg" alt="WhatsApp" className="w-full h-full object-cover" />
                  </motion.div>
                </Link>
              )}
              {socialConfig.links.slice(0, 3).map((item, idx) => (
                <Link href="/social" key={idx}>
                  <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center transition-all">
                    {homeCustomIcons[item.platform] ? (
                      <img src={homeCustomIcons[item.platform]} alt={item.platform} className="w-full h-full object-cover" />
                    ) : (
                      (() => {
                        const Icon = getSocialIcon(item.platform);
                        return Icon ? <Icon className="w-5 h-5 text-white" /> : <LinkIcon className="w-5 h-5 text-white" />;
                      })()
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-xs">© 2026 {siteInfo?.siteName || 'HM CAR'}. {txt.rights}.</p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <Link href="#" className="hover:text-[#c9a96e] transition-colors">{txt.privacy}</Link>
              <Link href="#" className="hover:text-[#c9a96e] transition-colors">{txt.terms}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
