"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/address";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants";
import type { Address } from "@prisma/client";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<AddressInput>({ resolver: zodResolver(addressSchema) });

  const fetchAddresses = async () => {
    const res = await fetch("/api/users/addresses");
    const data = await res.json();
    setAddresses(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openAdd = () => {
    reset({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    reset({
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      type: addr.type as "HOME" | "WORK" | "OTHER",
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setModalOpen(true);
  };

  const onSubmit = async (data: AddressInput) => {
    const url = editingId ? `/api/users/addresses/${editingId}` : "/api/users/addresses";
    const method = editingId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setModalOpen(false);
    fetchAddresses();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/users/addresses/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchAddresses();
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-xl font-bold text-earth-dark">Saved Addresses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your delivery addresses</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4" /> Add New
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 rounded-xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No addresses saved yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-earth-dark">{addr.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5 capitalize">
                      {addr.type.toLowerCase()}
                    </span>
                    {addr.isDefault && (
                      <span className="text-xs bg-brand-100 text-brand-700 rounded px-2 py-0.5">Default</span>
                    )}
                  </div>
                  <p className="text-gray-600">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                  <p className="text-gray-600">{addr.city}, {addr.state} – {addr.pincode}</p>
                  <p className="text-gray-500">{addr.phone}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(addr)} className="text-gray-400 hover:text-brand-600 p-1">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(addr.id)} className="text-gray-400 hover:text-spice-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Address" : "Add New Address"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" error={errors.name?.message} {...register("name")} />
            <Input label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
          </div>
          <Input label="Address Line 1" error={errors.addressLine1?.message} {...register("addressLine1")} />
          <Input label="Address Line 2 (optional)" {...register("addressLine2")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" error={errors.city?.message} {...register("city")} />
            <Input label="Pincode (6 digits)" error={errors.pincode?.message} {...register("pincode")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-dark mb-1.5">State</label>
            <select
              {...register("state")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-earth-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select state</option>
              {INDIAN_STATES_AND_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p className="text-xs text-spice-600 mt-1">{errors.state.message}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-dark mb-1.5">Type</label>
              <select
                {...register("type")}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-earth-dark mt-5 cursor-pointer">
              <input type="checkbox" {...register("isDefault")} className="rounded" />
              Set as default
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingId ? "Save Changes" : "Add Address"}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Address"
        description="Are you sure you want to delete this address? This action cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
