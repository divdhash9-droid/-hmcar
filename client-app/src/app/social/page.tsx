'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Link as LinkIcon, Globe } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { getSocialIcon } from "@/lib/socialIcons";
import { api } from "@/lib/api";

type SocialConfig = {
  whatsapp?: string;
  links: { platform: string; url: string }[];
};

export default function PublicSocialPage() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<SocialConfig>({ whatsapp: "", links: [] });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await api.settings.getPublic();
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

  return (
    <div className={cn("min-h-screen bg-black text-white px-6 sm:px-12 lg:px-20 py-24")}>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center gap-4">
          <Globe className="w-7 h-7 text-cinematic-neon-blue" />
          <h1 className="text-2xl font-black uppercase tracking-[0.4em]">
            {t('followUs')}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {config.whatsapp && (
            <Link href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank">
              <motion.div whileHover={{ scale: 1.03 }} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-4">
                {(() => {
                  const Icon = getSocialIcon("whatsapp");
                  return Icon ? <Icon className="w-7 h-7 text-cinematic-neon-green" /> : <MessageCircle className="w-7 h-7 text-cinematic-neon-green" />;
                })()}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.4em]">WhatsApp</div>
                  <div className="text-sm text-white/60">{config.whatsapp}</div>
                </div>
              </motion.div>
            </Link>
          )}

          {config.links.map((item, idx) => (
            <Link href={item.url} target="_blank" key={idx}>
              <motion.div whileHover={{ scale: 1.03 }} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-4">
                {(() => {
                  const Icon = getSocialIcon(item.platform);
                  return Icon ? <Icon className="w-7 h-7 text-cinematic-neon-blue" /> : <LinkIcon className="w-7 h-7 text-cinematic-neon-blue" />;
                })()}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.4em]">{item.platform || t('social')}</div>
                  <div className="text-sm text-white/60">{item.url}</div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="text-white/40 text-sm">
          <Link href="/admin/social" className="underline hover:text-white">
            {t('socialSettings')}
          </Link>
        </div>
      </div>
    </div>
  );
}
