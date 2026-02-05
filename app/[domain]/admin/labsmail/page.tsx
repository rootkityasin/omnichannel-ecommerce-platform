import { getLabsmailConfig } from '@/app/actions/labsmail';
import LabsmailIntegrationClient from './LabsmailIntegrationClient';

export default async function LabsmailPage() {
    const config = await getLabsmailConfig();
    return <LabsmailIntegrationClient initialConfig={config} />;
}
