'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import ReactGA from 'react-ga4';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
    
    if (GA_MEASUREMENT_ID) {
      ReactGA.initialize(GA_MEASUREMENT_ID);
      console.log('✅ Google Analytics 4 Initialized');
    }
  }, []);

  useEffect(() => {
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
    if (GA_MEASUREMENT_ID) {
      const url = pathname + searchParams.toString();
      ReactGA.send({ hitType: 'pageview', page: url });
    }
  }, [pathname, searchParams]);

  return null;
}
