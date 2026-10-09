import React, { useEffect, useState } from "react";
import { menuService } from "../services/api";

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "" });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const response = await menuService.getAll();
      const resData = response.data;

      const itemsList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.data?.items)
          ? resData.data.items
          : Array.isArray(resData?.data?.menuItems)
            ? resData.data.menuItems
            : Array.isArray(resData?.data)
              ? resData.data
              : Array.isArray(resData?.items)
                ? resData.items
                : [];

      setMenuItems(itemsList);
    } catch (error) {
      console.error("Error loading menu:", error);
      setMenuItems([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await menuService.create({
        ...newItem,
        price: parseFloat(newItem.price) || 0,
      });
      setNewItem({ name: "", price: "", category: "" });
      loadMenu();
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Menu Management</h1>
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          className="border p-2"
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Price"
          type="number"
          step="0.01"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
        />
        <input
          className="border p-2"
          placeholder="Category"
          value={newItem.category}
          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Add Item
        </button>
      </form>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(menuItems) && menuItems.length > 0 ? (
            menuItems.map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.name}</td>
                <td className="border p-2">
                  {typeof item.category === "object"
                    ? (item.category?.name ?? "Uncategorized")
                    : item.category || "Uncategorized"}
                </td>
                <td className="border p-2">${Number(item.price).toFixed(2)}</td>
                <td className="border p-2">
                  <button
                    onClick={() => menuService.delete(item.id).then(loadMenu)}
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
                No menu items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MenuPage;
