const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type StatusType = 'NO_LINE' | 'SHORT_LINE' | 'LONG_LINE' | 'UNKNOWN';

export interface StatusResponse {
  status: StatusType;
  lastUpdated: string | null;
  reportCount: number;
}

export interface ReportResponse {
  message: string;
  status: string;
}

// Map backend status to frontend status
function mapStatusToFrontend(backendStatus: string): StatusType {
  const statusMap: Record<string, StatusType> = {
    'no_line': 'NO_LINE',
    'short_line': 'SHORT_LINE',
    'long_line': 'LONG_LINE',
    'unknown': 'UNKNOWN',
  };
  return statusMap[backendStatus] || 'UNKNOWN';
}

// Map frontend status to backend status
function mapStatusToBackend(frontendStatus: string): string {
  const statusMap: Record<string, string> = {
    'NO_LINE': 'no_line',
    'SHORT_LINE': 'short_line',
    'LONG_LINE': 'long_line',
  };
  return statusMap[frontendStatus] || frontendStatus.toLowerCase();
}

/**
 * Fetch the current line status from the backend
 */
export async function getStatus(): Promise<StatusResponse> {
  try {
    const response = await fetch(`${API_URL}/api/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch status: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform backend response to frontend format
    return {
      status: mapStatusToFrontend(data.status),
      lastUpdated: data.lastUpdated,
      reportCount: data.totalReports || 0,
    };
  } catch (error) {
    console.error('Error fetching status:', error);
    throw new Error('Unable to fetch line status. Please try again later.');
  }
}

/**
 * Submit a new line status report to the backend
 */
export async function submitReport(status: string): Promise<ReportResponse> {
  try {
    const backendStatus = mapStatusToBackend(status);
    const response = await fetch(`${API_URL}/api/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: backendStatus }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit report: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw new Error('Unable to submit report. Please try again later.');
  }
}
