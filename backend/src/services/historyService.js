import { query } from '../db/index.js';

/**
 * Status score mapping for calculating busyness
 * no_line = 0 (not busy)
 * short_line = 1 (somewhat busy)
 * long_line = 2 (very busy)
 */
const STATUS_SCORES = {
  no_line: 0,
  short_line: 1,
  long_line: 2,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Get reports from the last N days
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>}
 */
export async function getReportsForPeriod(days = 7) {
  const result = await query(
    `SELECT status, created_at,
            EXTRACT(HOUR FROM created_at) as hour,
            EXTRACT(DOW FROM created_at) as day_of_week
     FROM reports
     WHERE created_at > NOW() - INTERVAL '${days} days'
     ORDER BY created_at DESC`
  );
  return result.rows;
}

/**
 * Calculate average score for each hour of the day
 * @param {Array} reports - Array of report objects
 * @returns {Object} - Map of hour (0-23) to average score
 */
export function calculateHourlyScores(reports) {
  const hourlyData = {};

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { total: 0, count: 0 };
  }

  // Aggregate scores by hour
  for (const report of reports) {
    const hour = parseInt(report.hour);
    const score = STATUS_SCORES[report.status] ?? 1;
    hourlyData[hour].total += score;
    hourlyData[hour].count += 1;
  }

  // Calculate averages
  const hourlyScores = {};
  for (let i = 0; i < 24; i++) {
    if (hourlyData[i].count > 0) {
      hourlyScores[i] = hourlyData[i].total / hourlyData[i].count;
    } else {
      hourlyScores[i] = null; // No data for this hour
    }
  }

  return hourlyScores;
}

/**
 * Calculate average score for each day of the week
 * @param {Array} reports - Array of report objects
 * @returns {Object} - Map of day (0-6) to average score
 */
export function calculateDailyScores(reports) {
  const dailyData = {};

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    dailyData[i] = { total: 0, count: 0 };
  }

  // Aggregate scores by day
  for (const report of reports) {
    const day = parseInt(report.day_of_week);
    const score = STATUS_SCORES[report.status] ?? 1;
    dailyData[day].total += score;
    dailyData[day].count += 1;
  }

  // Calculate averages
  const dailyScores = {};
  for (let i = 0; i < 7; i++) {
    if (dailyData[i].count > 0) {
      dailyScores[i] = dailyData[i].total / dailyData[i].count;
    } else {
      dailyScores[i] = null; // No data for this day
    }
  }

  return dailyScores;
}

/**
 * Identify busy and quiet hours based on scores
 * @param {Object} hourlyScores - Map of hour to average score
 * @returns {Object} - { busyHours, quietHours }
 */
export function identifyBusyQuietHours(hourlyScores) {
  const busyHours = [];
  const quietHours = [];

  for (let hour = 0; hour < 24; hour++) {
    const score = hourlyScores[hour];
    if (score === null) continue;

    if (score >= 1.0) {
      busyHours.push(hour);
    } else if (score < 0.5) {
      quietHours.push(hour);
    }
  }

  return { busyHours, quietHours };
}

/**
 * Identify busy and quiet days based on scores
 * @param {Object} dailyScores - Map of day to average score
 * @returns {Object} - { busyDays, quietDays }
 */
export function identifyBusyQuietDays(dailyScores) {
  const busyDays = [];
  const quietDays = [];

  for (let day = 0; day < 7; day++) {
    const score = dailyScores[day];
    if (score === null) continue;

    if (score >= 1.0) {
      busyDays.push(DAY_NAMES[day]);
    } else if (score < 0.5) {
      quietDays.push(DAY_NAMES[day]);
    }
  }

  return { busyDays, quietDays };
}

/**
 * Format hour for display (e.g., 13 -> "1pm", 9 -> "9am")
 * @param {number} hour - Hour in 24-hour format
 * @returns {string}
 */
export function formatHour(hour) {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

/**
 * Format a range of consecutive hours
 * @param {Array<number>} hours - Array of hours
 * @returns {Array<string>} - Array of formatted ranges
 */
export function formatHourRanges(hours) {
  if (hours.length === 0) return [];

  // Sort hours
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i];
    } else {
      ranges.push(formatRange(rangeStart, rangeEnd));
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }
  ranges.push(formatRange(rangeStart, rangeEnd));

  return ranges;
}

function formatRange(start, end) {
  if (start === end) {
    return formatHour(start);
  }
  return `${formatHour(start)}-${formatHour(end + 1)}`;
}

/**
 * Generate a human-readable summary of busy times
 * @param {Object} patterns - The patterns object
 * @returns {string}
 */
export function generateSummary(patterns) {
  const { busyHours, busyDays, quietHours, quietDays } = patterns;

  const parts = [];

  if (busyHours.length > 0) {
    const hourRanges = formatHourRanges(busyHours);
    if (busyDays.length > 0 && busyDays.length < 7) {
      parts.push(`Typically busy: ${busyDays.join(', ')} ${hourRanges.join(', ')}`);
    } else {
      parts.push(`Typically busy: ${hourRanges.join(', ')}`);
    }
  }

  if (quietHours.length > 0 && parts.length === 0) {
    const hourRanges = formatHourRanges(quietHours);
    parts.push(`Usually quiet: ${hourRanges.join(', ')}`);
  }

  if (parts.length === 0) {
    return 'Not enough data to determine patterns yet';
  }

  return parts.join('. ');
}

/**
 * Get complete history analysis
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>}
 */
export async function getHistoryAnalysis(days = 7) {
  const reports = await getReportsForPeriod(days);

  if (reports.length === 0) {
    return {
      summary: 'No reports available for the selected period',
      patterns: {
        busyHours: [],
        busyDays: [],
        quietHours: [],
        quietDays: [],
      },
      dataPoints: 0,
      periodDays: days,
    };
  }

  const hourlyScores = calculateHourlyScores(reports);
  const dailyScores = calculateDailyScores(reports);

  const { busyHours, quietHours } = identifyBusyQuietHours(hourlyScores);
  const { busyDays, quietDays } = identifyBusyQuietDays(dailyScores);

  const patterns = { busyHours, busyDays, quietHours, quietDays };

  return {
    summary: generateSummary(patterns),
    patterns,
    dataPoints: reports.length,
    periodDays: days,
  };
}
