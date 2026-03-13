'use client';

/* صفحة إدارة الوكالات (الماركات) - لوحة الأدمن */

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Upload, Save, Trash2, ArrowLeft, Tag, Car, X, Crop } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

interface BrandRaw {
  _id: string;
  name: string;
  logoUrl?: string;
  forCars?: boolean;
  forSpareParts?: boolean;
  models?: string[];
}

type Brand = {
  id: string;
  name: string;
  logo?: string;
  category: 'cars' | 'parts' | 'both';
  models: string[];
  targetShowroom: 'hm_local' | 'korean_import' | 'both';
  isActive: boolean;
};

// [[ARABIC_HEADER]] هذه الصفحة مسؤولة عن إدارة "الوكالات" (التي كانت تسمى سابقاً الماركات) - تسمح للأدمن بإضافة شعار واسم وتصنيف لكل وكالة.
export default function AdminAgenciesPage() {
  const { isRTL } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [category, setCategory] = useState<'cars' | 'parts' | 'both'>('cars');
  const [targetShowroom, setTargetShowroom] = useState<'hm_local' | 'korean_import' | 'both'>('hm_local');
  const [isActive, setIsActive] = useState(true);
  const [modelsText, setModelsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States for Image Cropping
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);

  const refresh = async () => {
    try {
      const res = await api.brands.list();
      if (res?.success) {
        const mapped = res.brands.map((b: BrandRaw) => ({
          id: b._id,
          name: b.name,
          logo: b.logoUrl,
          models: b.models || [],
          category: (b.forCars && b.forSpareParts) ? 'both' : (b.forCars ? 'cars' : 'parts'),
          targetShowroom: (b as any).targetShowroom || 'hm_local',
          isActive: (b as any).isActive !== false
        } as Brand));
        setBrands(mapped);
      }
    } catch { }
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const modelsArray = modelsText.split(',').map(s => s.trim()).filter(Boolean);
      const payload = { 
        name: name.trim(), 
        logoUrl: logo, 
        category, 
        models: modelsArray,
        targetShowroom,
        isActive
      };
      if (editingId) {
        await api.brands.update(editingId, payload);
      } else {
        await api.brands.create(payload);
      }
      resetForm();
      await refresh();
    } catch { } finally { setSaving(false); }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setLogo(""); setCategory('cars'); setModelsText("");
    setTargetShowroom('hm_local'); setIsActive(true);
    setImageSrc(null); setShowCropper(false);
  };

  const startEdit = (b: Brand) => {
    setEditingId(b.id);
    setName(b.name);
    setLogo(b.logo || "");
    setCategory(b.category);
    setTargetShowroom(b.targetShowroom);
    setIsActive(b.isActive);
    setModelsText(b.models?.join(', ') || "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? 'هل تريد حذف هذه الوكالة؟' : 'Delete this brand?')) return;
    try { await api.brands.delete(id); await refresh(); } catch { }
  };

  const categories = [
    { id: 'cars', labelAr: 'سيارات', labelEn: 'CARS', icon: Car, color: 'text-blue-400' },
  ];

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setUploading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImage) return;

      const fd = new FormData();
      fd.append('image', croppedImage);

      const res = await api.upload.image(fd);
      if (res?.success && res.url) {
        setLogo(res.url);
        setShowCropper(false);
        setImageSrc(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const getCropShape = () => {
    // both shows circular visually, but cars are always round, parts square
    return category === 'parts' ? 'rect' : 'round';
  };

  return (
    <div className="relative min-h-screen text-white">
      {/* لا نستخدم Navbar هنا لأن AdminLayout يوفر AdminNavbar تلقائياً */}
      <main className="relative z-10 pt-6 pb-24 px-6 max-w-7xl mx-auto">

        {/* Header HUD */}
        <header className="mb-12 flex items-center gap-8">
          <Link href="/admin/dashboard">
            <motion.button
              whileHover={{ scale: 1.1, x: isRTL ? 5 : -5 }}
              whileTap={{ scale: 0.9 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cinematic-neon-red/40 hover:bg-cinematic-neon-red/10 transition-all group shadow-2xl"
            >
              <ArrowLeft className={cn(
                "w-7 h-7 text-white/40 group-hover:text-cinematic-neon-red transition-colors",
                isRTL && "rotate-180"
              )} />
            </motion.button>
          </Link>

          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="h-[2px] w-12 bg-[#c9a96e] shadow-[0_0_10px_rgba(201,169,110,1)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c9a96e] italic">Admin Control</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
              {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'الوكالات' : 'AGENCIES'}</span>
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── نموذج الإضافة / التعديل (3 حقول فقط) ── */}
          <div className="lg:col-span-4">
            <div className="glass-card p-8 bg-white/[0.02] border border-white/10 rounded-2xl sticky top-32">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-[#c9a96e]" />
                  <h2 className="text-xl font-black uppercase italic tracking-wider">
                    {editingId ? (isRTL ? 'تعديل الوكالة' : 'EDIT AGENCY') : (isRTL ? 'إضافة وكالة' : 'ADD AGENCY')}
                  </h2>
                </div>
                {editingId && (
                  <button onClick={resetForm} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                    {isRTL ? 'إلغاء' : 'CANCEL'}
                  </button>
                )}
              </div>

              <div className="space-y-6">

                {/* ── 1. الشعار ── */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                    {isRTL ? '① الشعار / الصورة' : '① LOGO / IMAGE'}
                  </label>
                  <div
                    className={cn(
                      "relative w-full h-36 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#c9a96e]/40 hover:bg-[#c9a96e]/5 transition-all group",
                      uploading && "opacity-60 pointer-events-none"
                    )}
                  >
                    {logo ? (
                      <>
                        <Image src={logo} alt="Logo" fill className={cn("object-contain p-4", getCropShape() === 'round' ? 'rounded-full' : 'rounded-none')} unoptimized />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                          <span className="text-white text-xs mr-2">{isRTL ? 'تغيير الصورة' : 'Change'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-white/20" />
                        <span className="text-[10px] text-white/30 uppercase tracking-widest">
                          {uploading ? (isRTL ? 'جاري الرفع...' : 'Uploading...') : (isRTL ? 'انقر لرفع الشعار' : 'Click to upload')}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      title="Upload logo"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const src = URL.createObjectURL(file);
                        setImageSrc(src);
                        setShowCropper(true);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  {logo && !showCropper && (
                    <button onClick={() => setLogo('')} className="mt-2 text-[9px] text-red-400 hover:text-red-300 uppercase tracking-widest">
                      {isRTL ? '× حذف الصورة' : '× Remove'}
                    </button>
                  )}
                  {showCropper && imageSrc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                      <div className="bg-black border border-white/10 rounded-2xl w-full max-w-lg p-6 flex flex-col items-center">
                        <div className="flex justify-between w-full mb-4">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#c9a96e] flex items-center gap-2">
                            <Crop className="w-4 h-4" />
                            {isRTL ? 'استقطاع الصورة' : 'CROP IMAGE'}
                          </h3>
                          <button onClick={() => { setShowCropper(false); setImageSrc(null); }} className="text-white/40 hover:text-white">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="relative w-full h-80 mb-6 bg-white/5 rounded-xl overflow-hidden">
                          <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape={getCropShape()}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                          />
                        </div>

                        <div className="w-full flex items-center gap-4 mb-6">
                          <span className="text-white/50 text-[10px] uppercase font-bold">-</span>
                          <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-[#c9a96e]"
                          />
                          <span className="text-white/50 text-[10px] uppercase font-bold">+</span>
                        </div>

                        <button
                          onClick={showCroppedImage}
                          disabled={uploading}
                          className="w-full py-3 bg-[#c9a96e] text-black font-black uppercase text-xs tracking-widest rounded-xl disabled:opacity-50"
                        >
                          {uploading ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ الصورة' : 'SAVE IMAGE')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── 2. الاسم ── */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                    {isRTL ? '② اسم الوكالة / الماركة' : '② BRAND NAME'}
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    title={isRTL ? 'اسم الوكالة' : 'Brand name'}
                    placeholder={isRTL ? 'مثال: Hyundai / هيونداي' : 'e.g. Hyundai'}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-[#c9a96e]/50 transition-all placeholder:text-white/20"
                  />
                </div>

                {/* ── 3. الموديلات (اختياري) ── */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                    {isRTL ? '③ الموديلات التابعة (مفصول بفاصلة)' : '③ CAR MODELS (COMMA SEPARATED)'}
                  </label>
                  <input
                    value={modelsText}
                    onChange={(e) => setModelsText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    title={isRTL ? 'موديلات السيارات المتاحة' : 'Car Models'}
                    placeholder={isRTL ? 'مثال: كامري, كورولا, يارس' : 'e.g. Camry, Corolla, Yaris'}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-[#c9a96e]/50 transition-all placeholder:text-white/20"
                  />
                </div>

                {/* ── 4. المعرض المستهدف ── */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                    {isRTL ? '④ المعرض المستهدف' : '④ TARGET SHOWROOM'}
                  </label>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                    {(['hm_local', 'korean_import', 'both'] as const).map((source) => (
                      <button
                        key={source}
                        onClick={() => setTargetShowroom(source)}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                          targetShowroom === source
                            ? "bg-[#c9a96e] text-black shadow-lg"
                            : "text-white/40 hover:text-white/70"
                        )}
                      >
                        {isRTL 
                          ? (source === 'hm_local' ? 'محلي' : source === 'korean_import' ? 'كوري' : 'الكل')
                          : source.split('_')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── 5. حالة التفعيل ── */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {isRTL ? 'حالة التفعيل' : 'ACTIVE STATUS'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      isActive ? "bg-green-500/50" : "bg-red-500/50"
                    )}
                  >
                    <motion.div
                      animate={{ x: isActive ? (isRTL ? -20 : 20) : 0 }}
                      className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                {/* ── زر الحفظ ── */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="w-full py-5 bg-[#c9a96e] text-black rounded-xl text-[12px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(201,169,110,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <Save className="w-4 h-4" />
                  {saving
                    ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                    : editingId
                      ? (isRTL ? 'تعديل الوكالة' : 'UPDATE AGENCY')
                      : (isRTL ? 'إضافة وكالة جديدة' : 'ADD AGENCY')}
                </motion.button>
              </div>
            </div>
          </div>

          {/* ── قائمة الوكالات ── */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-black uppercase italic tracking-widest">
                {isRTL ? 'الوكالات المسجلة' : 'REGISTERED AGENCIES'}
              </h3>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {brands.length} {isRTL ? 'وكالة' : 'AGENCIES'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {brands.map((b) => {
                const catInfo = categories.find(c => c.id === b.category);
                const Icon = catInfo?.icon || Tag;
                return (
                  <motion.div
                    layout
                    key={b.id}
                    className="group relative glass-card p-5 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.05] hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* الشعار */}
                      <div className="relative w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                        {b.logo ? (
                          <Image src={b.logo} alt={b.name} fill className="object-contain p-2" unoptimized />
                        ) : (
                          <Tag className="w-7 h-7 text-black/20" />
                        )}
                      </div>

                      {/* الاسم والتصنيف */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black uppercase italic mb-1 truncate">{b.name}</h4>
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                          b.category === 'cars' ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                            : b.category === 'parts' ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                              : "bg-[#c9a96e]/10 border-[#c9a96e]/30 text-[#c9a96e]"
                        )}>
                          <Icon className="w-3 h-3" />
                          <span>{isRTL ? catInfo?.labelAr : catInfo?.labelEn}</span>
                        </div>
                      </div>

                      {/* أزرار الإجراءات */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => startEdit(b)}
                          title={isRTL ? 'تعديل' : 'Edit'}
                          className="w-9 h-9 rounded-xl bg-[#c9a96e]/10 hover:bg-[#c9a96e]/30 flex items-center justify-center text-[#c9a96e] transition-all border border-[#c9a96e]/20"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          title={isRTL ? 'حذف' : 'Delete'}
                          className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all border border-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {brands.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 opacity-20 italic">
                <Tag className="w-16 h-16 mb-4" />
                <p className="text-sm uppercase tracking-[0.5em]">
                  {isRTL ? 'لا توجد وكالات - أضف أول وكالة' : 'NO AGENCIES YET — ADD YOUR FIRST'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
