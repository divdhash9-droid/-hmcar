"use client";

/**
 * المكون الرئيسي للصفحة الرئيسية (HomeClient)
 * يتحكم في عرض الموقع بناءً على المنصة (متصفح أو PWA مثبت).
 * يتضمن الخلفية السينمائية، شريط الإعلانات، وعرض السيارات الأحدث.
 */

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Shield, Truck, CreditCard, Award, Star, Zap, Globe,
  MessageCircle, Smartphone, Download, Link as LinkIcon, ArrowUpRight,
  ArrowRight, Car, Play, Check, ChevronLeft, ChevronRight,
  Quote, Phone, Instagram, Facebook, Youtube, Send, Linkedin,
  Mail, Search, Gavel, Cog, Info, User, LogOut, Menu, X, Plus
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";

import dynamic from "next/dynamic";
const LandingShowcase = dynamic(() => import("@/components/LandingShowcase"), { ssr: false });
const AppHome = dynamic(() => import("@/components/AppHome"), { ssr: false });
const SmartAdBanner = dynamic(() => import("@/components/SmartAdBanner"), { ssr: false });

import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/SocketContext";
import CurrencySwitcher from "@/components/CurrencySwitcher";
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
  priceSar?: number;
  priceUsd?: number;
};

interface HomeClientProps {
  latestCars: CarType[];
}

