import { getClientIp, hashIp } from '../src/utils/clientHash.js';

describe('Client hash', () => {
  const day = new Date('2026-10-22T10:00:00Z');

  describe('hashIp', () => {
    it('should never return the raw IP', () => {
      const hash = hashIp('203.0.113.7', day);

      expect(hash).not.toContain('203.0.113.7');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should be stable for the same IP on the same day', () => {
      const later = new Date('2026-10-22T23:59:00Z');

      expect(hashIp('203.0.113.7', day)).toBe(hashIp('203.0.113.7', later));
    });

    it('should differ between IPs', () => {
      expect(hashIp('203.0.113.7', day)).not.toBe(hashIp('203.0.113.8', day));
    });

    it('should rotate daily so hashes cannot be linked across days', () => {
      const nextDay = new Date('2026-10-23T00:01:00Z');

      expect(hashIp('203.0.113.7', day)).not.toBe(hashIp('203.0.113.7', nextDay));
    });

    it('should depend on IP_HASH_SECRET', () => {
      const original = process.env.IP_HASH_SECRET;
      try {
        process.env.IP_HASH_SECRET = 'secret-a';
        const a = hashIp('203.0.113.7', day);
        process.env.IP_HASH_SECRET = 'secret-b';
        const b = hashIp('203.0.113.7', day);

        expect(a).not.toBe(b);
      } finally {
        if (original === undefined) delete process.env.IP_HASH_SECRET;
        else process.env.IP_HASH_SECRET = original;
      }
    });
  });

  describe('getClientIp', () => {
    it('should prefer req.ip', () => {
      const req = { ip: '203.0.113.7', headers: { 'x-forwarded-for': '198.51.100.1' }, socket: {} };

      expect(getClientIp(req)).toBe('203.0.113.7');
    });

    it('should fall back to the socket address', () => {
      const req = { headers: {}, socket: { remoteAddress: '198.51.100.2' } };

      expect(getClientIp(req)).toBe('198.51.100.2');
    });
  });
});
