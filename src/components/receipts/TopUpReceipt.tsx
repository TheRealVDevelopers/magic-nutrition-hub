import ReceiptBase, { pad, LINE } from "./ReceiptBase";

export interface TopUpReceiptProps {
    memberName: string;
    memberId: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    balanceBefore: number;
    balanceAfter: number;
    clubName: string;
    clubPhone: string;
    date: Date;
    receiptNumber: string;
}

export default function TopUpReceipt(props: TopUpReceiptProps) {
    const {
        memberName, memberId, amount, paymentMethod,
        reference, balanceBefore, balanceAfter,
        clubName, clubPhone, date, receiptNumber,
    } = props;

    return (
        <ReceiptBase clubName={clubName} clubPhone={clubPhone} receiptNumber={receiptNumber} date={date}>
            <div style={{ textAlign: "center", fontWeight: "bold" }}>WALLET TOP-UP</div>
            <div>{LINE}</div>
            <div>{pad("Member:", memberName.slice(0, 20))}</div>
            {memberId && <div>{pad("ID:", memberId)}</div>}
            <div>{LINE}</div>
            <div style={{ textAlign: "right", fontWeight: "bold" }}>Amount Added:</div>
            <div style={{ textAlign: "right", fontWeight: "bold" }}>{`+ Rs.${amount.toFixed(2)}`}</div>
            <div>{pad("Payment:", paymentMethod)}</div>
            {reference && <div>{pad("Ref:", reference.slice(0, 18))}</div>}
            <div>{LINE}</div>
            <div>{pad("Prev Balance:", `Rs.${balanceBefore.toFixed(2)}`)}</div>
            <div style={{ fontWeight: "bold" }}>{pad("New Balance:", `Rs.${balanceAfter.toFixed(2)}`)}</div>
        </ReceiptBase>
    );
}
