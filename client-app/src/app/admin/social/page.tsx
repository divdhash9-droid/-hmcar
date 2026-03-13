'use client';

import { useEffect, useState } from "react";
import { MessageCircle, Save, Trash2, CheckCircle2, SquarePen, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { getSocialIcon } from "@/lib/socialIcons";
import { api } from "@/lib/api";

// Social config uses simple runtime-shape

function AdminSocialSettings() {
  const { t, isRTL } = useLanguage();
  const [config, setConfig] = useState({ whatsapp: "", links: [] as Array<{ platform: string; url: string }> });
  const [saved, setSaved] = useState(false);
  const platforms = [
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'twitter', label: 'X' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'snapchat', label: 'Snapchat' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'linkedin', label: 'LinkedIn' },
  ];

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await api.settings.getAll();
        if (response.success && response.data.socialLinks) {
          const sl = response.data.socialLinks;
          const linksArray = Object.entries(sl)
            .filter(([k, v]) => k !== 'whatsapp' && v)
            .map(([k, v]) => ({ platform: k, url: v as string }));

          setConfig({
            whatsapp: sl.whatsapp || "",
            links: linksArray
          });
        }
      } catch (err) {
        console.error("Failed to fetch social links", err);
      }
    };
    fetchLinks();
  }, []);

  const handleSave = async () => {
    try {
      // Convert links array back to object for schema
      const socialLinks: Record<string, string> = { whatsapp: config.whatsapp };
      config.links.forEach(l => {
        if (l.platform && l.url) {
          socialLinks[l.platform.toLowerCase()] = l.url;
        }
      });

      const response = await api.settings.updateSocialLinks({ socialLinks });
      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save social links", err);
    }
  };

  const addLink = () => {
    setConfig(prev => ({ ...prev, links: [...prev.links, { platform: "", url: "" }] }));
  };

  const setPlatformUrl = (platformKey: string, url: string) => {
    const key = platformKey.toLowerCase();
    setConfig(prev => {
      const next = [...prev.links];
      const idx = next.findIndex(l => (l.platform || '').toLowerCase() === key);
      if (idx >= 0) next[idx] = { ...next[idx], platform: key, url };
      else next.push({ platform: key, url });
      return { ...prev, links: next };
    });
  };

  const removePlatformUrl = (platformKey: string) => {
    const key = platformKey.toLowerCase();
    setConfig(prev => ({ ...prev, links: prev.links.filter(l => (l.platform || '').toLowerCase() !== key) }));
  };

  const removeLink = (idx: number) => {
    setConfig(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }));
  };

  return (
    <div className={cn("min-h-screen bg-black text-white px-6 sm:px-12 lg:px-20 py-24")}>
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigation HUD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-8">
                <Link href="/admin/dashboard">
                    <motion.button
                        whileHover={{ scale: 1.1, x: isRTL ? 5 : -5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cinematic-neon-blue/40 hover:bg-cinematic-neon-blue/10 transition-all group shadow-2xl"
                    >
                        <ArrowLeft className={cn(
                            "w-7 h-7 text-white/40 group-hover:text-cinematic-neon-blue transition-colors",
                            isRTL && "rotate-180"
                        )} />
                    </motion.button>
                </Link>

                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-[2px] w-12 bg-cinematic-neon-blue shadow-[0_0_15px_rgba(0,150,255,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">HQ Control Settings</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[0.4em]">
                        {t('socialSettings')}
                    </h1>
                </div>
            </div>
        </div>

        <div className="glass-card p-8 bg-white/[0.02] border border-white/10 rounded-2xl space-y-6">
          <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-2">
            {t('whatsappNumber')}
          </label>
          <input
            type="tel"
            placeholder={isRTL ? "مثال: +9665xxxxxxxx" : "+9665xxxxxxxx"}
            value={config.whatsapp || ""}
            onChange={(e) => setConfig(prev => ({ ...prev, whatsapp: e.target.value }))}
            className={cn("w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-cinematic-neon-blue/40", isRTL ? "text-right" : "text-left")}
          />
        </div>

        <div className="glass-card p-8 bg-white/[0.02] border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-black uppercase tracking-[0.6em]">{t('socialLinks')}</h2>
            <button
              onClick={addLink}
              className="px-4 py-2 rounded-xl bg-cinematic-neon-blue/20 text-cinematic-neon-blue border border-cinematic-neon-blue/30 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              {t('addLink')}
            </button>
          </div>

          <div className="space-y-4">
            {platforms.map((p) => {
              const Icon = getSocialIcon(p.key) as React.ComponentType<{ className?: string }>;
              const val = (config.links.find(l => (l.platform || '').toLowerCase() === p.key) || {}).url || "";
              return (
                <div key={p.key} className="flex items-center gap-4 bg-white/[0.02] border border-white/10 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                    {Icon ? <Icon className="w-6 h-6 text-white/80" /> : <MessageCircle className="w-6 h-6 text-white/60" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black">{p.label}</div>
                    <input
                      type="url"
                      placeholder={isRTL ? "https://..." : "https://..."}
                      value={val}
                      onChange={(e) => setPlatformUrl(p.key, e.target.value)}
                      className={cn("mt-2 w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cinematic-neon-blue/40", isRTL ? "text-right" : "text-left")}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 text-[9px] font-black uppercase"
                    >
                      <SquarePen className="w-3 h-3" />
                      {isRTL ? 'تعديل' : 'EDIT'}
                    </button>
                    <button
                      onClick={() => removePlatformUrl(p.key)}
                      className="px-3 py-2 rounded-lg bg-cinematic-neon-red/10 text-cinematic-neon-red border border-cinematic-neon-red/20 hover:bg-cinematic-neon-red hover:text-white transition-all flex items-center gap-1 text-[9px] font-black uppercase"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isRTL ? 'حذف' : 'REMOVE'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-black font-black uppercase tracking-[0.3em] hover:bg-cinematic-neon-blue hover:text-white transition-all"
          >
            <Save className="w-5 h-5" /> {t('saveChanges')}
          </button>
          {saved && (
            <div className="flex items-center gap-2 text-cinematic-neon-blue">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">OK</span>
            </div>
          )}
        </div>

        <div className="text-white/40 text-sm">
          <Link href="/social" className="underline hover:text-white">
            {t('publicSocialPage')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminSocialSettings;
