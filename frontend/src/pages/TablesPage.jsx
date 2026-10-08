import React, { useEffect, useState } from "react";
import { tableService } from "../services/api";

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ tableNumber: "", capacity: "" });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await tableService.getAll();
      const resData = response.data;

      const tablesList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.data?.tables)
          ? resData.data.tables
          : Array.isArray(resData?.data)
            ? resData.data
            : Array.isArray(resData?.tables)
              ? resData.tables
              : [];

      setTables(tablesList);
    } catch (error) {
      console.error("Error loading tables:", error);
      setTables([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tableService.create({
        ...newTable,
        capacity: Number(newTable.capacity) || 0,
      });
      setNewTable({ tableNumber: "", capacity: "" });
      loadTables();
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Table Management</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          className="border p-2"
          placeholder="Table Number"
          value={newTable.tableNumber}
          onChange={(e) =>
            setNewTable({ ...newTable, tableNumber: e.target.value })
          }
        />
        <input
          className="border p-2"
          placeholder="Capacity"
          type="number"
          value={newTable.capacity}
          onChange={(e) =>
            setNewTable({ ...newTable, capacity: e.target.value })
          }
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Table
        </button>
      </form>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Number</th>
            <th className="border p-2">Capacity</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(tables) && tables.length > 0 ? (
            tables.map((table) => (
              <tr key={table.id}>
                <td className="border p-2">{table.tableNumber}</td>
                <td className="border p-2">{table.capacity}</td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      tableService.delete(table.id).then(loadTables)
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
              <td colSpan="3" className="border p-4 text-center text-gray-500">
                No tables found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TablesPage;
