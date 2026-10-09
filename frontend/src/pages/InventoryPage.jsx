import React, { useEffect, useState } from "react";
import api from "../services/api";

const InventoryPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(""); // "in" or "out"
  const [formData, setFormData] = useState({
    quantity: "",
    reason: "",
    reference: "",
  });
  const [showMovements, setShowMovements] = useState(false);

  useEffect(() => {
    loadIngredients();
    loadMovements();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const response = await api.get("/inventory");
      const itemsList = response.data?.data?.ingredients || [];
      setIngredients(itemsList);
      setError("");
    } catch (err) {
      setError("Failed to load ingredients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const response = await api.get("/inventory/movements");
      const movementsList = response.data?.data?.movements || [];
      setMovements(movementsList);
    } catch (err) {
      console.error("Failed to load movements:", err);
    }
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!selectedIngredient) return;

    try {
      setLoading(true);
      setError("");

      const quantity = Number(formData.quantity);
      if (quantity <= 0) {
        setError("Quantity must be greater than 0");
        return;
      }

      await api.post("/inventory/stock-in", {
        ingredientId: selectedIngredient.id,
        quantity,
        reason: formData.reason,
        reference: formData.reference || undefined,
      });

      setSuccess("Stock added successfully");
      setShowModal(false);
      setFormData({ quantity: "", reason: "", reference: "" });
      loadIngredients();
      loadMovements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  const handleStockOut = async (e) => {
    e.preventDefault();
    if (!selectedIngredient) return;

    try {
      setLoading(true);
      setError("");

      const quantity = Number(formData.quantity);
      if (quantity <= 0) {
        setError("Quantity must be greater than 0");
        return;
      }

      if (quantity > Number(selectedIngredient.currentStock)) {
        setError(
          `Insufficient stock. Available: ${selectedIngredient.currentStock} ${selectedIngredient.unit}`
        );
        return;
      }

      await api.post("/inventory/stock-out", {
        ingredientId: selectedIngredient.id,
        quantity,
        reason: formData.reason,
        reference: formData.reference || undefined,
      });

      setSuccess("Stock removed successfully");
      setShowModal(false);
      setFormData({ quantity: "", reason: "", reference: "" });
      loadIngredients();
      loadMovements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove stock");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (ingredient, mode) => {
    setSelectedIngredient(ingredient);
    setModalMode(mode);
    setShowModal(true);
    setFormData({ quantity: "", reason: "", reference: "" });
    setError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIngredient(null);
    setModalMode("");
    setFormData({ quantity: "", reason: "", reference: "" });
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Inventory Management
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {loading && !showModal && (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            Loading...
          </div>
        )}

        {/* Ingredients Table */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Ingredient
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Reorder Level
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Cost/Unit
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ingredients && ingredients.length > 0 ? (
                  ingredients.map((ingredient) => (
                    <tr
                      key={ingredient.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {ingredient.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            Number(ingredient.currentStock) <=
                            Number(ingredient.reorderLevel)
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {Number(ingredient.currentStock).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {ingredient.unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {Number(ingredient.reorderLevel).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        ${Number(ingredient.costPerUnit).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => openModal(ingredient, "in")}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                        >
                          +In
                        </button>
                        <button
                          onClick={() => openModal(ingredient, "out")}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          -Out
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No ingredients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movement History Toggle */}
        <button
          onClick={() => setShowMovements(!showMovements)}
          className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          {showMovements ? "Hide" : "Show"} Movement History
        </button>

        {/* Movement History */}
        {showMovements && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stock Movements
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Ingredient
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      By
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {movements && movements.length > 0 ? (
                    movements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {movement.ingredient?.name}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              movement.type === "IN"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {movement.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {Number(movement.quantity).toFixed(2)}{" "}
                          {movement.ingredient?.unit}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {movement.reason}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {movement.reference || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {movement.createdBy?.firstName}{" "}
                          {movement.createdBy?.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(movement.createdAt).toLocaleDateString()}{" "}
                          {new Date(movement.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        No movements recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalMode === "in" ? "Stock In" : "Stock Out"} -{" "}
                {selectedIngredient.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Current Stock: {Number(selectedIngredient.currentStock).toFixed(2)}{" "}
                {selectedIngredient.unit}
              </p>
            </div>

            <form
              onSubmit={modalMode === "in" ? handleStockIn : handleStockOut}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Delivery, Usage, Adjustment"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="e.g., PO-123, INV-456"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
                    modalMode === "in"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? "Processing..." : modalMode === "in" ? "Add Stock" : "Remove Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
