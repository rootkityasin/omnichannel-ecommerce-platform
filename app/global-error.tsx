'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // In a real app, log to Sentry/Axiom here
        console.error('Global Error caught:', error);
    }, [error]);

    return (
        <html>
            <body className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-900">
                <div className="text-center p-8 bg-white shadow-xl rounded-lg border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Something went wrong!</h2>
                    <p className="mb-6 text-gray-600">
                        A critical error occurred. Our engineering team has been notified.
                    </p>
                    <div className="text-xs text-gray-400 mb-6 font-mono">
                        Reference: {error.digest || 'Unknown'}
                    </div>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
