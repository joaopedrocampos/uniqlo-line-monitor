import { formatDistanceToNow } from 'date-fns';
import { StatusType } from '@/lib/api';

interface StatusDisplayProps {
  status: StatusType;
  lastUpdated: string | null;
  reportCount: number;
}

export default function StatusDisplay({
  status,
  lastUpdated,
  reportCount,
}: StatusDisplayProps) {
  // Map status to display text and colors
  const statusConfig: Record<StatusType, { text: string; color: string; textColor: string; ringColor: string }> = {
    NO_LINE: {
      text: 'NO LINE',
      color: 'bg-green-500',
      textColor: 'text-green-500',
      ringColor: 'ring-green-500',
    },
    SHORT_LINE: {
      text: 'SHORT LINE',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      ringColor: 'ring-yellow-500',
    },
    LONG_LINE: {
      text: 'LONG LINE',
      color: 'bg-red-500',
      textColor: 'text-red-500',
      ringColor: 'ring-red-500',
    },
    UNKNOWN: {
      text: 'UNKNOWN',
      color: 'bg-gray-400',
      textColor: 'text-gray-500',
      ringColor: 'ring-gray-400',
    },
  };

  const config = statusConfig[status];

  // Calculate time ago (handle null case)
  const timeAgo = lastUpdated
    ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
    : null;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 px-4">
      {/* Status Indicator Circle */}
      <div className="relative">
        <div
          className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full ${config.color} shadow-lg ring-4 ring-offset-4 ${config.ringColor} ring-opacity-30`}
        ></div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <h2
          className={`text-4xl sm:text-5xl md:text-6xl font-bold ${config.textColor} tracking-tight`}
        >
          {config.text}
        </h2>
      </div>

      {/* Metadata */}
      <div className="text-center space-y-2 text-gray-600">
        {timeAgo ? (
          <p className="text-base sm:text-lg">
            Last updated: <span className="font-medium">{timeAgo}</span>
          </p>
        ) : (
          <p className="text-base sm:text-lg">
            No recent reports
          </p>
        )}
        {reportCount > 0 && (
          <p className="text-sm sm:text-base">
            Based on <span className="font-medium">{reportCount}</span> recent
            report{reportCount !== 1 ? 's' : ''}
          </p>
        )}
        {status === 'UNKNOWN' && (
          <p className="text-sm sm:text-base text-gray-500 mt-2">
            Be the first to report!
          </p>
        )}
      </div>
    </div>
  );
}
