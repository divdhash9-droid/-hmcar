'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Upload, Save, Trash2, ChevronLeft, Tag } from "lucide-react";
import { api } from "@/lib/api";

interface BrandRaw {
  _id: string;
  name: string;
  logoUrl?: string;
  forCars?: boolean;
  forSpareParts?: boolean;
}

type Brand = { id: string; name: string; logo?: string; category: 'cars' | 'parts' | 'both' };

export default function AdminBrandsPage() {
  const { isRTL, t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string>("");
  const [category, setCategory] = useState<'cars' | 'parts' | 'both'>('both');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.brands.list();
        if (res?.success && Array.isArray(res.brands)) {
          setBrands(res.brands.map((b: BrandRaw) => ({ id: b._id, name: b.name, logo: b.logoUrl, category: (b.forCars && b.forSpareParts) ? 'both' : (b.forCars ? 'cars' : 'parts') })));
        }
      } catch { }
    })();
  }, []);

  const refresh = async () => {
    try {
      const res = await api.brands.list();
      if (res?.success) {
        const mapped = res.brands.map((b: BrandRaw) => ({ id: b._id, name: b.name, logo: b.logoUrl, category: (b.forCars && b.forSpareParts) ? 'both' : (b.forCars ? 'cars' : 'parts') } as Brand));
        setBrands(mapped);
        try { localStorage.setItem('hm_brands_cache', JSON.stringify(mapped)) } catch { }
      }
    } catch { }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await api.brands.create({ name: name.trim(), logoUrl: logo, category });
      setName(""); setLogo(""); setCategory('both');
      await refresh();
    } catch { }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.brands.delete(id);
      await refresh();
    } catch { }
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />
      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <header className="mb-16">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all group w-fit">
            <ChevronLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] w-12 bg-[#c9a96e] shadow-[0_0_10px_rgba(201,169,110,1)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c9a96e] italic">Admin Control</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] mb-4">
                {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{t('brands')}</span>
              </h1>
              <p className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-bold">
                {isRTL ? 'أضف ماركات السيارات وقطع الغيار' : 'Add car & parts brands'}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card p-8 bg-white/[0.02] border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Tag className="w-5 h-5 text-[#c9a96e]" />
              <h2 className="text-xl font-black">{t('addBrand')}</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{t('brandName')}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} title={t('brandName')} placeholder={isRTL ? 'أدخل اسم الماركة' : 'Enter brand name'} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#c9a96e]/40" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{t('brandLogo')}</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                    {logo ? <Image src={logo} alt="Logo" fill className="object-cover" unoptimized /> : <Upload className="w-8 h-8 text-white/20" />}
                    <input type="file" accept="image/*" title={isRTL ? 'رفع شعار' : 'Upload logo'} className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const fd = new FormData();
                      fd.append('image', file);
                      try {
                        const res = await api.upload.image(fd);
                        if (res?.success && res.url) setLogo(res.url);
                      } catch { }
                    }} />
                  </div>
                  <div className="text-[10px] text-white/40">{isRTL ? 'اضغط لرفع شعار' : 'Click to upload logo'}</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{t('brandCategory')}</label>
                <select title={t('brandCategory')} value={category} onChange={(e) => setCategory(e.target.value as 'cars' | 'parts' | 'both')} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#c9a96e]/40">
                  <option value="cars">{t('brandCars')}</option>
                  <option value="parts">{t('brandParts')}</option>
                  <option value="both">{t('brandBoth')}</option>
                </select>
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAdd} className="btn-glow w-full py-4 bg-[#c9a96e] !text-black rounded-xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {isRTL ? 'حفظ' : 'SAVE'}
              </motion.button>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-8 bg-white/[0.02] border-white/10 rounded-2xl">
            <h3 className="text-lg font-black mb-8 px-2">{isRTL ? 'الوكالات والماركات المضافة' : 'Registered Agencies & Brands'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {brands.map((b) => (
                <div key={b.id} className="group relative flex flex-col items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full bg-white shadow-inner border border-white/10 overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    {b.logo ? (
                      <div className="relative w-2/3 h-2/3">
                        <Image src={b.logo} alt={b.name} fill className="object-contain" unoptimized />
                      </div>
                    ) : <Tag className="w-8 h-8 text-black/10" />}
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-black uppercase tracking-widest">{b.name}</div>
                    <div className="text-[8px] text-white/30 uppercase mt-1">{b.category}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cinematic-neon-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
