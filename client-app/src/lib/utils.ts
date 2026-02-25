// [[ARABIC_HEADER]] هذا الملف (client-app/src/lib/utils.ts) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
