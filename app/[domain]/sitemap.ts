import { MetadataRoute } from 'next';
import { getAdminProducts } from '@/app/actions/product';
import { getCategories } from '@/app/actions/category';
import { getSiteConfig } from '@/app/actions/settings';

export default async function sitemap({ params }: { params: Promise<{ domain: string }> }): Promise<MetadataRoute.Sitemap> {
    const { domain } = await params;
    const protocol = 'https';
    // Use configured canonical URL or fallback to domain
    const config = await getSiteConfig(domain);
    const baseUrl = config.canonicalUrl || `${protocol}://${domain}`;

    // 1. Static Routes
    const routes = [
        '',
        '/menu',
        '/story', // About/Story page
        '/account/login',
        '/account/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Fetch Dynamic Data
    const [products, categories] = await Promise.all([
        getAdminProducts(domain),
        getCategories(domain)
    ]);

    // 3. Product Routes
    const productRoutes = products.map((product) => ({
        url: `${baseUrl}/buy/${product.id}`,
        lastModified: new Date(product.updatedAt || product.createdAt).toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.9, // High priority for products
    }));

    // 4. Category Routes (via Menu Filter)
    const categoryRoutes = categories.map((category) => ({
        url: `${baseUrl}/menu?category=${category.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...routes, ...productRoutes, ...categoryRoutes];
}
