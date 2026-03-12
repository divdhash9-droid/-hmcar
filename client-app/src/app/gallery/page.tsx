'use client';

/* oxlint-disable react-native/no-raw-text, tailwindcss/no-unnecessary-arbitrary-value */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Car, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useRouter } from 'next/navigation';

export default function GalleryHubPage() {
  const { isRTL } = useLanguage();
  const router = useRouter();
  const TXT = {
    choose: isRTL ? 'اختر المعرض المناسب' : 'Choose Your Showroom',
    title: isRTL ? 'المعرض' : 'SHOWROOM',
    subtitle: isRTL
      ? 'اختر بين المعرض الكوري للاستيراد المباشر، أو معرض HM CAR للسيارات المتوفرة حالياً.'
      : 'Choose between Korean imports and HM CAR local ready inventory.',
    koreanTitle: isRTL ? 'معرض كوري' : 'Korean Showroom',
    koreanDesc: isRTL
      ? 'سيارات من السوق الكوري مع مواصفات كاملة وإمكانية الطلب المباشر.'
      : 'Korean-market vehicles with full specs and direct order flow.',
    hmTitle: isRTL ? 'معرض HM CAR' : 'HM CAR Showroom',
    hmDesc: isRTL
      ? 'السيارات المتوفرة محلياً في HM CAR مع إمكانية التصفح والشراء بشكل أسرع.'
      : 'HM CAR ready inventory with faster browsing and purchase flow.',
    enterNow: isRTL ? 'ادخل الآن' : 'Enter Now',
  };

  return (
    <div className={cn('min-h-screen bg-cinematic-darker text-white', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-cinematic-neon-gold mb-4">{TXT.choose}</p>
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              {TXT.title}
            </h1>
            <div className="mt-4">
              <button
                onClick={() => router.back()}
                title={isRTL ? 'رجوع' : 'Back'}
                aria-label={isRTL ? 'رجوع' : 'Back'}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-180" />}
              </button>
            </div>
            <p className="text-white/50 mt-4 max-w-2xl mx-auto">{TXT.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/showroom" className="group">
              <motion.div
                whileHover={{ y: -6 }}
                className="h-full rounded-3xl border border-white/10 bg-white/3 p-8 hover:border-cinematic-neon-gold/45 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-cinematic-neon-gold/15 border border-cinematic-neon-gold/30 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-cinematic-neon-gold" />
                </div>
                <h2 className="text-2xl font-black mb-3">{TXT.koreanTitle}</h2>
                <p className="text-sm text-white/55 leading-relaxed mb-7">{TXT.koreanDesc}</p>
                <div className="inline-flex items-center gap-2 text-cinematic-neon-gold text-xs font-black uppercase tracking-widest">
                  {TXT.enterNow}
                  <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                </div>
              </motion.div>
            </Link>

            <Link href="/cars" className="group">
              <motion.div
                whileHover={{ y: -6 }}
                className="h-full rounded-3xl border border-white/10 bg-white/3 p-8 hover:border-white/30 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-3">{TXT.hmTitle}</h2>
                <p className="text-sm text-white/55 leading-relaxed mb-7">{TXT.hmDesc}</p>
                <div className="inline-flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest">
                  {TXT.enterNow}
                  <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


