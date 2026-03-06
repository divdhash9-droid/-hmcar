"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Shield,
  Truck, CreditCard, Award, Star, Zap, Globe,
  MessageCircle, Smartphone, Download, Link as LinkIcon
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



  const liveAuctions = [
    { id: "a1", car: isRTL ? "مرسيدس اس كلاس 2024" : "Mercedes S-Class 2024", currentBid: 450000, bids: 24, endsIn: "00:45:12", image: "/images/photo_2026-02-07_22-24-18.jpg" },
    { id: "a2", car: isRTL ? "بي ام دبليو اكس 7 2024" : "BMW X7 2024", currentBid: 380000, bids: 18, endsIn: "01:20:30", image: "/images/photo_2026-02-07_22-24-39.jpg" },
    { id: "a3", car: isRTL ? "لكزس ال اكس 600" : "Lexus LX 600", currentBid: 520000, bids: 32, endsIn: "02:15:45", image: "/images/photo_2026-02-07_22-24-44.jpg" }
  ];

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
                    <span>{isRTL && car.make && typeof car.make !== 'string' && car.make.name ? car.make.name : (car.title || "")}</span>
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

      {/* Live Auctions Section */}
      <section ref={liveRef} className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#c9a96e]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-md mb-4" whileHover={{ scale: 1.05 }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400 tracking-wider">{isRTL ? "مباشر الآن" : "Live Now"}</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-display mb-4" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>{txt.liveAuctions}</h2>
            <p className="text-white/60">{txt.liveSubtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveAuctions.map((auction, index) => (
              <motion.div key={auction.id} className="group relative cursor-pointer" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.15 }} onClick={() => router.push(isLoggedIn ? '/auctions' : '/login')}>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-500 hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/10">
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-bold">{isRTL ? "مباشر" : "LIVE"}</span>
                  </div>
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                    <Image src={auction.image} alt={auction.car} fill priority={index < 2} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-4">{auction.car}</h3>
                    <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-xl backdrop-blur-md">
                      <div>
                        <p className="text-xs text-white/50 mb-1">{txt.currentBid}</p>
                        <p className="text-2xl font-bold text-[#c9a96e]">{formatPrice(auction.currentBid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/50 mb-1">{txt.endingSoon}</p>
                        <p className="text-xl font-bold text-red-400 font-mono">{auction.endsIn}</p>
                      </div>
                    </div>
                    <motion.button
                      className="w-full py-3 backdrop-filter backdrop-blur-md bg-black/40 border border-[#c9a96e]/50 text-[#c9a96e] font-bold rounded-xl shadow-[0_0_15px_rgba(201,169,110,0.15)] hover:shadow-[0_0_30px_rgba(201,169,110,0.6)] hover:bg-[#c9a96e] hover:text-black transition-all relative overflow-hidden group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push("/login")}
                    >
                      <span className="relative z-10">{txt.bidNow} ({auction.bids} {isRTL ? "مزايدة" : "bids"})</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

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
