'use client';

import { useState } from 'react';
import { submitReport } from '@/lib/api';

interface QuickReportProps {
  onReportSubmitted: () => void;
}

export default function QuickReport({ onReportSubmitted }: QuickReportProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReport = async (e: React.MouseEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await submitReport(status);
      setSuccess(true);
      onReportSubmitted(); // Refresh the status

      // Smooth scroll to top to see updated status
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-semibold text-center mb-6 text-gray-800">
        Report Current Status
      </h3>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          type="button"
          onClick={(e) => handleReport(e, 'NO_LINE')}
          disabled={loading}
          className="flex-1 h-16 sm:h-20 rounded-xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-lg sm:text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          No Line
        </button>

        <button
          type="button"
          onClick={(e) => handleReport(e, 'SHORT_LINE')}
          disabled={loading}
          className="flex-1 h-16 sm:h-20 rounded-xl bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-bold text-lg sm:text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          Short Line
        </button>

        <button
          type="button"
          onClick={(e) => handleReport(e, 'LONG_LINE')}
          disabled={loading}
          className="flex-1 h-16 sm:h-20 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold text-lg sm:text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          Long Line
        </button>
      </div>

      {/* Status Messages - fixed height container to prevent layout shift */}
      <div className="min-h-[60px]">
        {success && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">
              Thank you! Your report has been submitted.
            </p>
          </div>
        )}

        {error && (
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center p-4">
            <p className="text-gray-600">Submitting your report...</p>
          </div>
        )}
      </div>
    </div>
  );
}
