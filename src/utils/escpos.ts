/**
 * ESC/POS command constants for 80mm thermal printers.
 * Used with RawBT Android intent-based printing.
 */

export const ESC = '\x1B';
export const GS = '\x1D';
export const CUT = GS + '\x56\x41\x00';

// Text alignment
export const ALIGN_CENTER = ESC + '\x61\x01';
export const ALIGN_LEFT = ESC + '\x61\x00';
export const ALIGN_RIGHT = ESC + '\x61\x02';

// Text weight
export const BOLD_ON = ESC + '\x45\x01';
export const BOLD_OFF = ESC + '\x45\x00';

// Text size
export const SIZE_NORMAL = ESC + '\x21\x00';
export const SIZE_LARGE = ESC + '\x21\x30';
export const SIZE_MEDIUM = ESC + '\x21\x10';

// Line feed
export const LF = '\n';

// 80mm paper = 48 characters per line
export const PAPER_WIDTH = 48;

// Divider line (48 chars for 80mm)
export const DIVIDER = '─'.repeat(PAPER_WIDTH);
export const DIVIDER_THIN = '-'.repeat(PAPER_WIDTH);

/**
 * Center text in 48 characters.
 */
export const center = (text: string): string => {
    const pad = Math.max(0, Math.floor((PAPER_WIDTH - text.length) / 2));
    return ' '.repeat(pad) + text;
};

/**
 * Two-column layout: left-aligned + right-aligned within 48 chars.
 */
export const twoCol = (left: string, right: string): string => {
    const gap = PAPER_WIDTH - left.length - right.length;
    return left + ' '.repeat(Math.max(1, gap)) + right;
};

/**
 * Truncate text to maxLen characters, adding "..." if truncated.
 */
export const truncate = (text: string, maxLen: number): string => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + '...';
};
