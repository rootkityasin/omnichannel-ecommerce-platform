export default function BillingPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                <span className="text-4xl">💳</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Billing & Invoices</h1>
            <p className="text-slate-500 max-w-md">View your subscription history and download invoices.</p>
        </div>
    )
}
