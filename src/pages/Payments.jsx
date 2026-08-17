import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Download, RefreshCw, CheckCircle } from "lucide-react";
import { useRefreshButton } from "../hooks/useRefreshButton";
import { Btn, Toast, useToast } from "../ui";
import { paymentsAPI } from "../api/payments.api";
import { branchesAPI } from "../api/branches.api";
import { useAuth } from "../context/AuthContext";
import { PaymentReceipt } from "../components/payments/PaymentReceipt";
import { PaymentPeriodFilter } from "../components/payments/PaymentPeriodFilter";
import { PaymentsSummary } from "../components/payments/PaymentsSummary";
import { PaymentsFilters } from "../components/payments/PaymentsFilters";
import { PaymentsTable } from "../components/payments/PaymentsTable";
import { PaymentDetailModal } from "../components/payments/PaymentDetailModal";
import { AllocateModal } from "../components/payments/AllocateModal";

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function Payments() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [payments, setPayments]     = useState([]);
  const [branches, setBranches]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [summary, setSummary]       = useState(null);

  const [search, setSearch]               = useState("");
  const [filterBranch, setFilterBranch]   = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [filterPaymentType, setFilterPaymentType] = useState("");
  const [filterChannel, setFilterChannel]         = useState("");
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");

  const [page, setPage]             = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [allocating, setAllocating]             = useState(null);
  const [printingReceipt, setPrintingReceipt]   = useState(null);
  const [viewingDetail, setViewingDetail]       = useState(null);
  const [exporting, setExporting]               = useState(false);

  const { toast, show: showToast, hide: hideToast } = useToast();

  const currentParams = useMemo(() => ({
    page,
    page_size: 20,
    ...(search                        && { search }),
    ...(isSuperAdmin && filterBranch  && { branch_id: filterBranch }),
    ...(!isSuperAdmin
      ? { status: "completed" }
      : filterStatus
      ? { status: filterStatus }
      : {}),
    ...(filterPaymentType             && { payment_type: filterPaymentType }),
    ...(filterChannel                 && { channel: filterChannel }),
    ...(dateFrom                      && { date_from: dateFrom }),
    ...(dateTo                        && { date_to: dateTo }),
  }), [page, search, filterBranch, filterStatus, filterPaymentType, filterChannel, dateFrom, dateTo, isSuperAdmin]);

  const summaryParams = useMemo(() => {
    const p = { ...currentParams };
    delete p.page;
    delete p.page_size;
    return p;
  }, [currentParams]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await paymentsAPI.getAll(currentParams);
      setPayments(data.results ?? []);
      setTotalCount(data.count ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (err) {
      setError(err.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [currentParams]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const fetchSummary = useCallback(() => {
    paymentsAPI.getSummary(summaryParams).then(setSummary).catch(() => {});
  }, [summaryParams]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    if (isSuperAdmin) branchesAPI.getAll().then(setBranches).catch(() => {});
  }, [isSuperAdmin]);

  const doRefresh = useCallback(async () => {
    await fetchPayments();
    fetchSummary();
  }, [fetchPayments, fetchSummary]);
  const { refreshState, triggerRefresh } = useRefreshButton(doRefresh);

  const handleExport = async () => {
    setExporting(true);
    try {
      await paymentsAPI.export(summaryParams);
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen space-y-5 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track and manage student payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRefresh}
            disabled={refreshState !== "idle"}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm ${
              refreshState === "done"
                ? "bg-blue-600 text-white border border-blue-600"
                : "border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            }`}
          >
            {refreshState === "loading" && <RefreshCw className="w-4 h-4 animate-spin" />}
            {refreshState === "done"    && <CheckCircle className="w-4 h-4" />}
            {refreshState === "idle"    && <RefreshCw className="w-4 h-4" />}
            {refreshState === "done" ? "Updated" : "Refresh"}
          </button>
          <Btn variant="outline" onClick={handleExport} disabled={exporting} className="flex items-center gap-2 text-sm">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </Btn>
        </div>
      </div>

      {/* ── Summary ── */}
      <PaymentsSummary summary={summary} isSuperAdmin={isSuperAdmin} />

      {/* ── Period filter ── */}
      <PaymentPeriodFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={({ dateFrom: f, dateTo: t }) => {
          setDateFrom(f);
          setDateTo(t);
          setPage(1);
        }}
      />

      {/* ── Filters ── */}
      <PaymentsFilters
        search={search}
        setSearch={setSearch}
        isSuperAdmin={isSuperAdmin}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPaymentType={filterPaymentType}
        setFilterPaymentType={setFilterPaymentType}
        filterChannel={filterChannel}
        setFilterChannel={setFilterChannel}
        branches={branches}
        setPage={setPage}
      />

      {/* ── Table ── */}
      <PaymentsTable
        payments={payments}
        loading={loading}
        error={error}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        totalPages={totalPages}
        isSuperAdmin={isSuperAdmin}
        filterStatus={filterStatus}
        onViewDetail={setViewingDetail}
        onAllocate={setAllocating}
        onPrintReceipt={setPrintingReceipt}
      />

      {/* ── Modals ── */}
      {viewingDetail && (
        <PaymentDetailModal
          paymentId={viewingDetail}
          onClose={() => setViewingDetail(null)}
        />
      )}

      {allocating && (
        <AllocateModal
          payment={allocating}
          onClose={() => setAllocating(null)}
          onSuccess={() => {
            setAllocating(null);
            fetchPayments();
            fetchSummary();
            showToast("Payment allocated successfully");
          }}
        />
      )}

      {printingReceipt && (
        <PaymentReceipt
          payment={printingReceipt}
          onClose={() => setPrintingReceipt(null)}
        />
      )}

      <Toast toast={toast} onHide={hideToast} />
    </div>
  );
}