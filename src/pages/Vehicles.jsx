import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Btn, Toast, useToast } from "../ui";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { vehiclesAPI } from "../api/vehicles.api";
import { VehicleKpiCards } from "../components/vehicles/VehicleKpiCards";
import { VehicleCharts } from "../components/vehicles/VehicleCharts";
import { VehicleTable } from "../components/vehicles/VehicleTable";
import { VehicleModal } from "../components/vehicles/VehicleModal";

const QUICK_FILTERS = [
  { key: "all",               label: "All Vehicles" },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 to-slate-100 p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Global fleet — insurance, inspection & utilisation tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setQuickFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                quickFilter === f.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
          <Btn onClick={() => { setEditVehicle(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Vehicle
          </Btn>
        </div>
      </div>

      <VehicleKpiCards stats={stats} loading={loading} />
      <VehicleCharts vehicles={vehicles} />
      <VehicleTable
        vehicles={vehicles}
        loading={loading}
        quickFilter={quickFilter === "all" ? "" : quickFilter}
        onEdit={(v) => { setEditVehicle(v); setModalOpen(true); }}
        onDelete={setDeleteTarget}
      />

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
