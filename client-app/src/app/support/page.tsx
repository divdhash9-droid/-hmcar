'use client';

import { motion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  Phone,
  Headphones,
  ArrowRight,
  ChevronLeft,
  Clock,
  ShieldCheck
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const { t, isRTL } = useLanguage();
  const { isLoggedIn } = useAuth();

  const supportOptions = [
    {
      id: 'live-chat',
      title: isRTL ? 'المحادثة المباشرة' : 'LIVE SUPPORT CHAT',
      desc: isRTL ? 'تحدث مع فريقنا مباشرة عبر الموقع' : 'Talk to our team directly through the site',
      icon: MessageCircle,
      href: isLoggedIn ? '/messages' : '/login?redirect=/messages',
      color: 'text-cinematic-neon-blue',
      bg: 'bg-cinematic-neon-blue/10',
      border: 'border-cinematic-neon-blue/20',
      tag: isLoggedIn ? (isRTL ? 'نشط الآن' : 'ACTIVE NOW') : (isRTL ? 'يتطلب تسجيل دخول' : 'REQUIRES LOGIN')
    },
    {
      id: 'whatsapp',
      title: isRTL ? 'واتساب مباشر' : 'DIRECT WHATSAPP',
      desc: isRTL ? 'تواصل معنا فوراً عبر تطبيق الواتساب' : 'Contact us instantly via WhatsApp app',
      icon: Phone,
      href: 'https://wa.me/967781007805',
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
      tag: isRTL ? 'الأسرع ردآ' : 'FASTEST RESPONSE'
    },
    {
      id: 'contact-form',
      title: isRTL ? 'نموذج التواصل' : 'CONTACT FORM',
      desc: isRTL ? 'أرسل لنا رسالة وسنرد عليك عبر البريد' : 'Send us a message and we will email back',
      icon: Mail,
      href: '/contact',
      color: 'text-cinematic-neon-red',
      bg: 'bg-cinematic-neon-red/10',
      border: 'border-cinematic-neon-red/20',
      tag: isRTL ? 'استفسارات عامة' : 'GENERAL INQUIRIES'
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cinematic-neon-blue/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cinematic-neon-red/5 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-6xl mx-auto">
        <header className="mb-16 text-center md:text-right">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group">
            <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO HOME'}</span>
          </Link>

          <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
            <div className="h-[2px] w-12 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">Support Center</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] mb-8">
            {isRTL ? 'مركز' : 'SUPPORT'} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
              {isRTL ? 'الدعم والمساعدة' : 'CENTER'}
            </span>
          </h1>

          <p className="text-white/40 text-lg md:text-xl font-medium max-w-2xl mt-6 uppercase leading-relaxed tracking-wide">
            {isRTL
              ? 'نحن هنا لمساعدتك في كل خطوة. اختر الطريقة التي تفضلها للتواصل مع فريقنا المحترف.'
              : 'We are here to help you every step of the way. Choose your preferred method to contact our professional team.'}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {supportOptions.map((opt, i) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <Link href={opt.href}>
                <div className={cn(
                  "h-full p-10 rounded-[3rem] border bg-white/[0.02] hover:bg-white/[0.05] transition-all relative overflow-hidden flex flex-col items-start gap-8",
                  opt.border
                )}>
                  {/* Decorative background icon */}
                  <opt.icon className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />

                  <div className="w-full flex justify-between items-start">
                    <div className={cn("p-5 rounded-2xl shadow-xl", opt.bg, opt.color)}>
                      <opt.icon className="w-8 h-8" />
                    </div>
                    <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10", opt.color)}>
                      {opt.tag}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3">{opt.title}</h3>
                    <p className="text-white/40 text-sm font-bold leading-relaxed">{opt.desc}</p>
                  </div>

                  <div className="mt-auto w-full pt-8 flex items-center justify-between border-t border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] group-hover:translate-x-2 transition-transform duration-500 flex items-center gap-2">
                      {isRTL ? 'ابدأ الآن' : 'START NOW'}
                      <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="p-12 rounded-[4rem] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center gap-10">
          <div className="p-8 rounded-[2.5rem] bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20">
            <ShieldCheck className="w-16 h-16 text-cinematic-neon-blue shadow-[0_0_30px_rgba(0,240,255,0.3)]" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4">
              {isRTL ? 'دعم فني موثوق وآمن' : 'SECURE & RELIABLE SUPPORT'}
            </h4>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm leading-relaxed">
              {isRTL
                ? 'جميع محادثاتك وبياناتك مشفرة ومحمية بخصوصية تامة. فريقنا متاح خلال ساعات العمل الرسمية للرد على كافة استفسارات المزادات والشراء.'
                : 'All your conversations and data are encrypted and protected with total privacy. Our team is available during official working hours to answer all auction and purchase inquiries.'}
            </p>
          </div>
          <div className="flex items-center gap-4 px-8 py-4 bg-white/5 rounded-2xl border border-white/10 shrink-0">
            <Clock className="w-5 h-5 text-cinematic-neon-blue" />
            <div className="text-right">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isRTL ? 'ساعات العمل' : 'WORKING HOURS'}</div>
              <div className="text-sm font-black whitespace-nowrap uppercase tracking-tighter italic">08:00 AM - 10:00 PM</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
