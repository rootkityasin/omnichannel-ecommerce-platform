export default function SubscriptionPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                <span className="text-4xl">💎</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Subscription Plan</h1>
            <p className="text-slate-500 max-w-md">You are currently on the <strong className="text-orange-600">Enterprise Plan</strong>.</p>
            <button className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 transition">Manage Plan</button>
        </div>
    )
}
