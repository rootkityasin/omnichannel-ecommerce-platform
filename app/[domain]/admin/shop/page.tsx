import { getSiteConfig } from '@/app/actions/settings';
import { ShopClient } from './ShopClient';

export default async function ShopSettingsPage({ params }: { params: { domain: string } }) {
    const { domain } = await params;
    const config = await getSiteConfig(domain);

    return (
        <ShopClient initialConfig={config} />
    );
}
