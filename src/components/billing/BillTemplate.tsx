import { forwardRef } from "react";
import type { BillingPrint, Club } from "@/types/firestore";

interface Props {
    bill: BillingPrint;
    club: Club;
}

const BillTemplate = forwardRef<HTMLDivElement, Props>(({ bill, club }, ref) => {
    const date = bill.printedAt?.toDate?.() || new Date();

    return (
        <>
            {/* Print-only styles */}
            <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .bill-print-root, .bill-print-root * { visibility: visible !important; }
          .bill-print-root {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            font-size: 12px !important;
            color: #000 !important;
            background: #fff !important;
          }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>

            <div ref={ref} className="bill-print-root" style={{
                width: "80mm",
                fontFamily: "'Courier New', monospace",
                fontSize: "12px",
                color: "#000",
                background: "#fff",
                padding: "4mm",
                lineHeight: 1.5,
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                    {club.logo && (
                        <img src={club.logo} alt="" style={{ width: "40px", height: "40px", margin: "0 auto 4px", display: "block" }} />
                    )}
                    <div style={{ fontSize: "16px", fontWeight: "bold" }}>{club.name}</div>
                    {club.tagline && <div style={{ fontSize: "10px" }}>{club.tagline}</div>}
                    {club.ownerPhone && <div style={{ fontSize: "10px" }}>Tel: {club.ownerPhone}</div>}
                </div>

                <Divider />

                {/* Bill info */}
                <div>
                    <Row left="Bill #" right={bill.id.slice(-6).toUpperCase()} />
                    <Row left="Date" right={`${date.toLocaleDateString("en-IN")} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`} />
                    <Row left="Member" right={bill.memberName} />
                </div>

                <Divider />

                {/* Column header */}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11px" }}>
                    <span style={{ flex: 1 }}>Item</span>
                    <span style={{ width: "30px", textAlign: "center" }}>Qty</span>
                    <span style={{ width: "60px", textAlign: "right" }}>Amt</span>
                </div>

                <Divider />

                {/* Items */}
                {bill.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        <span style={{ width: "30px", textAlign: "center" }}>x{item.quantity}</span>
                        <span style={{ width: "60px", textAlign: "right" }}>₹{item.total}</span>
                    </div>
                ))}

                <Divider />

                {/* Totals */}
                <Row left="Subtotal:" right={`₹${bill.subtotal}`} />
                <Divider />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
                    <span>TOTAL:</span>
                    <span>₹{bill.total}</span>
                </div>
                <Divider />

                {/* Payment */}
                <Row left="Paid via:" right={bill.paidFrom === "wallet" ? "Wallet" : "Cash"} />
                {bill.paidFrom === "wallet" && <Row left={`${club.currencyName} used:`} right={String(bill.total)} />}

                <Divider />

                {/* Footer */}
                <div style={{ textAlign: "center", fontSize: "10px", marginTop: "8px" }}>
                    <div>Thank you for visiting!</div>
                    {club.tagline && <div style={{ marginTop: "2px" }}>{club.tagline}</div>}
                </div>

                <Divider />
            </div>
        </>
    );
});

BillTemplate.displayName = "BillTemplate";
export default BillTemplate;

function Divider() {
    return <div style={{ borderBottom: "1px dashed #000", margin: "4px 0" }} />;
}

function Row({ left, right }: { left: string; right: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
            <span>{left}</span>
            <span>{right}</span>
        </div>
    );
}
