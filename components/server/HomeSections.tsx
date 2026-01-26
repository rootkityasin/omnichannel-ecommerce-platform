import { getHomeSections } from '@/app/actions/section';
import { SectionList } from '@/components/client/SectionList';

export async function HomeSections({ domain }: { domain?: string }) {
    // This fetch is now isolated to this component
    // It will not block the main page rendering
    const sections = await getHomeSections(domain);

    return <SectionList sections={JSON.parse(JSON.stringify(sections))} />;
}