// ── مكون زر التطبيق العائم ──
function PWAFloatingButton({ isRTL, deferredInstall, onInstall }: { isRTL: boolean; deferredInstall: any; onInstall: () => void }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="relative">
      {/* أيقونة الهاتف الثابتة */}
      <motion.button
        id="pwa-float-btn"
        onClick={() => setShowPopup(!showPopup)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 hover:border-accent-gold/50 transition-transform text-accent-gold shadow-[0_0_15px_rgba(201,169,110,0.2)]"
        title={isRTL ? 'تطبيق HM CAR' : 'HM CAR App'}
      >
        <Smartphone className="w-5 h-5" />
      </motion.button>

      {/* Popup النافذة المنبثقة */}
      {showPopup && (
        <>
          {/* خلفية شفافة لإغلاق النافذة */}
          <div className="fixed inset-0 z-[199]" onClick={() => setShowPopup(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: isRTL ? -20 : 20 }}
            className={`absolute top-0 z-[200] w-72 rounded-3xl bg-black/95 border border-accent-gold/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden ${isRTL ? 'right-16' : 'left-16'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-gold text-black flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-black text-base uppercase tracking-tight">{isRTL ? 'تطبيق HM CAR' : 'HM CAR App'}</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest">{isRTL ? 'تجربة أسرع وتنبيهات فورية' : 'Faster experience & instant alerts'}</p>
              </div>
            </div>
            {/* Body */}
            <div className="px-6 py-5">
              {deferredInstall ? (
                <button
                  onClick={() => { onInstall(); setShowPopup(false); }}
                  className="w-full py-3.5 bg-accent-gold text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent-gold/90 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  {isRTL ? 'تثبيت' : 'INSTALL'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <ArrowUpRight className="w-4 h-4 text-accent-gold flex-shrink-0" />
                    <span className="text-white/70 text-xs font-bold">{isRTL ? 'اضغط زر المشاركة ↗' : 'Tap Share button ↗'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Plus className="w-4 h-4 text-accent-gold flex-shrink-0" />
                    <span className="text-white/70 text-xs font-bold">{isRTL ? 'اختر: إضافة للشاشة الرئيسية' : 'Select: Add To Home Screen'}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
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
  const [deferredInstall, setDeferredInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    // التحقق مما إذا كان التطبيق مسجلاً كمثبت في التخزين المحلي
    if (typeof window !== 'undefined') return !!localStorage.getItem('pwa_installed');
    return false;
  });

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredInstall(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); localStorage.setItem('pwa_installed', '1'); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
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
    // إذا كان التطبيق يعمل كـ PWA مثبت والمستخدم مسجل دخول، يتم تحويله مباشرة للوحة التحكم
    if (isStandalone && isLoggedIn) {
      router.replace('/client/dashboard');
    }
  }, [isStandalone, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && user && socket && isConnected) {
      const userId = (user as any)._id || (user as any).id;
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
      else setVideoHeight("85vh");
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const txt = {
    rights: isRTL ? "جميع الحقوق محفوظة" : "All Rights Reserved",
    privacy: isRTL ? "سياسة الخصوصية" : "Privacy Policy",
    terms: isRTL ? "شروط الاستخدام" : "Terms of Use",
  };

  const lucideIcons: Record<string, any> = {
    Shield, Truck, CreditCard, Award, Zap, Globe, Star, Smartphone, MessageCircle, Heart: Sparkles,
    ArrowUpRight, ArrowRight, Play, Check, ChevronLeft, ChevronRight, Quote, Phone, Instagram,
    Facebook, Youtube, Send, Linkedin, Mail, Search, Gavel, Cog, Info, User, LogOut,
    Menu, X, Car, Sparkles, Plus
  };


  const [socialConfig, setSocialConfig] = useState<{ whatsapp?: string; links: { platform: string; url: string }[] }>({
    whatsapp: '+821080880014',
    links: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'snapchat', url: 'https://snapchat.com' },
    ]
  });

  useEffect(() => {
    const DEFAULT_WHATSAPP = '+821080880014';
    const DEFAULT_SOCIAL_LINKS = [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'snapchat', url: 'https://snapchat.com' },
    ];

    const fetchSocialLinks = async () => {
      try {
        const response = await api.settings.getPublic();
        if (response.success && response.data.socialLinks) {
          const sl = response.data.socialLinks;
          const linksArray = Object.entries(sl)
            .filter(([k, v]) => k !== 'whatsapp' && v && String(v).startsWith('http'))
            .map(([k, v]) => ({ platform: k, url: v as string }));

          setSocialConfig({
            whatsapp: sl.whatsapp || DEFAULT_WHATSAPP,
            links: linksArray.length > 0 ? linksArray : DEFAULT_SOCIAL_LINKS
          });
        }
      } catch (err) {
        console.error("Failed to fetch social links", err);
      }
    };
    fetchSocialLinks();
  }, []);

  const SocialSVGIcons: Record<string, React.FC<{ className?: string }>> = {
    whatsapp: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
    ),
    instagram: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
    ),
    facebook: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    ),
    youtube: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
    ),
    tiktok: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
    ),
    snapchat: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.449-1.243.734-3.033 1.049-.106.15-.135.735-.15 1.064-.015.194-.015.391-.045.57-.045.245-.24.419-.504.419h-.044c-.166 0-.332-.060-.54-.121-.315-.09-.72-.194-1.215-.194-.224 0-.464.016-.72.061-.42.075-.764.23-1.125.406-.689.345-1.484.75-2.878.75h-.196c-1.393 0-2.189-.405-2.878-.75-.36-.176-.705-.331-1.125-.406-.254-.045-.495-.061-.72-.061-.498 0-.9.105-1.215.194-.209.061-.375.121-.54.121h-.044c-.262 0-.458-.174-.504-.419-.03-.179-.03-.376-.045-.57-.016-.329-.045-.914-.15-1.064-1.79-.315-2.793-.6-3.033-1.049-.03-.076-.045-.15-.045-.225-.016-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.21-.645.119-.869-.195-.45-.883-.675-1.333-.81-.135-.044-.254-.09-.344-.119-1.137-.44-1.196-.96-.602-1.29.15-.061.33-.09.509-.09.12 0 .3.016.465.104.374.181.732.285 1.033.301.197 0 .326-.045.401-.09-.015-.175-.015-.345-.03-.51l-.003-.06c-.104-1.627-.23-3.654.299-4.847C7.856 1.069 11.215.793 12.206.793z" /></svg>
    ),
    telegram: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
    ),
    twitter: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    ),
    linkedin: ({ className }) => (
      <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
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
    <main ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-black text-white" dir={isRTL ? "rtl" : "ltr"}>
      <div className="hide-in-app">
        <Navbar />
      </div>

      {/* ── STICKY SOCIAL BAR (Visible only in Web) ── */}
      {!isStandalone && (
        <div className={cn(
          "fixed z-[90] flex flex-col gap-3 top-1/3",
          isRTL ? "right-4" : "left-4"
        )}>
          {socialConfig.whatsapp && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-green-500/30 flex items-center justify-center text-green-500 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.3)]" title="WhatsApp">
              <SocialSVGIcons.whatsapp className="w-6 h-6" />
            </a>
          )}
          {socialConfig.links.map((link, i) => {
            const SvgIcon = SocialSVGIcons[link.platform];
            const colorClass = platformColors[link.platform] || 'text-white/80';
            return (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" className={`w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 hover:border-white/30 transition-transform ${colorClass}`} title={link.platform}>
                {SvgIcon ? <SvgIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
              </a>
            )
          })}
          {/* ── FLOATING PWA PHONE ICON ── */}
          {!isInstalled && (
            <PWAFloatingButton
              isRTL={isRTL}
              deferredInstall={deferredInstall}
              onInstall={handleInstallPWA}
            />
          )}

          {/* ── PERSISTENT CURRENCY SWITCHER ── */}
          <CurrencySwitcher variant="minimal" className="mt-2" />
        </div>
      )}

      {/* ── BACKGROUND LOGIC ── */}
      {!isStandalone ? (
        <CinematicVideoBackground
          videoSrc={homeContent?.heroVideoUrl || "/videos/hero.mp4"}
          fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
          mobileImage="/images/hmcar.jpg"
          overlayOpacity={0.55}
          height={videoHeight}
        />
      ) : null}

      {/* ── BACK TO TOP BUTTON ── */}
      <motion.button
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-2xl bg-accent-gold text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        title={isRTL ? 'الرجوع للأعلى' : 'Back to Top'}
      >
        <ArrowRight className="-rotate-90 w-5 h-5" />
      </motion.button>

      {/* ── CONTENT SWITCHER ── */}
      {isStandalone ? (
        // ── واجهة التطبيق الاحترافية (App Interface) ──
        <AppHome 
          isRTL={isRTL} 
          latestCars={latestCars} 
          formatPrice={formatPrice} 
        />
      ) : (
        // ── واجهة الموقع الاستعراضية (Web Showcase) ──
        <>
          {/* 1. HERO SHOWCASE */}
          <LandingShowcase isRTL={isRTL} latestCars={latestCars} />

          {/* 2.5 ANNOUNCEMENT RIBBON */}
          {latestCars && latestCars.length > 0 && (
            <section className="relative z-20 mb-24 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent" />
              <div className="relative py-4 border-y border-white/10 bg-black/50 backdrop-blur-xl">
                <div
                  className={cn(
                    "flex gap-4 w-max px-6",
                    isRTL ? "animate-marquee-rtl" : "animate-marquee",
                    "pause-marquee"
                  )}
                  style={{ animationDuration: `${latestCars.length * 8}s` }}
                >
                  {[...latestCars, ...latestCars].map((car, index) => (
                    <button
                      key={index}
                      onClick={() => router.push(`/cars/${car.id || (car as any)._id || index}`)}
                      className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:border-accent-gold/40 transition-colors"
                    >
                      <span className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                        <Image
                          src={car.images?.[0] || "/images/placeholder.jpg"}
                          alt={car.title || car.name || 'Car'}
                          fill
                          className="object-cover"
                        />
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                        {car.title || car.name || (isRTL ? 'سيارة' : 'Car')}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">
                        {formatPrice(Number(car.price || car.priceSar || (Number(car.priceUsd || 0) * 3.75) || 0))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 4. LIVE MARKET TICKER */}
          {(homeContent?.showLiveMarket ?? true) && latestCars && latestCars.length > 0 && (
            <section ref={liveRef} className="relative z-10 py-32 overflow-hidden bg-linear-to-b from-transparent via-accent-gold/5 to-transparent">
              <div className="max-w-[100vw] mx-auto text-center mb-20 px-4">
                <h2 className="text-6xl md:text-9xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_60px_rgba(201,169,110,0.6)]">
                  {isRTL ? 'المعرض المباشر' : 'LIVE SHOWROOM'}
                </h2>
              </div>

              <div className="relative w-full overflow-hidden py-10 scale-[0.9] origin-center">
                <div
                  className={cn(
                    "flex gap-12 w-max px-12",
                    isRTL ? "animate-marquee-rtl" : "animate-marquee",
                    "pause-marquee"
                  )}
                  style={{ animationDuration: `${latestCars.length * 10}s` }}
                >
                  {[...latestCars, ...latestCars].map((car, index) => {
                    const makeName = getCarMakeLabel(car);
                    return (
                      <motion.div
                        key={index}
                        className="group relative w-96 h-125 rounded-[4rem] border border-white/5 bg-black/90 backdrop-blur-3xl overflow-hidden shadow-3xl shrink-0"
                        onClick={() => router.push(`/cars/${car.id || (car as any)._id || index}`)}
                        whileHover={{ y: -25, scale: 1.05 }}
                      >
                        <Image src={car.images?.[0] || "/images/placeholder.jpg"} alt={car.title || car.name || 'Car'} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent z-10" />
                        <div className="absolute z-20 inset-0 flex flex-col justify-end p-10">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-4 py-1.5 rounded-full bg-accent-gold text-black text-[9px] font-black uppercase tracking-widest">{car.year}</span>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest">{makeName}</span>
                          </div>
                          <h3 className="text-3xl font-black text-white italic uppercase mb-2 group-hover:text-accent-gold transition-colors">{car.title || car.name}</h3>
                          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                             <span className="text-2xl font-black text-accent-gold">{formatPrice(Number(car.price || car.priceSar || (Number(car.priceUsd || 0) * 3.75) || 0))}</span>
                            <ArrowUpRight className="w-8 h-8 text-accent-gold" />
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* 4.5 الشريط الإعلاني الذكي المتحرك */}
      {(homeContent?.showAdvertising ?? true) && (
        <SmartAdBanner />
      )}

      {/* ── 5. THE BUYING JOURNEY - REMOVED AS REQUESTED ── */}

      {/* ── 5.1 PLATFORM FEATURES (DYNAMIC WITH FALLBACK) ── */}
      {(homeContent?.showPlatformFeatures ?? true) && (() => {
        const displayFeatures = features && features.length > 0 ? features : [
          { title: 'موثوقية تامة', titleEn: 'Absolute Trust', desc: 'سيارات مستوردة مفحوصة بالكامل مع ضمان الشفافية للمالك.', descEn: 'Fully inspected imported cars with transparency guaranteed.', icon: 'Shield' },
          { title: 'أسعار تنافسية', titleEn: 'Competitive Pricing', desc: 'مزادات حية تمنحك الأولوية للحصول على أفضل سعر بالسوق.', descEn: 'Live auctions giving you edge for the best market prices.', icon: 'Award' },
          { title: 'شحن عالمي', titleEn: 'Global Shipping', desc: 'نظام رقمي يتتبع مسار رحلة سيارتك حتى باب منزلك.', descEn: 'Digital system tracking your car journey to your doorstep.', icon: 'Globe' }
        ];

        return (
          <section className="relative z-10 py-32 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-24">
                <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter">{isRTL ? 'لماذا تختارنا؟' : 'WHY CHOOSE US?'}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {displayFeatures.slice(0, 6).map((feat, i) => {
                  const Icon = (lucideIcons as any)[feat.icon] || Shield;
                  return (
                    <div key={i} className="p-10 rounded-[3rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                      <div className="w-16 h-16 rounded-2xl bg-accent-gold/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <Icon className="w-8 h-8 text-accent-gold" />
                      </div>
                      <h4 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">{isRTL ? feat.title : (feat.titleEn || feat.title)}</h4>
                      <p className="text-white/40 text-sm leading-relaxed">{isRTL ? feat.desc : (feat.descEn || feat.desc)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        );
      })()}


      {/* ── 6. دليل الماركات: تم حذفه حسب الطلب ── */}






      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-24 px-4 border-t border-white/10 bg-black hide-in-app">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20 text-center md:text-left">
            <div>
              <h3 className="text-3xl font-black text-accent-gold italic uppercase tracking-tighter mb-4">{siteInfo?.siteName || 'HM CAR'}</h3>
              <p className="text-white/40 text-sm max-w-sm">{isRTL ? 'وجهتك الأولى للسيارات الفاخرة الكورية.' : 'Your premier destination for Korean luxury cars.'}</p>
            </div>
            <div className="flex gap-4">
              {socialConfig.whatsapp && (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 rounded-2xl border border-green-500/30 flex items-center justify-center text-green-400 bg-green-500/5 hover:bg-green-500/10 transition-all"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <SocialSVGIcons.whatsapp className="w-6 h-6" />
                </a>
              )}
              {socialConfig.links.map((link, i) => {
                const SvgIcon = SocialSVGIcons[link.platform];
                const colorClass = platformColors[link.platform] || 'text-white/40';
                return (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all ${colorClass}`}
                    aria-label={link.platform}
                    title={link.platform}
                  >
                    {SvgIcon ? <SvgIcon className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                  </a>
                )
              })}
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 text-[10px] font-black uppercase tracking-widest">
             <p>© 2026 {siteInfo?.siteName || 'HM CAR'}. {txt.rights}.</p>
             <div className="flex gap-8">
               <Link href="#" className="hover:text-accent-gold transition-colors">{txt.privacy}</Link>
               <Link href="#" className="hover:text-accent-gold transition-colors">{txt.terms}</Link>
             </div>
          </div>
        </div>
      </footer>



    </main>
  );
}
