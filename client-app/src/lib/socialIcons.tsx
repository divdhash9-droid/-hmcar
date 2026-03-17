'use client';

/**
 * مكتبة أيقونات التواصل الاجتماعي (Social Icons Library)
 * توفر مجموعة من الأيقونات المخصصة لمنصات التواصل الاجتماعي المختلفة.
 * تدعم Instagram, X (Twitter), TikTok, WhatsApp, Facebook, YouTube, Snapchat, Telegram, LinkedIn.
 */
import React from "react";

type IconProps = { className?: string };

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${className || ""}`}>
    <span className="text-[10px] font-black">{children}</span>
  </div>
);

// خريطة الأيقونات - تربط اسم المنصة بالمكون البرمجي الخاص بالأيقونة
export const SOCIAL_ICON_MAP: Record<string, React.FC<IconProps>> = {
  instagram: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" className="text-pink-500" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" />
    </svg>
  ),
  x: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  ),
  tiktok: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 8a5 5 0 1 0 5 5V5c1.5 1.5 3 2 5 2" />
    </svg>
  ),
  whatsapp: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 11a8 8 0 1 1-15.5 3L3 21l3-1.5A8 8 0 1 1 20 11z" />
      <path d="M8 10c2 3 4 4 6 5l2-2" />
    </svg>
  ),
  facebook: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 8h3V5h-3a3 3 0 0 0-3 3v3H8v3h3v6h3v-6h3l1-3h-4V8z" />
    </svg>
  ),
  youtube: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="10" rx="4" />
      <path d="M10 10l5 3-5 3z" />
    </svg>
  ),
  snapchat: ({ className }) => <Badge className={`bg-yellow-400 text-black ${className || ""}`}>SC</Badge>,
  telegram: ({ className }) => <Badge className={`bg-sky-500 text-black ${className || ""}`}>TG</Badge>,
  twitter: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  ),
  linkedin: ({ className }) => (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
};

/**
 * دالة مساعدة للحصول على الأيقونة بناءً على اسم المنصة
 */
export const getSocialIcon = (platform?: string): React.FC<IconProps> | null => {
  if (!platform) return null;
  const key = platform.trim().toLowerCase();
  return SOCIAL_ICON_MAP[key] || null;
};
