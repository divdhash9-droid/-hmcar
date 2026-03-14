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
// [[ARABIC_COMMENT]] أيقونات التواصل الاجتماعي مبنية كـ SVG مضمنة في المكوّن مباشرة
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

export const revalidate = 60;

export default function HomeClient({ latestCars }: HomeClientProps) {
  const { isRTL, toggleLanguage } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { socket, isConnected } = useSocket();
  const { siteInfo, homeContent, formatPrice, features } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [videoHeight, setVideoHeight] = useState<string>("55vh");
  const [activeDock, setActiveDock] = useState<"reviews" | "app" | null>(null);
  const [deferredInstall, setDeferredInstall] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== 'undefined') return !!localStorage.getItem('pwa_installed');
    return false;
  });
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [brands, setBrands] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  // التقاط حدث التثبيت PWA
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredInstall(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); localStorage.setItem('pwa_installed', '1'); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // استماع لتحديثات Service Worker الجديدة
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
  const router = useRouter();
  const isStandalone = useStandalone();

  useEffect(() => {
    // [[ARABIC_COMMENT]] توجيه ذكي: عند فتح التطبيق المثبت (PWA) من قبل مستخدم مسجل الدخول، نوجهه مباشرة إلى لوحة تحكمه
    if (isStandalone && isLoggedIn) {
      router.replace('/client/dashboard');
    }
  }, [isStandalone, isLoggedIn, router]);

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



  const lucideIcons: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
    Shield, Truck, CreditCard, Award, Zap, Globe, Star, Smartphone, MessageCircle, Heart: Sparkles,
    ArrowUpRight, ArrowRight, Play, Check, ChevronLeft, ChevronRight, Quote, Phone, Instagram,
    Facebook, Youtube, Send, Linkedin, Mail, Search, Gavel, Cog, Info, User, LogOut,
    Menu, X, Car, Sparkles
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

  // [[ARABIC_COMMENT]] روابط التواصل الافتراضية - تظهر دائماً حتى لو لم يُعيّن الأدمن روابط
  const DEFAULT_WHATSAPP = '+821080880014'; // رقم الواتساب الكوري الرئيسي
  const DEFAULT_SOCIAL_LINKS = [
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'tiktok', url: 'https://tiktok.com' },
    { platform: 'snapchat', url: 'https://snapchat.com' },
  ];

  const [socialConfig, setSocialConfig] = useState<{ whatsapp?: string; links: { platform: string; url: string }[] }>({
    whatsapp: DEFAULT_WHATSAPP,
    links: DEFAULT_SOCIAL_LINKS
  });

  useEffect(() => {
    // [[ARABIC_COMMENT]] جلب روابط التواصل الاجتماعي من الإعدادات العامة
    const fetchSocialLinks = async () => {
      try {
        const response = await api.settings.getPublic();
        if (response.success && response.data.socialLinks) {
          const sl = response.data.socialLinks;
          const linksArray = Object.entries(sl)
            .filter(([k, v]) => k !== 'whatsapp' && v && String(v).startsWith('http'))
            .map(([k, v]) => ({ platform: k, url: v as string }));

          setSocialConfig({
            // [[ARABIC_COMMENT]] استخدم رقم الأدمن أو الافتراضي
            whatsapp: sl.whatsapp || DEFAULT_WHATSAPP,
            // [[ARABIC_COMMENT]] استخدم روابط الأدمن أو الافتراضية إذا لم يضف شيئاً
            links: linksArray.length > 0 ? linksArray : DEFAULT_SOCIAL_LINKS
          });
        }
      } catch (err) {
        console.error("Failed to fetch social links", err);
        // [[ARABIC_COMMENT]] احتفظ بالافتراضيات عند الخطأ
      }
    };
    fetchSocialLinks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // [[ARABIC_COMMENT]] جلب الوكالات المتاحة
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.brands.list();
        setBrands(res?.brands || []);
      } catch (err) {
        console.error("Failed to fetch brands", err);
      }
    };
    fetchBrands();
  }, []);


  // [[ARABIC_COMMENT]] أيقونات التواصل الاجتماعي - SVG مضمنة لضمان الظهور الصحيح دائماً
  const SocialSVGIcons: Record<string, React.FC<{ className?: string }>> = {
    whatsapp: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    instagram: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    facebook: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    youtube: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    tiktok: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    snapchat: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.449-1.243.734-3.033 1.049-.106.15-.135.735-.15 1.064-.015.194-.015.391-.045.57-.045.245-.24.419-.504.419h-.044c-.166 0-.332-.060-.54-.121-.315-.09-.72-.194-1.215-.194-.224 0-.464.016-.72.061-.42.075-.764.23-1.125.406-.689.345-1.484.75-2.878.75h-.196c-1.393 0-2.189-.405-2.878-.75-.36-.176-.705-.331-1.125-.406-.254-.045-.495-.061-.72-.061-.498 0-.9.105-1.215.194-.209.061-.375.121-.54.121h-.044c-.262 0-.458-.174-.504-.419-.03-.179-.03-.376-.045-.57-.016-.329-.045-.914-.15-1.064-1.79-.315-2.793-.6-3.033-1.049-.03-.076-.045-.15-.045-.225-.016-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.21-.645.119-.869-.195-.45-.883-.675-1.333-.81-.135-.044-.254-.09-.344-.119-1.137-.44-1.196-.96-.602-1.29.15-.061.33-.09.509-.09.12 0 .3.016.465.104.374.181.732.285 1.033.301.197 0 .326-.045.401-.09-.015-.175-.015-.345-.03-.51l-.003-.06c-.104-1.627-.23-3.654.299-4.847C7.856 1.069 11.215.793 12.206.793z" />
      </svg>
    ),
    telegram: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    twitter: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  };
  const platformColors: Record<string, string> = {
    whatsapp: 'text-green-400',
    instagram: 'text-pink-400',
    facebook: 'text-blue-500',
    youtube: 'text-red-500',
    tiktok: 'text-white',
    snapchat: 'text-yellow-300',
    telegram: 'text-sky-400',
    twitter: 'text-white',
    linkedin: 'text-blue-400',
  };

  const whatsappUrl = socialConfig.whatsapp ? `https://wa.me/${String(socialConfig.whatsapp).replace(/\D/g, '')}` : "#";

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Navbar visible for regular users, hidden for PWA */}
      {!isStandalone && <Navbar />}

      {/* Dedicated Translation Button for Home Page */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-accent-gold hover:border-accent-gold/40 transition-all shadow-2xl"
          title={isRTL ? "تغيير اللغة" : "Change Language"}
        >
          <Languages className="w-6 h-6 text-accent-gold" />
        </button>
      </div>



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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cinematic-neon-gold/30 bg-cinematic-neon-gold/10 backdrop-blur-md mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-4 h-4 text-cinematic-neon-gold" />
                <span className="text-sm text-cinematic-neon-gold tracking-wider">{txt.featuredSubtitle}</span>
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
                  ? "bg-cinematic-neon-gold text-black shadow-[0_0_12px_rgba(201,169,110,0.5)]"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  }`}
                aria-label="آراء العملاء"
              >
                <Star className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDock(prev => (prev === "app" ? null : "app"))}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${activeDock === "app"
                  ? "bg-cinematic-neon-gold text-black shadow-[0_0_12px_rgba(201,169,110,0.5)]"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  }`}
                aria-label="تحميل التطبيق"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            {activeDock === rawText('reviews') && (
              <div>
                <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-display" style={{ textShadow: "0 0 30px rgba(201,169,110,0.3)" }}>{txt.testimonialsTitle}</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {testimonials.map((testimonial, index) => (
                    <motion.div key={index} className="relative p-6 rounded-2xl border border-white/10 bg-white/2 backdrop-blur-xl" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.15 }}>
                      <div className="flex gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-cinematic-neon-gold fill-cinematic-neon-gold" />
                        ))}
                      </div>
                      <p className="text-white/80 mb-5 leading-relaxed">{rawText('“')}{testimonial.text}{rawText('”')}</p>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-cinematic-neon-gold to-[#8b7355] flex items-center justify-center text-black font-bold">
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
            {activeDock === rawText('app') && (
              <div>
                <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                  <h2 className="text-3xl md:text-4xl font-bold text-white font-display" style={{ textShadow: "0 0 30px rgba(201,169,110,0.3)" }}>{txt.downloadTitle}</h2>
                  <p className="text-white/60">{txt.downloadSubtitle}</p>
                </motion.div>
                <div className="flex justify-center">
                  {isInstalled ? (
                    <div className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 font-black uppercase tracking-widest text-sm">
                      {rawText('✓')} {isRTL ? rawText('التطبيق مُثبَّت بالفعل') : rawText('APP ALREADY INSTALLED')}
                    </div>
                  ) : deferredInstall ? (
                    <motion.button
                      onClick={handleInstallPWA}
                      className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-linear-to-r from-cinematic-neon-gold to-[#e8c97a] text-black font-black uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(201,169,110,0.4)] hover:shadow-[0_0_60px_rgba(201,169,110,0.6)] transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Smartphone className="w-5 h-5" />
                      {isRTL ? rawText('تثبيت التطبيق') : rawText('INSTALL APP')}
                    </motion.button>
                  ) : (
                    <div className="text-center">
                      <p className="text-white/40 text-sm mb-4">{isRTL ? rawText('لتثبيت التطبيق: اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"') : rawText('To install: tap Share then "Add to Home Screen"')}</p>
                      <div className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-black uppercase tracking-widest text-sm">
                        <Smartphone className="w-5 h-5" />
                        {isRTL ? rawText('متوفر للتثبيت') : rawText('AVAILABLE TO INSTALL')}
                      </div>
                    </div>
                  )}
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
                  className="min-w-56 h-36 rounded-2xl border border-white/10 bg-white/3 overflow-hidden cursor-pointer"
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
                    <span>{getCarMakeLabel(car)}</span>
                    <span className="text-cinematic-neon-gold font-bold">{formatPrice(Number(car.price || 0))}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* [[ARABIC_COMMENT]] الشريط السفلي الثابت - أيقونات التواصل الديناميكية */}
      {!isStandalone && (socialConfig.whatsapp || socialConfig.links.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3 bg-black/70 border-t border-white/10 backdrop-blur-xl px-4 py-2">
              {/* [[ARABIC_COMMENT]] واتساب */}
              {socialConfig.whatsapp && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                  <motion.div whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400 shadow-lg hover:bg-green-500/20 transition-all">
                    <SocialSVGIcons.whatsapp className="w-5 h-5" />
                  </motion.div>
                </a>
              )}
              {/* [[ARABIC_COMMENT]] باقي روابط التواصل بأيقونات SVG */}
              {socialConfig.links.map((item, idx) => {
                const SvgIcon = SocialSVGIcons[item.platform];
                const colorClass = platformColors[item.platform] || rawText('text-white/60');
                return (
                  <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" title={item.platform}>
                    <motion.div whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.95 }}
                      className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shadow-lg hover:bg-white/10 transition-all ${colorClass}`}>
                      {SvgIcon ? <SvgIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                    </motion.div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* [[ARABIC_COMMENT]] قسم التواصل الاجتماعي - يظهر فقط إذا أضاف الأدمن روابط */}
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
              <Globe className="w-5 h-5 text-cinematic-neon-gold" />
              <h3 className="text-lg font-bold text-white">{isRTL ? rawText('روابط التواصل الاجتماعي') : rawText('Social Media')}</h3>
            </motion.div>

            {/* [[ARABIC_COMMENT]] أيقونات التواصل بأيقونات SVG واضحة */}
            <div className="flex flex-wrap items-center gap-4">
              {socialConfig.whatsapp && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                  <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-2xl border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400 shadow-lg hover:bg-green-500/20 transition-all">
                    <SocialSVGIcons.whatsapp className="w-6 h-6" />
                  </motion.div>
                </a>
              )}
              {socialConfig.links.map((link, idx) => {
                const SvgIcon = SocialSVGIcons[link.platform];
                const colorClass = platformColors[link.platform] || rawText('text-white/60');
                return (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" title={link.platform}>
                    <motion.div whileHover={{ scale: 1.1 }} className={`w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shadow-lg hover:bg-white/10 transition-all ${colorClass}`}>
                      {SvgIcon ? <SvgIcon className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                    </motion.div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── AVAILABLE CARS CREATIVE TICKER ── */}
      {/* [[ARABIC_COMMENT]] إخفاء القسم بالكامل إذا لم تكن هناك سيارات مضافة للمعرض */}
      {latestCars && latestCars.length > 0 && (
        <section ref={liveRef} className="relative z-10 py-16 bg-linear-to-b from-transparent via-cinematic-neon-gold/5 to-transparent overflow-hidden">
          <div className="max-w-[100vw] mx-auto">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <motion.div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-cinematic-neon-gold/30 bg-cinematic-neon-gold/10 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(201,169,110,0.15)]" whileHover={{ scale: 1.05 }}>
                <Sparkles className="w-5 h-5 text-cinematic-neon-gold animate-pulse" />
                <span className="text-sm text-cinematic-neon-gold font-black tracking-widest uppercase">{isRTL ? rawText('المعرض المباشر') : rawText('SHOWROOM')}</span>
              </motion.div>
              <h2 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter mb-4" style={{ textShadow: "0 0 40px rgba(201,169,110,0.4)" }}>
                {isRTL ? rawText('سيارات متوفرة محلياً') : rawText('LOCAL INVENTORY')}
              </h2>
              <p className="text-white/50 text-sm font-medium uppercase tracking-widest">{isRTL ? rawText('اكتشف أحدث الموديلات المضافة إلى مستودعاتنا') : rawText('DISCOVER THE LATEST MODELS ADDED TO OUR INVENTORY')}</p>
            </motion.div>

            {/* New Ticker Layered Container */}
            <div className="relative w-full overflow-hidden py-10">
              {/* Gradient Mask for fading edges */}
              <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-cinematic-darker to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-cinematic-darker to-transparent z-20 pointer-events-none" />

              <motion.div
                className="flex gap-8 cursor-grab active:cursor-grabbing w-max px-8"
                animate={{ x: isRTL ? ["0%", "50%"] : ["-50%", "0%"] }}
                transition={{ duration: latestCars.length * 6, repeat: Infinity, ease: "linear" }}
                whileHover={{ animationPlayState: "paused" }}
              >
                {/* Clone the array to make infinite scrolling seamless */}
                {[...latestCars, ...latestCars, ...latestCars, ...latestCars].map((car, index) => {
                  const makeName = getCarMakeLabel(car);
                  return (
                    <motion.div
                      key={index}
                      className="group relative w-85 h-115 rounded-4xl border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden shadow-2xl hover:border-cinematic-neon-gold/50 transition-all duration-700 shrink-0"
                      onClick={() => router.push(isLoggedIn ? `/cars/${car.id || (car as { _id?: string })._id}` : '/login')}
                      whileHover={{ y: -10 }}
                    >
                      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/40 to-black z-10 pointer-events-none" />

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
                            <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] uppercase font-black tracking-widest text-cinematic-neon-gold backdrop-blur-md">
                              {car.year || new Date().getFullYear()}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] uppercase font-black tracking-widest text-white/70 backdrop-blur-md">
                              {makeName || rawText('AUTO')}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-white italic uppercase leading-tight mb-2 group-hover:text-cinematic-neon-gold transition-colors line-clamp-2">
                            {car.title || car.name}
                          </h3>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-xl font-black text-cinematic-neon-gold">
                              {formatPrice(Number(car.price || 0))}
                            </div>
                            <button className="w-10 h-10 rounded-full bg-cinematic-neon-gold flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_15px_rgba(201,169,110,0.4)]">
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

            <div className="flex flex-col sm:flex-row justify-center mt-12 gap-5 relative z-30 pointer-events-auto">
              <button
                onClick={() => router.push('/cars')}
                className="group flex flex-col items-center gap-2 px-10 py-5 rounded-4xl bg-white/3 border border-white/10 hover:border-cinematic-neon-gold/40 hover:bg-cinematic-neon-gold/10 transition-all backdrop-blur-xl shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white group-hover:text-cinematic-neon-gold transition-colors">
                    {isRTL ? rawText('معرض HM CAR') : rawText('HM CAR SHOWROOM')}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-cinematic-neon-gold transition-colors" />
                </div>
                <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{isRTL ? rawText('سيارات HM CAR المتوفرة') : rawText('HM CAR READY INVENTORY')}</span>
              </button>

              <button
                onClick={() => router.push('/showroom')}
                className="group flex flex-col items-center gap-2 px-10 py-5 rounded-4xl bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 hover:bg-cinematic-neon-gold/20 hover:border-cinematic-neon-gold/40 transition-all backdrop-blur-xl shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-cinematic-neon-gold" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-cinematic-neon-gold">
                    {isRTL ? rawText('معرض كوري') : rawText('KOREAN SHOWROOM')}
                  </span>
                  <ArrowRight className={cn("w-4 h-4 text-cinematic-neon-gold", isRTL && "rotate-180")} />
                </div>
                <span className="text-[8px] text-cinematic-neon-gold/40 font-bold uppercase tracking-widest">{isRTL ? rawText('اطلب سيارتك مباشرة من كوريا') : rawText('ORDER DIRECTLY FROM KOREA')}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Dynamic from Settings */}
      {!isStandalone && (
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cinematic-neon-gold/30 bg-cinematic-neon-gold/10 backdrop-blur-md mb-4" whileHover={{ scale: 1.05 }}>
              <Award className="w-4 h-4 text-cinematic-neon-gold" />
              <span className="text-sm text-cinematic-neon-gold tracking-wider">{txt.whySubtitle}</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-display" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>{txt.whyTitle}</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFeatures.map((feature: { icon: string; title: string; titleEn?: string; desc: string; descEn?: string }, index: number) => {
              const Icon = lucideIcons[feature.icon] || Shield;
              return (
                <motion.div key={index} className="group relative" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                  <div className="relative p-8 rounded-2xl border border-white/10 bg-white/2 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-cinematic-neon-gold/30 hover:bg-white/5">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-cinematic-neon-gold/20 rounded-full blur-3xl group-hover:bg-cinematic-neon-gold/30 transition-all" />
                    <div className="relative z-10">
                      <motion.div className="w-14 h-14 rounded-xl bg-linear-to-br from-cinematic-neon-gold to-[#8b7355] flex items-center justify-center mb-6" whileHover={{ rotate: 10, scale: 1.1 }}>
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
      )}

      {/* ════════════════════════════════════════
          قسم تثبيت التطبيق — دائماً ظاهر
      ════════════════════════════════════════ */}
      {!isInstalled && !isStandalone && (
        <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-3xl border border-cinematic-neon-gold/30 bg-linear-to-br from-cinematic-neon-gold/10 via-cinematic-dark to-cinematic-neon-gold/5 p-8 text-center shadow-[0_0_60px_rgba(201,169,110,0.1)]"
            >
              {/* هالة الضوء */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-cinematic-neon-gold/20 rounded-full blur-3xl pointer-events-none" />

              {/* أيقونة التطبيق */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-linear-to-br from-cinematic-neon-gold to-[#7a5c2e] flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(201,169,110,0.4)] relative z-10"
              >
                <span className="text-4xl">{rawText('🚗')}</span>
              </motion.div>

              <h2 className="text-2xl font-black text-white mb-2 relative z-10">
                {isRTL ? rawText('📲 حمّل تطبيق HM CAR') : rawText('📲 Download HM CAR App')}
              </h2>
              <p className="text-white/50 text-sm mb-6 relative z-10">
                {isRTL
                  ? rawText('ثبّت التطبيق على هاتفك وتابع المزادات والسيارات في أي وقت')
                  : rawText('Install the app and follow auctions & cars anytime')}
              </p>

              {/* زر التثبيت */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                {deferredInstall ? (
                  /* Android: زر تثبيت مباشر */
                  <motion.button
                    onClick={handleInstallPWA}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-linear-to-r from-cinematic-neon-gold to-[#e8c97a] text-black font-black text-base shadow-[0_0_30px_rgba(201,169,110,0.5)] hover:shadow-[0_0_50px_rgba(201,169,110,0.7)] transition-all"
                  >
                    <Smartphone className="w-5 h-5" />
                    {isRTL ? rawText('تثبيت التطبيق الآن') : rawText('Install App Now')}
                  </motion.button>
                ) : (
                  /* iOS / متصفحات أخرى: تعليمات */
                  <div className="space-y-3 w-full max-w-xs">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/10">
                      <span className="text-xl">{rawText('⬆️')}</span>
                      <p className="text-white/70 text-sm text-right">{isRTL ? rawText('اضغط زر المشاركة في المتصفح') : rawText('Tap the Share button in browser')}</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/10">
                      <span className="text-xl">{rawText('➕')}</span>
                      <p className="text-white/70 text-sm text-right">{isRTL ? rawText('اختر "إضافة إلى الشاشة الرئيسية"') : rawText('Choose "Add to Home Screen"')}</p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20">
                      <span className="text-xl">{rawText('✅')}</span>
                      <p className="text-cinematic-neon-gold text-sm font-bold text-right">{isRTL ? rawText('استمتع بتجربة التطبيق!') : rawText('Enjoy the app experience!')}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}



      {!isStandalone && (
        <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-display" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>{txt.testimonialsTitle}</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} className="relative p-8 rounded-2xl border border-white/10 bg-white/2 backdrop-blur-xl" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.15 }}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-cinematic-neon-gold fill-cinematic-neon-gold" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed">{rawText('“')}{testimonial.text}{rawText('”')}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-cinematic-neon-gold to-[#8b7355] flex items-center justify-center text-black font-bold">
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

      {!isStandalone && (
        <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div className="relative overflow-hidden rounded-3xl p-8 md:p-16" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="absolute inset-0 bg-linear-to-br from-cinematic-neon-gold/30 via-[#020202] to-[#8b7355]/20" />
              <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-20" />
              <motion.div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-cinematic-neon-gold/30 blur-3xl" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity }} />
              <motion.div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cinematic-neon-gold/20 blur-3xl" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity }} />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 text-center md:text-left">
                  <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cinematic-neon-gold/30 bg-cinematic-neon-gold/10 backdrop-blur-md mb-6" whileHover={{ scale: 1.05 }}>
                    <Smartphone className="w-4 h-4 text-cinematic-neon-gold" />
                    <span className="text-sm text-cinematic-neon-gold tracking-wider">{rawText('App')}</span>
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white font-display mb-4" style={{ textShadow: "0 0 40px rgba(201,169,110,0.3)" }}>{txt.downloadTitle}</h2>
                  <p className="text-white/60 mb-8">{txt.downloadSubtitle}</p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <motion.button className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-cinematic-neon-gold transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
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
                  <motion.div className="relative w-64 h-125 rounded-3xl border-4 border-white/20 overflow-hidden bg-linear-to-b from-cinematic-neon-gold/20 to-transparent" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Smartphone className="w-24 h-24 text-cinematic-neon-gold/30" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* [[ARABIC_COMMENT]] قسم الوكالات المعتمدة */}
      {brands.length > 0 && (
        <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-linear-to-b from-black via-cinematic-neon-gold/5 to-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center gap-4 justify-center mb-4">
                <div className="h-px w-12 bg-cinematic-neon-gold/30" />
                <h3 className="text-xl font-black uppercase tracking-[0.3em] text-cinematic-neon-gold italic">
                  {isRTL ? rawText('الوكالات المعتمدة') : rawText('OFFICIAL AGENCIES')}
                </h3>
                <div className="h-px w-12 bg-cinematic-neon-gold/30" />
              </div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic">{isRTL ? rawText('نحن وكلاء معتمدون لأكبر الماركات العالمية') : rawText('CERTIFIED AGENTS FOR PREMIER GLOBAL BRANDS')}</p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {brands.map((brand, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group cursor-pointer flex flex-col items-center gap-4"
                  onClick={() => router.push(`/search?brand=${brand.name}`)}
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/2 border border-white/10 p-5 flex items-center justify-center group-hover:bg-cinematic-neon-gold/10 group-hover:border-cinematic-neon-gold/40 shadow-2xl transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        fill
                        sizes="96px"
                        className="object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                      />
                    ) : (
                      <Tag className="w-10 h-10 text-white/10 group-hover:text-cinematic-neon-gold" />
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">{brand.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!isStandalone && (
      <footer className="relative z-10 py-10 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-cinematic-neon-gold font-display mb-2" style={{ textShadow: "0 0 20px rgba(201,169,110,0.3)" }}>{siteInfo?.siteName || rawText('HM CAR')}</h3>
              <p className="text-white/60 text-sm">{siteInfo?.siteDescription || (isRTL ? rawText('وجهتك الأولى للسيارات الفاخرة وقطع الغيار الأصلية من كوريا الجنوبية') : rawText('Your first destination for luxury cars and genuine parts from South Korea'))}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/support">
                <motion.div whileHover={{ scale: 1.08 }} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-cinematic-neon-gold hover:border-cinematic-neon-gold/40 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10a7 7 0 0 1 14 0v4a4 4 0 0 1-4 4h-1v2h-2v-2h-1a4 4 0 0 1-4-4z"></path></svg>
                </motion.div>
              </Link>
              {/* [[ARABIC_COMMENT]] أيقونة الواتساب */}
              {socialConfig.whatsapp && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 rounded-lg border border-green-500/30 bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-all"
                    title="WhatsApp"
                  >
                    {SocialSVGIcons.whatsapp && <SocialSVGIcons.whatsapp className="w-5 h-5" />}
                  </motion.div>
                </a>
              )}
              {/* [[ARABIC_COMMENT]] أيقونات التواصل الاجتماعي - تظهر بأيقونات SVG واضحة */}
              {socialConfig.links.slice(0, 4).map((item, idx) => {
                const SvgIcon = SocialSVGIcons[item.platform];
                const colorClass = platformColors[item.platform] || rawText('text-white/60');
                return (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" key={idx}>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all ${colorClass}`}
                      title={item.platform}
                    >
                      {SvgIcon ? <SvgIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                    </motion.div>
                  </a>
                );
              })}
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-xs">{rawText('© 2026')} {siteInfo?.siteName || rawText('HM CAR')}{rawText('.')} {txt.rights}{rawText('.')}</p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <Link href="#" className="hover:text-cinematic-neon-gold transition-colors">{txt.privacy}</Link>
              <Link href="#" className="hover:text-cinematic-neon-gold transition-colors">{txt.terms}</Link>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* ── بانر التحديث التلقائي ── */}
      {showUpdateBanner && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-9999 bg-cinematic-neon-gold text-black px-4 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(201,169,110,0.5)]"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-black uppercase tracking-wider">
              {isRTL ? rawText('🎉 تحديث جديد متوفر!') : rawText('🎉 New update available!')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-black text-cinematic-neon-gold text-xs font-black uppercase tracking-widest rounded-lg hover:bg-black/80 transition-all"
            >
              {isRTL ? rawText('تحديث الآن') : rawText('UPDATE NOW')}
            </button>
            <button
              onClick={() => setShowUpdateBanner(false)}
              className="text-black/60 hover:text-black text-xs font-black"
            >
              {rawText('✕')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

