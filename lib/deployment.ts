type DeploymentMode = "platform" | "tenant";

const normalizeMode = (value: string | undefined) => {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "platform" || normalized === "tenant") return normalized;
  return undefined;
};

const isProduction = process.env.NODE_ENV === "production";
const envMode = normalizeMode(process.env.DEPLOYMENT_MODE);

export const deploymentMode: DeploymentMode =
  envMode ?? (isProduction ? "tenant" : "platform");

export const isPlatformMode = deploymentMode === "platform";
export const isTenantMode = deploymentMode === "tenant";

export const isSuperAdminEnabled =
  process.env.SUPER_ADMIN_ENABLED === "true" ||
  (!isProduction && process.env.SUPER_ADMIN_ENABLED !== "false");

export const getRootDomain = () =>
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
