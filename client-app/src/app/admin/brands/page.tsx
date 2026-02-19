'use client';

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Upload, Save, Trash2, ChevronLeft, Tag } from "lucide-react";
import { api } from "@/lib/api";

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
          setBrands(res.brands.map((b: any) => ({ id: b._id, name: b.name, logo: b.logoUrl, category: (b.forCars && b.forSpareParts) ? 'both' : (b.forCars ? 'cars' : 'parts') })));
        }
      } catch {}
    })();
  }, []);

  const refresh = async () => {
    try {
      const res = await api.brands.list();
      if (res?.success) {
        setBrands(res.brands.map((b: any) => ({ id: b._id, name: b.name, logo: b.logoUrl, category: (b.forCars && b.forSpareParts) ? 'both' : (b.forCars ? 'cars' : 'parts') })));
        try { localStorage.setItem('hm_brands_cache', JSON.stringify(res.brands.map((b: any) => ({ id: b._id, name: b.name, logo: b.logoUrl, category: (b.forCars && b.forSpareParts) ? 'both' : (b.forCars ? 'cars' : 'parts') })))) } catch {}
      }
    } catch {}
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await api.brands.create({ name: name.trim(), logoUrl: logo, category });
      setName(""); setLogo(""); setCategory('both');
      await refresh();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.brands.delete(id);
      await refresh();
    } catch {}
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />
      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <header className="mb-16">
          
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
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#c9a96e]/40" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{t('brandLogo')}</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                    {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <Upload className="w-8 h-8 text-white/20" />}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const fd = new FormData();
                      fd.append('image', file);
                      try {
                        const res = await api.upload.image(fd);
                        if (res?.success && res.url) setLogo(res.url);
                      } catch {}
                    }} />
                  </div>
                  <div className="text-[10px] text-white/40">{isRTL ? 'اضغط لرفع شعار' : 'Click to upload logo'}</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{t('brandCategory')}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#c9a96e]/40">
                  <option value="cars">{t('brandCars')}</option>
                  <option value="parts">{t('brandParts')}</option>
                  <option value="both">{t('brandBoth')}</option>
                </select>
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAdd} className="btn-glow w-full py-4 bg-[#c9a96e] text-black rounded-xl text-[11px] font-black uppercase tracking-[0.3em]">
                <Save className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-8 bg-white/[0.02] border-white/10 rounded-2xl">
            <h3 className="text-lg font-black mb-6">{isRTL ? 'الماركات المضافة' : 'Added Brands'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                    {b.logo ? <img src={b.logo} alt={b.name} className="w-full h-full object-cover" /> : <Tag className="w-6 h-6 text-white/30" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black">{b.name}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-[0.3em]">{b.category}</div>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="btn-glow px-3 py-2 rounded-lg bg-cinematic-neon-red/10 border border-cinematic-neon-red/30 text-cinematic-neon-red">
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
