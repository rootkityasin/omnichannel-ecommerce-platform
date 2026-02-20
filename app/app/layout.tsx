import { platformAuth } from "@/auth.platform";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { isPlatformMode, isSuperAdminEnabled } from "@/lib/deployment";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isPlatformMode || !isSuperAdminEnabled) {
    notFound();
  }
  const session = await platformAuth();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // If not logged in and not on login page, redirect to login
  if (!session && pathname !== "/login") {
    redirect("/login");
  }

  // If logged in, ensure role is SUPER_ADMIN
  if (session && session.user.role !== "SUPER_ADMIN") {
    // You might want a "Forbidden" page, or just redirect to home
    // For now, let's redirect to login (or show an error component if you prefer)
    // But to avoid loops if they are logged in as something else, we might need a distinct error page.
    // For simplicity in this dev environment task:
    if (pathname !== "/login") {
      // Maybe sign them out or show an error.
      // For now, strict check:
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-red-500 font-bold text-3xl">Access Denied</h1>
            <p className="text-slate-400 max-w-md">
              Your account ({session.user.role}) is not authorized to access the
              Super Admin Dashboard.
            </p>
            {/* We needs a client component to sign out effectively, or just tell them to go back */}
            <a
              href="http://localhost:3000"
              className="text-blue-400 hover:underline block mt-4"
            >
              Go to Storefront
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      style={
        {
          // Force light mode variables for shadcn/ui components in this subtree
          "--background": "0 0% 100%",
          "--foreground": "222.2 84% 4.9%",
          "--card": "0 0% 100%",
          "--card-foreground": "222.2 84% 4.9%",
          "--popover": "0 0% 100%",
          "--popover-foreground": "222.2 84% 4.9%",
          "--primary": "222.2 47.4% 11.2%",
          "--primary-foreground": "210 40% 98%",
          "--secondary": "210 40% 96.1%",
          "--secondary-foreground": "222.2 47.4% 11.2%",
          "--muted": "210 40% 96.1%",
          "--muted-foreground": "215.4 16.3% 46.9%",
          "--accent": "210 40% 96.1%",
          "--accent-foreground": "222.2 47.4% 11.2%",
          "--destructive": "0 84.2% 60.2%",
          "--destructive-foreground": "210 40% 98%",
          "--border": "214.3 31.8% 91.4%",
          "--input": "214.3 31.8% 91.4%",
          "--ring": "222.2 84% 4.9%",
          "--radius": "0.5rem",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
