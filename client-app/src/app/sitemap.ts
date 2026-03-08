import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://car-auction-sand.vercel.app';
    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/showroom`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/parts`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/auctions`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
        { url: `${baseUrl}/concierge`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${baseUrl}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${baseUrl}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    ];


    return staticPages;
}
