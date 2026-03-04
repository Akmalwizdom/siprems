import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatWibIsoTimestamp, formatWibDateString } from './wib-time';

describe('wib-time utility', () => {
    beforeEach(() => {
        // Tell Vitest to use fake timers
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should format WIB ISO timestamp correctly (UTC transition)', () => {
        // Set a specific UTC time: 2026-03-04 02:00:00 UTC
        // WIB (UTC+7) should be 2026-03-04 09:00:00+07:00
        const date = new Date(Date.UTC(2026, 2, 4, 2, 0, 0));
        vi.setSystemTime(date);

        const result = formatWibIsoTimestamp();
        expect(result).toBe('2026-03-04T09:00:00+07:00');
    });

    it('should format WIB ISO timestamp correctly across date boundary', () => {
        // Set a specific UTC time: 2026-03-03 20:00:00 UTC
        // WIB (UTC+7) should be 2026-03-04 03:00:00+07:00
        const date = new Date(Date.UTC(2026, 2, 3, 20, 0, 0));
        vi.setSystemTime(date);

        const result = formatWibIsoTimestamp();
        expect(result).toBe('2026-03-04T03:00:00+07:00');
    });

    it('should format WIB date string correctly', () => {
        const date = new Date(Date.UTC(2026, 2, 4, 2, 0, 0));
        vi.setSystemTime(date);

        const result = formatWibDateString();
        expect(result).toBe('2026-03-04');
    });

    it('should format WIB date string correctly across date boundary', () => {
        const date = new Date(Date.UTC(2026, 2, 3, 20, 0, 0));
        vi.setSystemTime(date);

        const result = formatWibDateString();
        expect(result).toBe('2026-03-04');
    });
});
