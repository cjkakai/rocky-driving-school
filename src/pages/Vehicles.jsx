import { useState, useEffect, useCallback } from "react";
import { Plus, Car } from "lucide-react";
import { Btn, Toast, useToast } from "../ui";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { vehiclesAPI } from "../api/vehicles.api";
import { VehicleKpiCards } from "../components/vehicles/VehicleKpiCards";
import { VehicleCharts } from "../components/vehicles/VehicleCharts";
import { VehicleTable } from "../components/vehicles/VehicleTable";
import { VehicleModal } from "../components/vehicles/VehicleModal";

const QUICK_FILTERS = [
  { key: "all",               label: "All" },
  { key: "active_insurance",  label: "Active Insurance" },
  { key: "expired_insurance", label: "Expired Insurance" },
  { key: "inspection_due",    label: "Inspection Due" },
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast, show, hide } = useToast();

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([vehiclesAPI.list(), vehiclesAPI.stats()])
      .then(([vRes, sRes]) => {
        setVehicles(Array.isArray(vRes) ? vRes : vRes.results ?? []);
        setStats(sRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSaved = () => { loadAll(); show(editVehicle ? "Vehicle updated" : "Vehicle added"); };
  const handleDelete = async () => {
    await vehiclesAPI.delete(deleteTarget.id);
    setDeleteTarget(null);
    loadAll();
    show("Vehicle deleted");
  };

  return (
    <div className="min-h-screen">

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a0a0b] flex items-center justify-center shadow-md shrink-0">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                Vehicle Management
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                Fleet · insurance, inspection & utilisation tracking
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick filter pill track */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setQuickFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    quickFilter === f.key
                      ? "bg-[#1a0a0b] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Btn onClick={() => { setEditVehicle(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Vehicle
            </Btn>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <VehicleKpiCards stats={stats} loading={loading} />
        <VehicleCharts vehicles={vehicles} />
        <VehicleTable
          vehicles={vehicles}
          loading={loading}
          quickFilter={quickFilter === "all" ? "" : quickFilter}
          onEdit={(v) => { setEditVehicle(v); setModalOpen(true); }}
          onDelete={setDeleteTarget}
        />
      </div>

      <VehicleModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditVehicle(null); }}
        onSaved={handleSaved}
        vehicle={editVehicle}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Delete "${deleteTarget?.registration_number} — ${deleteTarget?.vehicle_name}"? This cannot be undone.`}
      />
      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
