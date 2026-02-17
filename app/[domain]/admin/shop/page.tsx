import { getAdminSiteConfig } from '@/app/actions/settings';
import { ShopClient } from './ShopClient';
import { SiteConfig } from '@/types/common';

export default async function ShopSettingsPage({ params }: { readonly params: Promise<{ domain: string }> }) {
    await params; // Consume params to avoid unused vars if needed, or remove
    const rawConfig = await getAdminSiteConfig();

    // Cast rigid types to compatible interface
    const config = {
        ...rawConfig,
        certificates: (rawConfig.certificates || []).map((c: string | { image: string; link?: string }) =>
            typeof c === 'string' ? { image: c, link: '' } : c
        ) as SiteConfig['certificates']
    } as unknown as SiteConfig;

    return (
        <ShopClient initialConfig={config} />
    );
}
