import React, { useEffect, useState } from "react";
import { supplierService } from "../services/api";

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      const resData = response.data;

      const suppliersList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.data?.suppliers)
          ? resData.data.suppliers
          : Array.isArray(resData?.data)
            ? resData.data
            : Array.isArray(resData?.suppliers)
              ? resData.suppliers
              : [];

      setSuppliers(suppliersList);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await supplierService.create(newSupplier);
      setNewSupplier({ name: "", contactPerson: "", email: "", phone: "" });
      loadSuppliers();
    } catch (error) {
      console.error("Error creating supplier:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supplier Management</h1>
      <form onSubmit={handleCreate} className="mb-6 grid grid-cols-2 gap-2">
        <input
          className="border p-2"
          placeholder="Company Name"
          value={newSupplier.name}
          onChange={(e) =>
            setNewSupplier({ ...newSupplier, name: e.target.value })
          }
        />
        <input
          className="border p-2"
          placeholder="Contact Person"
          value={newSupplier.contactPerson}
          onChange={(e) =>
            setNewSupplier({ ...newSupplier, contactPerson: e.target.value })
          }
        />
        <input
          className="border p-2"
          placeholder="Email"
          value={newSupplier.email}
          onChange={(e) =>
            setNewSupplier({ ...newSupplier, email: e.target.value })
          }
        />
        <input
          className="border p-2"
          placeholder="Phone"
          value={newSupplier.phone}
          onChange={(e) =>
            setNewSupplier({ ...newSupplier, phone: e.target.value })
          }
        />
        <button className="bg-purple-500 text-white px-4 py-2 rounded col-span-2">
          Add Supplier
        </button>
      </form>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Company</th>
            <th className="border p-2">Contact</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(suppliers) && suppliers.length > 0 ? (
            suppliers.map((s) => (
              <tr key={s.id}>
                <td className="border p-2">{s.name}</td>
                <td className="border p-2">{s.contactPerson}</td>
                <td className="border p-2">{s.email}</td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      supplierService.delete(s.id).then(loadSuppliers)
                    }
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="border p-4 text-center text-gray-500">
                No suppliers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SuppliersPage;
