'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";
import Navbar from "@/components/Navbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";

export default function SupportPage() {
  const { t, isRTL } = useLanguage();
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  const submit = async () => {
    if (!msg.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v2/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "support",
          title: "Support Ticket",
          content: msg,
          priority: "high"
        })
      });
      if (!res.ok) throw new Error("failed");
      setStatus("ok");
    } catch {
      try {
        const raw = localStorage.getItem("hm_support_messages");
        const arr = raw ? JSON.parse(raw) : [];
        arr.push({ content: msg, createdAt: Date.now() });
        localStorage.setItem("hm_support_messages", JSON.stringify(arr));
        setStatus("ok");
      } catch {
        setStatus("err");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 sm:px-12 lg:px-20 py-24" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-cinematic-neon-blue" />
          <h1 className="text-xl font-black uppercase tracking-[0.4em]">{t('supportChat')}</h1>
        </div>

        <div className="glass-card p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder={t('describeIssue')}
            className={`w-full h-40 bg-white/[0.04] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-cinematic-neon-blue/40 ${isRTL ? "text-right" : "text-left"}`}
          />
          <div className="flex justify-between items-center mt-4">
            <Link href="/" className="text-white/40 hover:text-white text-xs">{isRTL ? "العودة للرئيسية" : "Back to Home"}</Link>
            <motion.button
              onClick={submit}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-black uppercase tracking-[0.3em] hover:bg-cinematic-neon-blue hover:text-white transition-all"
            >
              <Send className="w-4 h-4" /> {t('send')}
            </motion.button>
          </div>
          {status === "ok" && (
            <div className="mt-4 text-cinematic-neon-blue text-xs font-black uppercase tracking-[0.3em]">
              {t('submitted')}
            </div>
          )}
          {status === "err" && (
            <div className="mt-4 text-cinematic-neon-red text-xs font-black uppercase tracking-[0.3em]">
              {t('failed')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
