import { MetadataRoute } from 'next';
import { getSiteConfig } from '@/app/actions/settings';

export default async function robots({ params }: { params: Promise<{ domain: string }> }): Promise<MetadataRoute.Robots> {
    const { domain } = await params;
    const config = await getSiteConfig(domain);
    const baseUrl = config.canonicalUrl || `https://${domain}`;

    const rules = config.robots?.split(',').map(r => r.trim()) || ['index', 'follow'];
    const isAllowed = rules.includes('index') && rules.includes('follow');

    return {
        rules: {
            userAgent: '*',
            allow: isAllowed ? '/' : undefined,
            disallow: isAllowed ? ['/admin/', '/api/'] : '/',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
