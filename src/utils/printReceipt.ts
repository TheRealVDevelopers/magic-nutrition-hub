/**
 * Sends ESC/POS formatted text to a thermal printer via the RawBT Android app.
 * Uses Android Intent URL scheme — no window.print() dialog.
 *
 * RawBT app: https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter
 */

import { CUT } from './escpos';

/**
 * Print an array of ESC/POS lines via RawBT intent.
 * @param lines - Array of ESC/POS formatted strings (including commands).
 */
export const printViaRawBT = (lines: string[] | string): void => {
    try {
        // Fix: join by empty string because ESC/POS commands shouldn't have newlines inserted between them
        const content = Array.isArray(lines) ? lines.join('') : lines;

        // Encode content as URI component
        const encoded = encodeURIComponent(content);

        // RawBT intent URL — correct format
        const intentUrl = 'rawbt:' + encoded;

        // Open RawBT
        window.location.href = intentUrl;

    } catch (error) {
        console.error('Print error:', error);
        alert('Print failed. Please check RawBT app is installed and printer is connected.');
    }
};

/**
 * Generate a transaction ID in the format TXN20260307-4821
 */
export const generateTxnId = (): string => {
    const now = new Date();
    const datePart =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TXN${datePart}-${rand}`;
};

/**
 * Format amount in Indian locale.
 */
export const formatINR = (amount: number): string => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
};

// ── Legacy export for backward compatibility (no-op if called) ──
/** @deprecated Use printViaRawBT instead */
export function printReceipt(): void {
    console.warn('printReceipt() is deprecated. Use printViaRawBT() instead.');
}
