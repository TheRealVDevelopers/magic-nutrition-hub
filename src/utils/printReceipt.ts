/**
 * Triggers the browser's native print dialog.
 * The #receipt-print-area div must be populated before calling this.
 * print.css ensures only the receipt area is visible when printing.
 */
export function printReceipt(): void {
    window.print();
}
