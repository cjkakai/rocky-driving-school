import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal, Btn } from "../../ui";
import { paymentsAPI } from "../../api/payments.api";
import { DetailRow, METHOD_LABELS } from "./paymentUtils";

export function PaymentDetailModal({ paymentId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsAPI
      .getById(paymentId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [paymentId]);

  const sd = detail?.source_detail;

  return (
    <Modal open onClose={onClose} title="Transaction Detail" maxWidth="max-w-lg">
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      ) : !detail ? (
        <p className="text-sm text-red-500">Failed to load.</p>
      ) : (
        <div className="space-y-5">
          {sd ? (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Payment Source
              </p>
              {sd.source === "bank_ipn" && (
                <>
                  <DetailRow label="Transaction ID" value={sd.transaction_id} />
                  <DetailRow label="Account No" value={sd.account_number} />
                  <DetailRow label="Amount" value={sd.amount} />
                  <DetailRow label="Currency" value={sd.currency} />
                  <DetailRow label="Narration" value={sd.narration} />
                  <DetailRow label="Payment Ref" value={sd.payment_ref} />
                  <DetailRow label="Event Type" value={sd.event_type} />
                  <DetailRow label="Posting Date" value={sd.posting_date} />
                  <DetailRow label="Value Date" value={sd.value_date} />
                  <DetailRow label="Transaction Date" value={sd.transaction_date} />
                  <DetailRow label="Booked Balance" value={sd.booked_balance} />
                  <DetailRow label="Cleared Balance" value={sd.cleared_balance} />
                  <DetailRow label="Exchange Rate" value={sd.exchange_rate} />
                  <DetailRow label="Memo Line 1" value={sd.cust_memo_line1} />
                  <DetailRow label="Memo Line 2" value={sd.cust_memo_line2} />
                  <DetailRow label="Memo Line 3" value={sd.cust_memo_line3} />
                </>
              )}
              {sd.source === "bank_b2b" && (
                <>
                  <DetailRow label="Txn Reference" value={sd.transaction_reference_code} />
                  <DetailRow label="Payment Ref Code" value={sd.payment_reference_code} />
                  <DetailRow label="Doc Reference" value={sd.document_reference_number} />
                  <DetailRow label="Account No" value={sd.account_number} />
                  <DetailRow label="Account Name" value={sd.account_name} />
                  <DetailRow label="Payment Amount" value={sd.payment_amount} />
                  <DetailRow label="Total Amount" value={sd.total_amount} />
                  <DetailRow label="Currency" value={sd.currency} />
                  <DetailRow label="Payment Mode" value={sd.payment_mode} />
                  <DetailRow label="Payment Code" value={sd.payment_code} />
                  <DetailRow label="Bank Code" value={sd.bank_code} />
                  <DetailRow label="Branch Code" value={sd.branch_code} />
                  <DetailRow label="Institution" value={sd.institution_name} />
                  <DetailRow label="Institution Code" value={sd.institution_code} />
                  <DetailRow label="Additional Info" value={sd.additional_info} />
                  <DetailRow label="Transaction Date" value={sd.transaction_date} />
                  <DetailRow label="Payment Date" value={sd.payment_date} />
                </>
              )}
              {sd.source === "coop_stk" && (
                <>
                  <DetailRow label="Checkout Request ID" value={sd.checkout_request_id} />
                  <DetailRow label="Merchant Request ID" value={sd.merchant_request_id} />
                  <DetailRow label="Phone" value={sd.phone_number} />
                  <DetailRow label="Amount" value={sd.amount} />
                  <DetailRow label="Account Reference" value={sd.account_reference} />
                  <DetailRow label="STK Status" value={sd.status} />
                  <DetailRow label="Result Code" value={sd.result_code} />
                  <DetailRow label="Result Description" value={sd.result_desc} />
                  <DetailRow label="M-Pesa Receipt" value={sd.mpesa_receipt} />
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No source data available.</p>
          )}

          <div className="flex justify-end">
            <Btn variant="outline" onClick={onClose}>
              Close
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}
