"use client";

/**
 * المعرض العائم (Floating Gallery)
 * يعرض سيارات مميزة في شريط أفقي متحرك بشكل لانهائي.
 * يتم تكرار العناصر لضمان استمرارية الحركة دون انقطاع.
 */

import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

const cars = [
    { id: 1, name: "Mercedes G-Wagon", price: "850,000 SAR", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2670&auto=format&fit=crop" },
    { id: 2, name: "Porsche 911 GT3", price: "920,000 SAR", image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2670&auto=format&fit=crop" },
    { id: 3, name: "BMW M8 Competition", price: "720,000 SAR", image: "https://images.unsplash.com/photo-1555215695-3004980adade?q=80&w=2670&auto=format&fit=crop" },
    { id: 4, name: "Audi RS e-tron GT", price: "680,000 SAR", image: "https://images.unsplash.com/photo-1603584173870-7b299f589192?q=80&w=2670&auto=format&fit=crop" },
    { id: 5, name: "Lamborghini Urus", price: "1,200,000 SAR", image: "https://images.unsplash.com/photo-1678142759546-608670494481?q=80&w=2670&auto=format&fit=crop" },
];

export default function FloatingGallery() {
    const { isRTL } = useLanguage();

    // إنشاء حلقة سلسة عن طريق تكرار المحتوى (ثلاث نسخ لضمان التغطية الكاملة للشاشة أثناء الحركة)
    const displayCars = [...cars, ...cars, ...cars];

    return (
        <section className="py-24 bg-transparent overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-transparent to-transparent z-10 pointer-events-none" />

            <div className="text-center mb-16 relative z-20">
                <h2 className="text-3xl md:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-widest">
                    {isRTL ? "المعرض المميز" : "Exclusive Showroom"}
                </h2>
            </div>

            {/* Infinite Scroll Container */}
            <div className="w-full overflow-hidden">
                <div className={cn(
                    "flex gap-8 w-max hover:play-state-paused",
                    "animate-scroll-gallery"
                )}
                    style={{
                        // عكس اتجاه الحركة في حالة اللغة العربية (RTL)
                        animationDirection: isRTL ? 'reverse' : 'normal'
                    }}
                >
                    {displayCars.map((car, idx) => (
                        <div
                            key={`${car.id}-${idx}`}
                            className="relative min-w-[300px] md:min-w-[400px] aspect-[4/5] rounded-[2rem] overflow-hidden group cursor-pointer border border-white/5 hover:border-[#c9a96e] transition-all duration-500"
                        >
                            <Image
                                src={car.image}
                                alt={car.name}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                            <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black/90 to-transparent">
                                <h3 className="text-2xl font-bold text-white mb-1">{car.name}</h3>
                                <p className="text-[#c9a96e] font-bold text-lg">{car.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        @keyframes scroll-gallery {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); } /* Move by 1/3 since we triplicated */
        }
        .animate-scroll-gallery {
          animation: scroll-gallery 40s linear infinite;
        }
        .hover\:play-state-paused:hover {
          animation-play-state: paused;
        }
      `}</style>
        </section>
    );
}
