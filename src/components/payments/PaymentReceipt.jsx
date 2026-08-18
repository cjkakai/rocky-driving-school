import { useState } from "react";
import { X, Printer, AlertCircle } from "lucide-react";
import { Modal, Btn } from "../../ui";
import { fmt } from "../../utils/students.utils";
import { paymentsAPI } from "../../api/payments.api";
import { useAuth } from "../../context/AuthContext";

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: true, 
    timeZone: "Africa/Nairobi" 
  });
}

function getReceiptDate(payment) {
  return payment.transaction_date || payment.created_at;
}

const RECEIPT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

  .receipt {
    width: 80mm;
    min-width: 80mm;
    background: #fff;
    padding: 14px 12px;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.45;
    color: #111;
    position: relative;
  }
  .receipt-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 52px;
    font-weight: 900;
    color: rgba(0,0,0,0.12);
    text-transform: uppercase;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1;
    letter-spacing: 4px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt-logo-watermark {
    display: none;
  }
  @media print {
    .receipt-watermark {
      color: rgba(0,0,0,0.15) !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
  .receipt-content { position: relative; z-index: 2; }

  /* Header */
  .receipt-header { text-align: center; margin-bottom: 10px; }
  .receipt-logo-img { width: 56px; height: 56px; object-fit: contain; margin: 0 auto 5px; display: block; }
  .receipt-title {
    font-size: 15px;
    font-weight: 900;
    margin: 3px 0;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .receipt-branch { font-size: 12px; font-weight: 700; margin: 2px 0; }
  .receipt-contacts { font-size: 10px; margin-top: 5px; line-height: 1.4; color: #444; }
  .receipt-contacts p { margin: 1px 0; }

  /* Dividers */
  .receipt-divider { border: none; border-top: 1.5px dashed #aaa; margin: 9px 0; }
  .receipt-divider-solid { border: none; border-top: 1.5px solid #111; margin: 6px 0; }
  .receipt-divider-thick { border: none; border-top: 2px solid #111; margin: 9px 0; }

  /* Sections */
  .receipt-section { margin: 6px 0; }
  .receipt-section-title {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 6px;
    color: #333;
  }
  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 3.5px 0;
    font-size: 10.5px;
  }
  .receipt-label { color: #555; font-weight: 500; }
  .receipt-value { font-weight: 700; text-align: right; color: #111; }

  /* Amount */
  .receipt-amount-block {
    background: #f0f0f0;
    border: 1.5px solid #ccc;
    border-radius: 4px;
    padding: 7px 8px;
    margin: 8px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .receipt-amount-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #333; }
  .receipt-amount-value { font-size: 16px; font-weight: 900; color: #000; }

  /* Balance */
  .receipt-balance-row { margin-top: 4px; }
  .receipt-balance-value { font-size: 13px; font-weight: 800; }

  /* Footer */
  .receipt-footer { text-align: center; margin-top: 12px; }
  .receipt-footer-note { font-size: 9.5px; line-height: 1.4; margin: 6px 0; color: #333; font-weight: 600; }
  .receipt-footer-note p { margin: 1px 0; }
  .receipt-thank-you { margin: 2px 0; font-size: 10.5px; color: #444; }
  .receipt-thank-you-bold { font-weight: 900; font-size: 13px; margin: 2px 0 8px 0; letter-spacing: 0.3px; }
  .receipt-timestamp { margin: 7px 0; font-size: 9.5px; color: #777; }
  .receipt-powered { font-size: 8.5px; color: #aaa; margin-top: 6px; }
  .receipt-copy-label {
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    color: #bbb;
    letter-spacing: 1.5px;
    margin-top: 5px;
  }
`;

function receiptBodyHtml(payment, copyLabel) {
  const receiptDate = getReceiptDate(payment);
  const prevBalance = payment.previous_balance != null ? `
    <div class="receipt-divider"></div>
    <div class="receipt-section">
      <h3 class="receipt-section-title">Balance Summary</h3>
      <div class="receipt-row"><span class="receipt-label">Previous Balance:</span><span class="receipt-value">Ksh ${Number(payment.previous_balance || 0).toLocaleString()}</span></div>
      <div class="receipt-row"><span class="receipt-label">Payment:</span><span class="receipt-value">Ksh ${Number(payment.payment_amount ?? payment.amount ?? 0).toLocaleString()}</span></div>
      <div class="receipt-divider-solid"></div>
      <div class="receipt-row receipt-balance-row"><span class="receipt-label">New Balance:</span><span class="receipt-value receipt-balance-value">Ksh ${Number(payment.new_balance || 0).toLocaleString()}</span></div>
    </div>
  ` : "";

  const printed = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
  const showChannel = payment.channel && payment.channel !== "UNKNOWN";

  return `
    <div class="receipt">
      <div class="receipt-watermark">${copyLabel}</div>
      <div class="receipt-content">
        <div class="receipt-header">
          <img src="/images.png" alt="Rocky Driving School" class="receipt-logo-img" />
          <h1 class="receipt-title">Rocky Driving School</h1>
          <p class="receipt-branch">${payment.branch_name || "Main Branch"}</p>
          <div class="receipt-contacts">
            <p>Head Office: +254 700 000 000</p>
            ${payment.branch_phone_number ? `<p>Branch: ${payment.branch_phone_number}</p>` : ""}
            <p>Nairobi, Kenya</p>
            <p>info@rockydrivingschool.co.ke</p>
          </div>
        </div>
        <div class="receipt-divider-thick"></div>
        <div class="receipt-section">
          <div class="receipt-row"><span class="receipt-label">Receipt No:</span><span class="receipt-value">${payment.receipt_number || "—"}</span></div>
          <div class="receipt-row"><span class="receipt-label">Transaction ID:</span><span class="receipt-value">${payment.reference_code || "—"}</span></div>
          <div class="receipt-row"><span class="receipt-label">Date / Time:</span><span class="receipt-value">${formatDateTime(receiptDate)}</span></div>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-section">
          <h3 class="receipt-section-title">Student Details</h3>
          <div class="receipt-row"><span class="receipt-label">Name:</span><span class="receipt-value">${payment.student_name || "—"}</span></div>
          <div class="receipt-row"><span class="receipt-label">Course:</span><span class="receipt-value">${payment.course_name || "—"}</span></div>
          <div class="receipt-row"><span class="receipt-label">Payment Ref:</span><span class="receipt-value">${payment.student_course_reference || "—"}</span></div>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-section">
          <h3 class="receipt-section-title">Payment Details</h3>
          <div class="receipt-amount-block">
            <span class="receipt-amount-label">Amount Paid</span>
            <span class="receipt-amount-value">Ksh ${Number(payment.amount || 0).toLocaleString()}</span>
          </div>
          ${showChannel ? `<div class="receipt-row"><span class="receipt-label">Channel:</span><span class="receipt-value">${payment.channel}</span></div>` : ""}
          ${payment.mpesa_reference ? `<div class="receipt-row"><span class="receipt-label">M-Pesa Ref:</span><span class="receipt-value">${payment.mpesa_reference}</span></div>` : ""}
        </div>
        ${prevBalance}
        <div class="receipt-divider-thick"></div>
        <div class="receipt-footer">
          <div class="receipt-footer-note">
            <p>Payments once made are</p>
            <p>NON-REFUNDABLE and NON-TRANSFERABLE</p>
          </div>
          <div class="receipt-footer-note"><p>WE DO NOT ACCEPT CASH PAYMENTS</p></div>
          <p class="receipt-thank-you">Thank you for choosing</p>
          <p class="receipt-thank-you-bold">Rocky Driving School</p>
          <div class="receipt-timestamp"><p>Printed: ${printed}</p></div>
          <p class="receipt-powered">Powered by Rocky Driving School</p>
          <p class="receipt-copy-label">${copyLabel}</p>
        </div>
      </div>
    </div>
  `;
}

/* ─── React preview component (client copy only) ─────────────────── */
function ReceiptPreview({ payment }) {
  const printed = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
  const receiptDate = getReceiptDate(payment);
  const showChannel = payment.channel && payment.channel !== "UNKNOWN";

  return (
    <div className="receipt">
      <div className="receipt-watermark">client copy</div>
      <div className="receipt-content">
        <div className="receipt-header">
          <img src="/images.png" alt="Rocky Driving School" className="receipt-logo-img" />
          <h1 className="receipt-title">Rocky Driving School</h1>
          <p className="receipt-branch">{payment.branch_name || "Main Branch"}</p>
          <div className="receipt-contacts">
            <p>Head Office: +254 700 000 000</p>
            {payment.branch_phone_number && <p>Branch: {payment.branch_phone_number}</p>}
            <p>Nairobi, Kenya</p>
            <p>info@rockydrivingschool.co.ke</p>
          </div>
        </div>

        <div className="receipt-divider-thick" />

        <div className="receipt-section">
          <div className="receipt-row"><span className="receipt-label">Receipt No:</span><span className="receipt-value">{payment.receipt_number || "—"}</span></div>
          <div className="receipt-row"><span className="receipt-label">Transaction ID:</span><span className="receipt-value">{payment.reference_code || "—"}</span></div>
          <div className="receipt-row"><span className="receipt-label">Date / Time:</span><span className="receipt-value">{formatDateTime(receiptDate)}</span></div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-section">
          <h3 className="receipt-section-title">Student Details</h3>
          <div className="receipt-row"><span className="receipt-label">Name:</span><span className="receipt-value">{payment.student_name || "—"}</span></div>
          <div className="receipt-row"><span className="receipt-label">Course:</span><span className="receipt-value">{payment.course_name || "—"}</span></div>
          <div className="receipt-row"><span className="receipt-label">Payment Ref:</span><span className="receipt-value">{payment.student_course_reference || "—"}</span></div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-section">
          <h3 className="receipt-section-title">Payment Details</h3>
          <div className="receipt-amount-block">
            <span className="receipt-amount-label">Amount Paid</span>
            <span className="receipt-amount-value">{fmt(payment.amount)}</span>
          </div>
          {showChannel && (
            <div className="receipt-row"><span className="receipt-label">Channel:</span><span className="receipt-value">{payment.channel}</span></div>
          )}
          {payment.mpesa_reference && (
            <div className="receipt-row"><span className="receipt-label">M-Pesa Ref:</span><span className="receipt-value">{payment.mpesa_reference}</span></div>
          )}
        </div>

        {payment.previous_balance != null && (
          <>
            <div className="receipt-divider" />
            <div className="receipt-section">
              <h3 className="receipt-section-title">Balance Summary</h3>
              <div className="receipt-row"><span className="receipt-label">Previous Balance:</span><span className="receipt-value">{fmt(payment.previous_balance)}</span></div>
              <div className="receipt-row"><span className="receipt-label">Payment:</span><span className="receipt-value">{fmt(payment.payment_amount ?? payment.amount)}</span></div>
              <div className="receipt-divider-solid" />
              <div className="receipt-row receipt-balance-row">
                <span className="receipt-label">New Balance:</span>
                <span className="receipt-value receipt-balance-value">{fmt(payment.new_balance)}</span>
              </div>
            </div>
          </>
        )}

        <div className="receipt-divider-thick" />

        <div className="receipt-footer">
          <div className="receipt-footer-note">
            <p>Payments once made are</p>
            <p>NON-REFUNDABLE and NON-TRANSFERABLE</p>
          </div>
          <div className="receipt-footer-note"><p>WE DO NOT ACCEPT CASH PAYMENTS</p></div>
          <p className="receipt-thank-you">Thank you for choosing</p>
          <p className="receipt-thank-you-bold">Rocky Driving School</p>
          <div className="receipt-timestamp"><p>Printed: {printed}</p></div>
          <p className="receipt-powered">Powered by Rocky Driving School</p>
          <p className="receipt-copy-label">client copy</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export function PaymentReceipt({ payment: initialPayment, onClose }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [payment, setPayment] = useState(initialPayment);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");

  const printCount = payment.receipt_print_count ?? 0;
  const canPrint = isSuperAdmin || printCount < 1;

  const handlePrint = async () => {
    if (!canPrint) return;
    setError("");
    setPrinting(true);

    try {
      if (!isSuperAdmin) {
        const updated = await paymentsAPI.recordPrint(payment.id);
        setPayment((p) => ({ ...p, ...updated }));
      }

      const printWin = window.open("", "_blank", "width=760,height=900");
      printWin.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
        <style>
          ${RECEIPT_CSS}
          body { margin: 0; padding: 0; background: white; }
          .receipt { box-shadow: none; page-break-after: always; }
          .receipt:last-child { page-break-after: avoid; }
          @media print {
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head><body>
        ${receiptBodyHtml(payment, "client copy")}
        ${receiptBodyHtml(payment, "branch copy")}
      </body></html>`);
      printWin.document.close();
      printWin.focus();
      // Release the loading state before print() blocks the thread
      setPrinting(false);
      printWin.print();
    } catch (err) {
      setError(err.message || "Failed to record print. Please try again.");
      setPrinting(false);
    }
  };

  const alreadyPrinted = !isSuperAdmin && printCount >= 1;

  return (
    <>
      <Modal open onClose={onClose} title="Payment Receipt" maxWidth="max-w-md">
        <div className="space-y-4">

          {alreadyPrinted && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Receipt already printed. Contact admin for additional copies.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Single clean preview — client copy only */}
          <div style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "center" }}>
            <ReceiptPreview payment={payment} />
          </div>

          <div className="flex gap-3 justify-end">
            <Btn variant="outline" onClick={onClose}><X className="w-4 h-4" />Close</Btn>
            {(!alreadyPrinted || isSuperAdmin) && (
              <Btn onClick={handlePrint} disabled={printing}>
                <Printer className="w-4 h-4" />
                {printing ? "Printing…" : "Print Receipt"}
              </Btn>
            )}
          </div>
        </div>
      </Modal>

      <style>{RECEIPT_CSS}</style>
    </>
  );
}
