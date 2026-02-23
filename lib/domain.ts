const removePort = (host: string) => host.split(":")[0];

export const normalizeHost = (host?: string) => {
  if (!host) return "";
  const cleaned = removePort(host.trim().toLowerCase());
  return cleaned.startsWith("www.") ? cleaned.slice(4) : cleaned;
};
