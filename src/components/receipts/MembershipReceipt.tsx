import ReceiptBase, { pad, LINE, formatDate } from "./ReceiptBase";

export interface MembershipReceiptProps {
    memberName: string;
    memberId: string;
    planName: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    startDate: Date;
    endDate: Date;
    clubName: string;
    clubPhone: string;
    date: Date;
    receiptNumber: string;
}

export default function MembershipReceipt(props: MembershipReceiptProps) {
    const {
        memberName, memberId, planName, amount, paymentMethod,
        reference, startDate, endDate,
        clubName, clubPhone, date, receiptNumber,
    } = props;

    return (
        <ReceiptBase clubName={clubName} clubPhone={clubPhone} receiptNumber={receiptNumber} date={date}>
            <div style={{ textAlign: "center", fontWeight: "bold" }}>MEMBERSHIP RECEIPT</div>
            <div>{LINE}</div>
            <div>{pad("Member:", memberName.slice(0, 20))}</div>
            {memberId && <div>{pad("ID:", memberId)}</div>}
            <div>{LINE}</div>
            <div style={{ fontWeight: "bold" }}>{pad("Plan:", planName.toUpperCase())}</div>
            <div>{pad("Amount:", `Rs.${amount.toFixed(2)}`)}</div>
            <div>{pad("Payment:", paymentMethod)}</div>
            {reference && <div>{pad("Ref:", reference.slice(0, 18))}</div>}
            <div>{LINE}</div>
            <div>Valid From:</div>
            <div style={{ paddingLeft: "4px" }}>{formatDate(startDate)}</div>
            <div>Valid Until:</div>
            <div style={{ paddingLeft: "4px", fontWeight: "bold" }}>{formatDate(endDate)}</div>
        </ReceiptBase>
    );
}
