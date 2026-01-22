export default function AppRequestPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <span className="text-4xl">📱</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Mobile App Request</h1>
            <p className="text-slate-500 max-w-md">Want a dedicated mobile app for your store? Submit a request here and we will build it for you.</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Request App</button>
        </div>
    )
}
