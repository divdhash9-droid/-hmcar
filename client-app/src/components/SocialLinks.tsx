'use client';

/**
 * روابط التواصل الاجتماعي (Social Links)
 * يعرض أيقونات تفاعلية لجميع حسابات التواصل الاجتماعي المضافة من قبل المشرف.
 * يدعم فتح الروابط في علامات تبويب جديدة واستخدام صور مخصصة للأيقونات.
 */

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    MessageCircle,
    Instagram,
    Youtube,
    Facebook,
    Linkedin,
    Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// أيقونات مخصصة
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.029-.06-.045-.135-.045-.209-.015-.24.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

interface SocialLinksProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    vertical?: boolean;
}

// لا توجد قيم افتراضية - فقط الروابط التي يضيفها الأدمن تظهر
const emptySocialLinks = {
    whatsapp: '',
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: '',
    tiktok: '',
    snapchat: '',
    telegram: '',
    linkedin: ''
};

export default function SocialLinks({
    className,
    size = 'md',
    vertical = false
}: SocialLinksProps) {
    const [socialLinks, setSocialLinks] = useState(emptySocialLinks);

    const loadSocialLinks = async () => {
        try {
            // جلب روابط التواصل الاجتماعي من الإعدادات العامة للموقع
            const response = await api.settings.getPublic();
            if (response.success && response.data.socialLinks) {
                // دمج الروابط المجلوبة مع القائمة الفارغة لضمان وجود جميع الحقول
                setSocialLinks({ ...emptySocialLinks, ...response.data.socialLinks });
            } else {
                setSocialLinks(emptySocialLinks);
            }
        } catch {
            console.error('Failed to load social links');
            setSocialLinks(emptySocialLinks);
        }
    };

    useEffect(() => {
        loadSocialLinks();
    }, []);

    const sizeClasses = {
        sm: 'w-8 h-8 md:w-10 md:h-10',
        md: 'w-10 h-10 md:w-12 md:h-12',
        lg: 'w-12 h-12 md:w-14 md:h-14'
    };

    const iconSizes = {
        sm: 'w-4 h-4 md:w-5 md:h-5',
        md: 'w-5 h-5 md:w-6 md:h-6',
        lg: 'w-6 h-6 md:w-7 md:h-7'
    };

    // خريطة لرسم الأيقونات بناءً على الصور المخصصة التي وفرها المستخدم
    const customIcons: { [key: string]: string } = {
        whatsapp: '/images/icons/whatsapp.jpg',
        instagram: '/images/icons/instagram.jpg',
        facebook: '/images/icons/facebook.jpg',
        tiktok: '/images/icons/tiktok.jpg',
    };

    const links = [
        {
            key: 'whatsapp',
            icon: MessageCircle,
            color: 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20',
            href: socialLinks.whatsapp ? `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}` : null,
            label: 'WhatsApp'
        },
        {
            key: 'instagram',
            icon: Instagram,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.instagram,
            label: 'Instagram'
        },
        {
            key: 'twitter',
            icon: XIcon,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.twitter,
            label: 'X'
        },
        {
            key: 'facebook',
            icon: Facebook,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.facebook,
            label: 'Facebook'
        },
        {
            key: 'youtube',
            icon: Youtube,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.youtube,
            label: 'YouTube'
        },
        {
            key: 'tiktok',
            icon: TikTokIcon,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.tiktok,
            label: 'TikTok'
        },
        {
            key: 'snapchat',
            icon: SnapchatIcon,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.snapchat ? `https://snapchat.com/add/${socialLinks.snapchat}` : null,
            label: 'Snapchat'
        },
        {
            key: 'telegram',
            icon: Send,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.telegram,
            label: 'Telegram'
        },
        {
            key: 'linkedin',
            icon: Linkedin,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10',
            href: socialLinks.linkedin,
            label: 'LinkedIn'
        }
    ].filter(link => link.href);

    if (links.length === 0) return null;

    return (
        <div className={cn(
            "flex gap-3",
            vertical ? "flex-col" : "flex-row flex-wrap",
            className
        )}>
            {links.map((link, i) => (
                <motion.a
                    key={link.key}
                    href={link.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "flex items-center justify-center rounded-2xl transition-all shadow-2xl overflow-hidden",
                        sizeClasses[size],
                        link.color
                    )}
                    title={link.label}
                >
                    {/* استخدام الصور المخصصة إذا كانت موجودة، وإلا العودة للأيقونة الافتراضية */}
                    {customIcons[link.key] ? (
                        <img
                            src={customIcons[link.key]}
                            alt={link.label}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <link.icon className={iconSizes[size]} />
                    )}
                </motion.a>
            ))}
        </div>
    );
}

/**
 * الزر العائم للواتساب (WhatsApp Floating Action Button)
 * يظهر في زاوية الشاشة ليتيح للمستخدم التواصل المباشر والسريع مع الدعم الفني.
 */
export function WhatsAppFAB() {
    const [whatsappNumber, setWhatsappNumber] = useState('+967781007805');

    useEffect(() => {
        api.settings.getPublic().then((res: { success: boolean; data: { socialLinks?: { whatsapp?: string } } }) => {
            if (res?.success && res.data.socialLinks?.whatsapp) {
                setWhatsappNumber(res.data.socialLinks.whatsapp);
            }
        }).catch(() => { });
    }, []);

    return (
        <motion.a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:shadow-[0_0_40px_rgba(34,197,94,0.7)] transition-shadow border-2 border-white/20"
        >
            <img src="/images/icons/whatsapp.jpg" alt="WhatsApp" className="w-full h-full object-cover" />
        </motion.a>
    );
}
