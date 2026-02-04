'use client';

import { useEffect, useState } from 'react';
import { getHistory, HistoryResponse } from '@/lib/api';

export default function BusyTimes() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getHistory(7);
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        Loading patterns...
      </div>
    );
  }

  if (error) {
    return null; // Silently hide on error - not critical
  }

  if (!history || history.dataPoints < 5) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-gray-500 text-sm">
          Not enough data yet to show patterns. Keep reporting!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h4 className="font-medium text-gray-700 mb-2 text-sm uppercase tracking-wide">
        Typical Busy Times
      </h4>
      <p className="text-gray-800">
        {history.summary}
      </p>
      <p className="text-xs text-gray-500 mt-2">
        Based on {history.dataPoints} reports from the last {history.periodDays} days
      </p>
    </div>
  );
}
