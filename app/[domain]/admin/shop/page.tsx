import { getAdminSiteConfig } from '@/app/actions/settings';
import { ShopClient } from './ShopClient';

export default async function ShopSettingsPage({ params }: { params: Promise<{ domain: string }> }) {
    await params; // Consume params to avoid unused vars if needed, or remove
    const config = await getAdminSiteConfig();

    return (
        <ShopClient initialConfig={config} />
    );
}
