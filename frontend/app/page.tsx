'use client';

import { useEffect, useState } from 'react';
import StatusDisplay from '@/components/StatusDisplay';
import QuickReport from '@/components/QuickReport';
import BusyTimes from '@/components/BusyTimes';
import { getStatus, StatusResponse } from '@/lib/api';

export default function Home() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Title */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            UNIQLO MUNICH
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mt-2">
            Line Status
          </p>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading status...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <button
                onClick={fetchStatus}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {status && !loading && !error && (
          <>
            {/* Status Display */}
            <div className="mb-8 sm:mb-12">
              <StatusDisplay
                status={status.status}
                lastUpdated={status.lastUpdated}
                reportCount={status.reportCount}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8 sm:my-12"></div>

            {/* Quick Report */}
            <div>
              <QuickReport onReportSubmitted={fetchStatus} />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8 sm:my-12"></div>

            {/* Busy Times */}
            <div className="max-w-2xl mx-auto px-4">
              <BusyTimes />
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 sm:mt-16 text-sm text-gray-500">
          <p>Help others by reporting what you see at the store</p>
        </footer>
      </main>
    </div>
  );
}
