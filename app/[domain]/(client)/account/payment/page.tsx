import { CreditCard, Wallet, Plus } from 'lucide-react';

export default function PaymentPage() {
    return (
        <div className="p-4 min-h-screen bg-gray-50 pb-20 md:pb-0">
            <h1 className="text-2xl font-bold font-heading mb-6">Payment Methods</h1>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bkash_Logo_and_icon.svg/200px-Bkash_Logo_and_icon.svg.png" alt="bKash" className="w-6 h-6 object-contain" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">bKash</h3>
                            <p className="text-xs text-gray-400">017 •••• 5678</p>
                        </div>
                    </div>
                    <span className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500"></span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Nagad_Logo.png/640px-Nagad_Logo.png" alt="Nagad" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Nagad</h3>
                            <p className="text-xs text-gray-400">Not connected</p>
                        </div>
                    </div>
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300"></span>
                </div>

                <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all">
                    <Plus className="w-5 h-5" />
                    Add New Method
                </button>
            </div>
        </div>
    );
}
