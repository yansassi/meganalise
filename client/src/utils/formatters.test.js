import test from 'node:test';
import assert from 'node:assert';
import { formatNumber, formatDate } from './formatters.js';

test('formatNumber', async (t) => {
    await t.test('returns "0" for null, undefined, or empty string', () => {
        assert.strictEqual(formatNumber(null), '0');
        assert.strictEqual(formatNumber(undefined), '0');
        assert.strictEqual(formatNumber(''), '0');
    });

    await t.test('formats and rounds numbers correctly for pt-BR', () => {
        // In pt-BR locale, thousand separator is "."
        assert.strictEqual(formatNumber(1234.56), '1.235');
        assert.strictEqual(formatNumber(1000), '1.000');
        assert.strictEqual(formatNumber(0), '0');
    });

    await t.test('handles numeric strings', () => {
        assert.strictEqual(formatNumber('1234.56'), '1.235');
    });

    await t.test('returns original value for non-numeric strings', () => {
        assert.strictEqual(formatNumber('abc'), 'abc');
    });
});

test('formatDate', async (t) => {
    await t.test('returns "N/A" for empty/null/undefined', () => {
        assert.strictEqual(formatDate(null), 'N/A');
        assert.strictEqual(formatDate(undefined), 'N/A');
        assert.strictEqual(formatDate(''), 'N/A');
    });

    await t.test('formats valid date strings correctly (UTC)', () => {
        assert.strictEqual(formatDate('2023-10-05T00:00:00Z'), '05/10/2023');
        assert.strictEqual(formatDate('2023-01-01'), '01/01/2023');
    });

    await t.test('returns "data inválida" for invalid dates', () => {
        assert.strictEqual(formatDate('invalid-date'), 'data inválida');
    });
});
