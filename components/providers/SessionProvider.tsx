"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useMemo } from "react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const basePath = useMemo(() => {
    if (typeof window === "undefined") return "/api/auth";
    const host = window.location.host;
    const pathname = window.location.pathname;
    return host.startsWith("app.") || pathname.startsWith("/app")
      ? "/api/platform-auth"
      : "/api/auth";
  }, []);

  return (
    <NextAuthSessionProvider basePath={basePath}>
      {children}
    </NextAuthSessionProvider>
  );
}
