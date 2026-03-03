'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Upload, Save, Trash2, ChevronLeft, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BrandRaw {
  _id: string;
  name: string;
  logoUrl?: string;
  forCars?: boolean;
  forSpareParts?: boolean;
  location?: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
  description_ar?: string;
}

type Brand = {
  id: string;
  name: string;
  logo?: string;
  category: 'cars' | 'parts' | 'both';
  location?: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
  description_ar?: string;
};

export default function AdminBrandsPage() {
  const { isRTL, t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [category, setCategory] = useState<'cars' | 'parts' | 'both'>('both');
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  const refresh = async () => {
    try {
      const res = await api.brands.list();
      if (res?.success) {
        const mapped = res.brands.map((b: BrandRaw) => ({
          id: b._id,
          name: b.name,
          logo: b.logoUrl,
          category: (b.forCars && b.forSpareParts) ? 'both' : (b.forCars ? 'cars' : 'parts'),
          location: b.location || "",
          phone: b.phone || "",
          whatsapp: b.whatsapp || "",
          description: b.description || "",
          description_ar: b.description_ar || ""
        } as Brand));
        setBrands(mapped);
      }
    } catch { }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      logoUrl: logo,
      category,
      location,
      phone,
      whatsapp,
      description,
      description_ar: descriptionAr
    };

    try {
      if (editingId) {
        await api.brands.update(editingId, payload);
      } else {
        await api.brands.create(payload);
      }
      resetForm();
      await refresh();
    } catch { }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setLogo(""); setCategory('both');
    setLocation(""); setPhone(""); setWhatsapp("");
    setDescription(""); setDescriptionAr("");
  };

  const startEdit = (b: Brand) => {
    setEditingId(b.id);
    setName(b.name);
    setLogo(b.logo || "");
    setCategory(b.category);
    setLocation(b.location || "");
    setPhone(b.phone || "");
    setWhatsapp(b.whatsapp || "");
    setDescription(b.description || "");
    setDescriptionAr(b.description_ar || "");
  };

  const handleDelete = async (id: string) => {
    try {
      await api.brands.delete(id);
      await refresh();
    } catch { }
  };

  const seedDefaults = async () => {
    const defaults = [
      { name: "Hyundai", logo: "https://res.cloudinary.com/daood-alhashdis/image/upload/v1707335000/hyundai.png", category: 'both' },
      { name: "Kia", logo: "https://res.cloudinary.com/daood-alhashdis/image/upload/v1707335001/kia.png", category: 'both' },
      { name: "Genesis", logo: "https://res.cloudinary.com/daood-alhashdis/image/upload/v1707335002/genesis.png", category: 'cars' },
      { name: "Mobis", logo: "https://res.cloudinary.com/daood-alhashdis/image/upload/v1707335003/mobis.png", category: 'parts' },
    ];
    for (const b of defaults) {
      try { await api.brands.create({ name: b.name, logoUrl: b.logo, category: b.category as any }); } catch { }
    }
    await refresh();
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
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] mb-4">
                {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'الوكالات' : 'AGENCIES'}</span>
              </h1>
              <p className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-bold">
                {isRTL ? 'تحكم في وكالات السيارات والماركات' : 'Control car agencies and brands'}
              </p>
            </div>
            {brands.length === 0 && (
              <button onClick={seedDefaults} className="ml-auto px-6 py-3 rounded-xl border border-[#c9a96e]/30 bg-[#c9a96e]/10 text-[#c9a96e] text-[10px] font-black uppercase tracking-widest hover:bg-[#c9a96e] hover:text-black transition-all">
                {isRTL ? 'إضافة الماركات الافتراضية' : 'SEED DEFAULT BRANDS'}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-4 glass-card p-8 bg-white/[0.02] border-white/10 rounded-2xl h-fit sticky top-32">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-[#c9a96e]" />
                <h2 className="text-xl font-black uppercase italic tracking-wider">
                  {editingId ? (isRTL ? 'تعديل' : 'EDIT') : (isRTL ? 'إضافة' : 'ADD')}
                </h2>
              </div>
              {editingId && (
                <button onClick={resetForm} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  {isRTL ? 'إلغاء' : 'CANCEL'}
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2 italic">{isRTL ? 'اسم الوكالة / الماركة' : 'AGENCY / BRAND NAME'}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} title="Name" placeholder="..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#c9a96e]/40 transition-all" />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2 italic">{isRTL ? 'الشعار' : 'LOGO'}</label>
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center group/logo hover:border-[#c9a96e]/30 transition-all">
                    {logo ? <Image src={logo} alt="Logo" fill className="object-contain p-3" unoptimized /> : <Upload className="w-6 h-6 text-white/10" />}
                    <input type="file" title="Upload" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (eValue: React.ChangeEvent<HTMLInputElement>) => {
                      const file = eValue.target.files?.[0]; if (!file) return;
                      const fd = new FormData(); fd.append('image', file);
                      try {
                        const res = await api.upload.image(fd);
                        if (res?.success && res.url) setLogo(res.url);
                      } catch { }
                    }} />
                  </div>
                  <div className="text-[8px] text-white/20 uppercase tracking-widest leading-relaxed">
                    {isRTL ? 'انقر على المربع\nلرفع الشعار' : 'CLICK BOX TO\nUPLOAD LOGO'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2 italic">{isRTL ? 'التصنيف' : 'CATEGORY'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['cars', 'parts', 'both'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat as any)}
                      className={cn(
                        "py-3 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border",
                        category === cat ? "bg-[#c9a96e] text-black border-[#c9a96e]" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {cat === 'cars' ? (isRTL ? 'سيارات' : 'CARS') : cat === 'parts' ? (isRTL ? 'قطع' : 'PARTS') : (isRTL ? 'الكل' : 'BOTH')}
                    </button>
                  ))}
                </div>
              </div>

              {category !== 'parts' && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 bg-[#c9a96e] rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#c9a96e]">{isRTL ? 'بيانات الوكالة' : 'AGENCY DETAILS'}</span>
                  </div>
                  <div>
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={isRTL ? 'الموقع (سيئول، دبي...)' : 'Location (Seoul, Dubai...)'} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#c9a96e]/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={isRTL ? 'الهاتف' : 'Phone'} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#c9a96e]/40" />
                    <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#c9a96e]/40" />
                  </div>
                  <textarea value={isRTL ? descriptionAr : description} onChange={(e) => isRTL ? setDescriptionAr(e.target.value) : setDescription(e.target.value)} placeholder={isRTL ? 'وصف مختصر للوكالة...' : 'Short description...'} rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#c9a96e]/40 resize-none" />
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} className="w-full py-5 bg-[#c9a96e] !text-black rounded-xl text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(201,169,110,0.2)] mt-8">
                <Save className="w-4 h-4" />
                {editingId ? (isRTL ? 'تحديث البيانات' : 'UPDATE AGENCY') : (isRTL ? 'إضافة وكالة جديدة' : 'CREATE AGENCY')}
              </motion.button>
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-black uppercase italic tracking-widest">{isRTL ? 'السجلات الحالية' : 'CURRENT DIRECTORY'}</h3>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{brands.length} {isRTL ? 'مسجل' : 'ENTRIES'}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {brands.map((b: Brand) => (
                <motion.div
                  layout
                  key={b.id}
                  className="group relative glass-card p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex gap-5">
                    <div className="relative w-20 h-20 rounded-xl bg-white p-3 flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-105 shrink-0">
                      {b.logo ? (
                        <Image src={b.logo} alt={b.name} fill className="object-contain p-2" unoptimized />
                      ) : <Tag className="w-8 h-8 text-black/10" />}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-black uppercase italic leading-none mb-1">{b.name}</h4>
                          <div className="inline-block px-2 py-1 rounded bg-[#c9a96e]/10 text-[#c9a96e] text-[8px] font-black uppercase tracking-tighter border border-[#c9a96e]/20">{b.category}</div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(b)} title="Edit" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                            <Tag className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(b.id)} title="Delete" className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500/40 hover:text-red-500 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {(b.location || b.phone) && (
                        <div className="mt-4 space-y-1">
                          {b.location && <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{b.location}</div>}
                          {b.phone && <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{b.phone}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {brands.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 opacity-20 italic">
                <Tag className="w-16 h-16 mb-4" />
                <p className="text-sm uppercase tracking-[0.5em]">{isRTL ? 'لا توجد وكالات مسجلة' : 'NO AGENCIES FOUND'}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
