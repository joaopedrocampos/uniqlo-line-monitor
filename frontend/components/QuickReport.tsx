'use client';

import { useState } from 'react';
import { submitReport } from '@/lib/api';
import PhotoUpload from './PhotoUpload';

interface QuickReportProps {
  onReportSubmitted: () => void;
}

export default function QuickReport({ onReportSubmitted }: QuickReportProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReportId, setLastReportId] = useState<number | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const handleReport = async (e: React.MouseEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setLastReportId(null);

    try {
      const result = await submitReport(status);
      setSuccess(true);
      setLastReportId(result.report.id);
      onReportSubmitted();

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoComplete = () => {
    setShowPhotoUpload(false);
    setSuccess(false);
    setLastReportId(null);
  };

  const handleSkipPhoto = () => {
    setShowPhotoUpload(false);
    setSuccess(false);
    setLastReportId(null);
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <h3 className="text-2xl sm:text-3xl font-semibold text-center mb-6 text-gray-800">
          Report Current Status
        </h3>

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

        <div className="min-h-[80px]">
          {success && lastReportId && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <p className="text-green-700 font-medium">
                Thank you! Your report has been submitted.
              </p>
              <button
                type="button"
                onClick={() => setShowPhotoUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Add a Photo
              </button>
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

      {showPhotoUpload && lastReportId && (
        <PhotoUpload
          reportId={lastReportId}
          onUploadComplete={handlePhotoComplete}
          onCancel={handleSkipPhoto}
        />
      )}
    </>
  );
}
