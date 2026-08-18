import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Modal, Btn, Label, Input } from "../../ui";
import { vehiclesAPI } from "../../api/vehicles.api";
import request from "../../api/client";

const VEHICLE_TYPES = ["Sedan", "SUV", "Hatchback", "Pickup", "Van", "Minibus", "Truck", "Motorcycle"];

export function VehicleModal({ open, onClose, onSaved, vehicle, isSuperAdmin }) {
  const isEdit = !!vehicle;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (isSuperAdmin) request("/api/branches/").then(setBranches).catch(() => {});
  }, [isSuperAdmin]);

  useEffect(() => {
    if (open) {
      reset(vehicle
        ? {
            registration_number: vehicle.registration_number,
            vehicle_name: vehicle.vehicle_name,
            vehicle_type: vehicle.vehicle_type,
            insurance_status: vehicle.insurance_status,
            insurance_expiry_date: vehicle.insurance_expiry_date ?? "",
            inspection_status: vehicle.inspection_status,
            inspection_due_date: vehicle.inspection_due_date ?? "",
            branch: vehicle.branch ?? "",
          }
        : {
            registration_number: "", vehicle_name: "", vehicle_type: "",
            insurance_status: "ACTIVE", insurance_expiry_date: "",
            inspection_status: "NOT_DUE", inspection_due_date: "",
            branch: "",
          }
      );
    }
  }, [open, vehicle, reset]);

  const onSubmit = async (data) => {
    const payload = { ...data };
    if (isSuperAdmin && !payload.branch) delete payload.branch; // leave null if not selected
    if (isEdit) await vehiclesAPI.update(vehicle.id, payload);
    else await vehiclesAPI.create(payload);
    onSaved();
    onClose();
  };

  const sel = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a0a0b]/10 focus:border-gray-400 transition-colors";
  const err = "text-xs text-red-500 mt-1";

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Vehicle" : "Add Vehicle"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input id="registration_number" placeholder="KAA 000A" {...register("registration_number", { required: true })} />
            {errors.registration_number && <p className={err}>Required</p>}
          </div>
          <div>
            <Label htmlFor="vehicle_name">Vehicle Name</Label>
            <Input id="vehicle_name" placeholder="Toyota Corolla" {...register("vehicle_name", { required: true })} />
            {errors.vehicle_name && <p className={err}>Required</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="vehicle_type">Vehicle Type</Label>
          <select id="vehicle_type" {...register("vehicle_type", { required: true })} className={sel}>
            <option value="">Select type…</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.vehicle_type && <p className={err}>Required</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="insurance_status">Insurance Status</Label>
            <select id="insurance_status" {...register("insurance_status")} className={sel}>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div>
            <Label htmlFor="insurance_expiry_date">Insurance Expiry</Label>
            <Input id="insurance_expiry_date" type="date" {...register("insurance_expiry_date")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inspection_status">Inspection Status</Label>
            <select id="inspection_status" {...register("inspection_status")} className={sel}>
              <option value="NOT_DUE">Not Due</option>
              <option value="DUE">Due</option>
            </select>
          </div>
          <div>
            <Label htmlFor="inspection_due_date">Inspection Due Date</Label>
            <Input id="inspection_due_date" type="date" {...register("inspection_due_date")} />
          </div>
        </div>

        {isSuperAdmin && (
          <div>
            <Label htmlFor="branch">Branch <span className="text-gray-400 font-normal">(leave blank for general)</span></Label>
            <select id="branch" {...register("branch")} className={sel}>
              <option value="">General / All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="outline" onClick={onClose} type="button">Cancel</Btn>
          <Btn type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Vehicle"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
