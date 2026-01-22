export default function OrdersPage() {
    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-20 md:pb-0">
            <h1 className="text-2xl font-bold font-heading mb-6">My Orders</h1>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900">Order #CK-882{i}</h3>
                                <p className="text-xs text-gray-400">12 Dec, 2025 at 8:30 PM</p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Delivered</span>
                        </div>
                        <div className="border-t border-dashed border-gray-100 my-3"></div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">1x Crispy Crab Wings</p>
                            <p className="text-sm text-gray-600">2x Steam Rice</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-500">Total Bill</span>
                            <span className="text-lg font-bold text-crab-red">৳1,450</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
