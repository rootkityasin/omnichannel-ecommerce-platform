
export default function PlatformLanding() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                        90sX SaaS Platform
                    </h1>
                    <p className="text-slate-400">
                        Multi-Tenant E-Commerce Suite
                    </p>
                </div>

                <div className="grid gap-4">
                    <a
                        href="http://app.localhost:3000"
                        className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-6 py-4 transition-colors hover:bg-white/10 hover:border-teal-500/50"
                    >
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-teal-400">Super Admin</span>
                            <span className="text-xs text-slate-500">Manage Companies</span>
                        </div>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </a>

                    <a
                        href="http://crabkhai.localhost:3000"
                        className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-6 py-4 transition-colors hover:bg-white/10 hover:border-orange-500/50"
                    >
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-orange-400">Visit "CrabKhai"</span>
                            <span className="text-xs text-slate-500">Demo Shop Storefront</span>
                        </div>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                </div>

                <div className="text-xs text-slate-600 pt-8">
                    <p>Local Development Mode</p>
                    <p>Root Domain: localhost:3000</p>
                </div>
            </div>
        </div>
    );
}
