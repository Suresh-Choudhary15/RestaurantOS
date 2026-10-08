import React, { useEffect, useState } from "react";
import { inventoryService } from "../services/api";

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", unit: "" });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await inventoryService.getAll();
      const resData = response.data;

      // Extract array safely across common Express wrapper formats
      const itemsList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.data?.inventory)
          ? resData.data.inventory
          : Array.isArray(resData?.data?.ingredients)
            ? resData.data.ingredients
            : Array.isArray(resData?.data)
              ? resData.data
              : Array.isArray(resData?.inventory)
                ? resData.inventory
                : [];

      setItems(itemsList);
    } catch (error) {
      console.error("Error loading inventory:", error);
      setItems([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.create({
        ...newItem,
        quantity: Number(newItem.quantity) || 0,
      });
      setNewItem({ name: "", quantity: "", unit: "" });
      loadInventory();
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          className="border p-2"
          placeholder="Ingredient Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Quantity"
          type="number"
          value={newItem.quantity}
          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Unit (kg, L, etc)"
          value={newItem.unit}
          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
        />
        <button className="bg-yellow-500 text-white px-4 py-2 rounded">
          Add Ingredient
        </button>
      </form>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Ingredient</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Unit</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(items) && items.length > 0 ? (
            items.map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.name}</td>
                <td className="border p-2">{item.quantity}</td>
                <td className="border p-2">{item.unit}</td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      inventoryService.delete(item.id).then(loadInventory)
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
                No inventory items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryPage;
