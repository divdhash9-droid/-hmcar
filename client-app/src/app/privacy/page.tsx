'use client';

import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { Shield, Lock, Eye, Bell, Trash2, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
    const { isRTL } = useLanguage();

    const lastUpdated = "8 مارس 2026";
    const lastUpdatedEn = "March 8, 2026";

    const sections = isRTL ? [
        {
            icon: Eye,
            title: "المعلومات التي نجمعها",
            content: [
                "المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف عند التسجيل.",
                "بيانات الاستخدام: الصفحات المزارة، مدة الجلسة، الجهاز المستخدم.",
                "بيانات المزاد: تاريخ المزايدات، الطلبات، المفضلة.",
                "بيانات الجهاز: نوع الجهاز، نظام التشغيل، معرّف الجهاز.",
            ]
        },
        {
            icon: Lock,
            title: "كيف نستخدم معلوماتك",
            content: [
                "تشغيل حسابك وتقديم خدمات المنصة.",
                "إرسال إشعارات عن المزادات والعروض المتعلقة بتنبيهاتك الذكية.",
                "تحسين تجربة المستخدم وأداء التطبيق.",
                "التواصل معك بشأن طلباتك ومعاملاتك.",
                "الامتثال للمتطلبات القانونية في المملكة العربية السعودية.",
            ]
        },
        {
            icon: Shield,
            title: "حماية بياناتك",
            content: [
                "نستخدم تشفير AES-256 لحماية جميع البيانات المخزنة.",
                "الاتصالات مشفرة بـ TLS/SSL.",
                "لا نبيع أو نؤجر بياناتك الشخصية لأطراف ثالثة أبداً.",
                "يُسمح بالوصول للبيانات فقط للموظفين المصرح لهم.",
            ]
        },
        {
            icon: Bell,
            title: "الإشعارات",
            content: [
                "قد نرسل إشعارات Push عبر التطبيق للتنبيهات المهمة.",
                "يمكنك تعطيل الإشعارات من إعدادات التطبيق أو جهازك.",
                "لا نرسل إشعارات تسويقية دون موافقتك الصريحة.",
            ]
        },
        {
            icon: Trash2,
            title: "حقوقك",
            content: [
                "حق الوصول: يمكنك طلب نسخة من بياناتك في أي وقت.",
                "حق التصحيح: يمكنك تعديل بياناتك من صفحة الملف الشخصي.",
                "حق الحذف: يمكنك طلب حذف حسابك وبياناتك نهائياً.",
                "حق الاعتراض: يمكنك الاعتراض على أي معالجة لبياناتك.",
            ]
        },
        {
            icon: Mail,
            title: "التواصل معنا",
            content: [
                "البريد الإلكتروني: privacy@hmcar.app",
                "للشكاوى المتعلقة بالخصوصية: yتواصل معنا خلال 30 يوماً.",
                "الشركة: HM CAR Platform - المملكة العربية السعودية",
            ]
        },
    ] : [
        {
            icon: Eye,
            title: "Information We Collect",
            content: [
                "Personal info: name, email, phone number upon registration.",
                "Usage data: visited pages, session duration, device used.",
                "Auction data: bidding history, orders, favorites.",
                "Device data: device type, OS, device identifier.",
            ]
        },
        {
            icon: Lock,
            title: "How We Use Your Information",
            content: [
                "To operate your account and provide platform services.",
                "To send notifications about auctions and Smart Alert matches.",
                "To improve user experience and app performance.",
                "To communicate regarding your orders and transactions.",
                "To comply with legal requirements in Saudi Arabia.",
            ]
        },
        {
            icon: Shield,
            title: "Data Protection",
            content: [
                "We use AES-256 encryption to protect all stored data.",
                "All communications are secured with TLS/SSL.",
                "We never sell or rent your personal data to third parties.",
                "Data access is restricted to authorized personnel only.",
            ]
        },
        {
            icon: Bell,
            title: "Notifications",
            content: [
                "We may send Push notifications for important alerts.",
                "You can disable notifications from the app or device settings.",
                "We do not send marketing notifications without your explicit consent.",
            ]
        },
        {
            icon: Trash2,
            title: "Your Rights",
            content: [
                "Right of Access: request a copy of your data at any time.",
                "Right of Rectification: edit your data from the Profile page.",
                "Right of Deletion: request permanent deletion of your account and data.",
                "Right to Object: object to any processing of your personal data.",
            ]
        },
        {
            icon: Mail,
            title: "Contact Us",
            content: [
                "Email: privacy@hmcar.app",
                "Privacy complaints: we respond within 30 days.",
                "Company: HM CAR Platform – Saudi Arabia",
            ]
        },
    ];

    return (
        <div className={cn("min-h-screen bg-[#080809] text-white", isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-3xl mx-auto px-5 lg:px-8 py-16">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 mb-6">
                        <Shield className="w-8 h-8 text-[#c9a96e]" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-white mb-3">
                        {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
                    </h1>
                    <p className="text-white/40 text-sm">
                        {isRTL ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdatedEn}`}
                    </p>

                    {/* Intro */}
                    <p className="mt-6 text-white/60 text-[15px] leading-relaxed max-w-2xl mx-auto">
                        {isRTL
                            ? "نحن في HM CAR نلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع معلوماتك واستخدامها وحمايتها عند استخدامك لتطبيقنا وموقعنا."
                            : "At HM CAR, we are committed to protecting your privacy. This policy explains how we collect, use, and protect your information when you use our app and website."
                        }
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, i) => {
                        const Icon = section.icon;
                        return (
                            <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                                <div className={cn("flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-b border-white/[0.05]", isRTL && "flex-row-reverse")}>
                                    <div className="w-8 h-8 rounded-xl bg-[#c9a96e]/10 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-[#c9a96e]" strokeWidth={1.8} />
                                    </div>
                                    <h2 className="text-[15px] font-bold text-white">{section.title}</h2>
                                </div>
                                <ul className="px-6 py-4 space-y-3">
                                    {section.content.map((item, j) => (
                                        <li key={j} className={cn("flex items-start gap-3 text-[14px] text-white/60 leading-relaxed", isRTL && "flex-row-reverse text-right")}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/50 mt-2 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-10 p-6 rounded-2xl bg-[#c9a96e]/[0.05] border border-[#c9a96e]/15 text-center">
                    <p className="text-[13px] text-white/40">
                        {isRTL
                            ? "باستخدامك لتطبيق HM CAR، فإنك توافق على سياسة الخصوصية هذه. يحق لنا تحديثها في أي وقت مع إشعارك بذلك."
                            : "By using HM CAR, you agree to this Privacy Policy. We may update it at any time and will notify you of changes."
                        }
                    </p>
                    <a href="mailto:privacy@hmcar.app" className="inline-block mt-3 text-[#c9a96e] text-[13px] font-semibold hover:underline">
                        privacy@hmcar.app
                    </a>
                </div>

            </div>
        </div>
    );
}
