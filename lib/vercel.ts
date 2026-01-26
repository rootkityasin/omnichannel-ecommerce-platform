export const VERCEL_API_URL = "https://api.vercel.com";

const getHeaders = () => ({
    Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}`,
    "Content-Type": "application/json",
});

const getBaseUrl = (path: string) => {
    const teamId = process.env.VERCEL_TEAM_ID;
    const url = new URL(`${VERCEL_API_URL}${path}`);
    if (teamId) {
        url.searchParams.append("teamId", teamId);
    }
    return url.toString();
};

/**
 * Adds a custom domain to the Vercel project.
 * @param domain The domain name to add (e.g., example.com)
 */
export async function addDomainToVercel(domain: string) {
    return await fetch(
        getBaseUrl(`/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`),
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ name: domain }),
        }
    ).then((res) => res.json());
}

/**
 * Removes a custom domain from the Vercel project.
 * @param domain The domain name to remove
 */
export async function removeDomainFromVercel(domain: string) {
    return await fetch(
        getBaseUrl(`/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`),
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}` },
        }
    ).then((res) => res.json());
}

/**
 * Getting the domain config to check misconfiguration.
 * @param domain The domain name to check
 */
export async function getDomainConfig(domain: string) {
    return await fetch(
        getBaseUrl(`/v6/domains/${domain}/config`),
        {
            method: "GET",
            headers: { Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}` },
        }
    ).then((res) => res.json());
}

/**
 * Verifies a custom domain on Vercel.
 * @param domain The domain name to verify
 */
export async function verifyDomainOnVercel(domain: string) {
    return await fetch(
        getBaseUrl(`/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}/verify`),
        {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}` },
        }
    ).then((res) => res.json());
}

/**
 * Checks the status of a domain in the project.
 * Useful for polling until it's valid.
 */
export async function getDomainResponse(domain: string) {
    return await fetch(
        getBaseUrl(`/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`),
        {
            method: "GET",
            headers: { Authorization: `Bearer ${process.env.VERCEL_AUTH_TOKEN}` },
        }
    ).then((res) => res.json());
}
