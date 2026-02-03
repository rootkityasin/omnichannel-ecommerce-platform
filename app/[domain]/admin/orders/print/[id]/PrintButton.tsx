'use client';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-md font-sans font-bold hover:bg-gray-800"
        >
            Print Invoice
        </button>
    );
}
