import {
  calculateHourlyScores,
  calculateDailyScores,
  identifyBusyQuietHours,
  identifyBusyQuietDays,
  formatHour,
  formatHourRanges,
  generateSummary,
} from '../src/services/historyService.js';

describe('History Service', () => {
  describe('calculateHourlyScores', () => {
    it('should calculate average scores per hour', () => {
      const reports = [
        { hour: '10', status: 'no_line' },    // score: 0
        { hour: '10', status: 'short_line' }, // score: 1
        { hour: '12', status: 'long_line' },  // score: 2
        { hour: '12', status: 'long_line' },  // score: 2
      ];

      const scores = calculateHourlyScores(reports);

      expect(scores[10]).toBe(0.5);  // (0 + 1) / 2
      expect(scores[12]).toBe(2);    // (2 + 2) / 2
      expect(scores[8]).toBeNull();  // no data
    });

    it('should return null for hours with no data', () => {
      const reports = [
        { hour: '10', status: 'no_line' },
      ];

      const scores = calculateHourlyScores(reports);

      expect(scores[10]).toBe(0);
      expect(scores[11]).toBeNull();
      expect(scores[0]).toBeNull();
    });

    it('should handle empty reports array', () => {
      const scores = calculateHourlyScores([]);

      for (let i = 0; i < 24; i++) {
        expect(scores[i]).toBeNull();
      }
    });
  });

  describe('calculateDailyScores', () => {
    it('should calculate average scores per day of week', () => {
      const reports = [
        { day_of_week: '1', status: 'no_line' },    // Monday, score: 0
        { day_of_week: '1', status: 'long_line' },  // Monday, score: 2
        { day_of_week: '0', status: 'short_line' }, // Sunday, score: 1
      ];

      const scores = calculateDailyScores(reports);

      expect(scores[1]).toBe(1);   // Monday: (0 + 2) / 2
      expect(scores[0]).toBe(1);   // Sunday: 1 / 1
      expect(scores[2]).toBeNull(); // Tuesday: no data
    });
  });

  describe('identifyBusyQuietHours', () => {
    it('should identify busy hours (score >= 1.0)', () => {
      const hourlyScores = {
        9: 0.3,   // quiet
        10: 0.8,  // neither
        11: 1.0,  // busy
        12: 1.5,  // busy
        13: 2.0,  // busy
        14: null, // no data
      };

      const { busyHours, quietHours } = identifyBusyQuietHours(hourlyScores);

      expect(busyHours).toContain(11);
      expect(busyHours).toContain(12);
      expect(busyHours).toContain(13);
      expect(busyHours).not.toContain(9);
      expect(busyHours).not.toContain(10);
    });

    it('should identify quiet hours (score < 0.5)', () => {
      const hourlyScores = {
        8: 0.0,
        9: 0.3,
        10: 0.5,  // not quiet (exactly 0.5)
        11: 1.0,
      };

      const { quietHours } = identifyBusyQuietHours(hourlyScores);

      expect(quietHours).toContain(8);
      expect(quietHours).toContain(9);
      expect(quietHours).not.toContain(10);
      expect(quietHours).not.toContain(11);
    });
  });

  describe('identifyBusyQuietDays', () => {
    it('should identify busy and quiet days', () => {
      const dailyScores = {
        0: 0.2,   // Sunday - quiet
        1: 1.5,   // Monday - busy
        2: 0.8,   // Tuesday - neither
        3: null,  // Wednesday - no data
        4: 1.2,   // Thursday - busy
        5: 1.0,   // Friday - busy
        6: 0.3,   // Saturday - quiet
      };

      const { busyDays, quietDays } = identifyBusyQuietDays(dailyScores);

      expect(busyDays).toContain('Monday');
      expect(busyDays).toContain('Thursday');
      expect(busyDays).toContain('Friday');
      expect(quietDays).toContain('Sunday');
      expect(quietDays).toContain('Saturday');
    });
  });

  describe('formatHour', () => {
    it('should format hours correctly', () => {
      expect(formatHour(0)).toBe('12am');
      expect(formatHour(1)).toBe('1am');
      expect(formatHour(11)).toBe('11am');
      expect(formatHour(12)).toBe('12pm');
      expect(formatHour(13)).toBe('1pm');
      expect(formatHour(23)).toBe('11pm');
    });
  });

  describe('formatHourRanges', () => {
    it('should format consecutive hours as ranges', () => {
      const hours = [10, 11, 12, 14, 15];
      const ranges = formatHourRanges(hours);

      expect(ranges).toEqual(['10am-1pm', '2pm-4pm']);
    });

    it('should handle single hours', () => {
      const hours = [10, 14];
      const ranges = formatHourRanges(hours);

      expect(ranges).toEqual(['10am', '2pm']);
    });

    it('should handle empty array', () => {
      const ranges = formatHourRanges([]);
      expect(ranges).toEqual([]);
    });

    it('should handle unsorted hours', () => {
      const hours = [14, 10, 11];
      const ranges = formatHourRanges(hours);

      expect(ranges).toEqual(['10am-12pm', '2pm']);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary with busy hours and days', () => {
      const patterns = {
        busyHours: [12, 13, 17, 18],
        busyDays: ['Monday', 'Friday'],
        quietHours: [],
        quietDays: [],
      };

      const summary = generateSummary(patterns);

      expect(summary).toContain('Typically busy');
      expect(summary).toContain('Monday');
      expect(summary).toContain('Friday');
    });

    it('should show quiet hours when no busy hours', () => {
      const patterns = {
        busyHours: [],
        busyDays: [],
        quietHours: [9, 10, 20, 21],
        quietDays: ['Sunday'],
      };

      const summary = generateSummary(patterns);

      expect(summary).toContain('Usually quiet');
    });

    it('should handle no patterns', () => {
      const patterns = {
        busyHours: [],
        busyDays: [],
        quietHours: [],
        quietDays: [],
      };

      const summary = generateSummary(patterns);

      expect(summary).toBe('Not enough data to determine patterns yet');
    });
  });
});
