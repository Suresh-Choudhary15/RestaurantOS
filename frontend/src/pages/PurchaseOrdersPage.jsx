import { useState, useEffect } from 'react';
import api from '../services/api';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); // 'create', 'view', 'edit'
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDate: '',
    notes: '',
    items: [],
  });

  useEffect(() => {
    loadOrders();
    loadSuppliers();
    loadIngredients();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/purchase-orders');
      setOrders(response.data?.data?.orders || []);
      setError('');
    } catch (err) {
      setError('Failed to load purchase orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data?.data?.suppliers || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const loadIngredients = async () => {
    try {
      const response = await api.get('/inventory');
      setIngredients(response.data?.data?.ingredients || []);
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      supplierId: '',
      expectedDate: '',
      notes: '',
      items: [{ ingredientId: '', quantity: '', unitPrice: '' }],
    });
    setShowModal(true);
    setError('');
  };

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setModalMode('view');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setModalMode('');
    setFormData({ supplierId: '', expectedDate: '', notes: '', items: [] });
    setError('');
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ingredientId: '', quantity: '', unitPrice: '' }],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.supplierId) {
      setError('Please select a supplier');
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].ingredientId) {
      setError('Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      await api.post('/purchase-orders', formData);
      setSuccess('Purchase order created successfully');
      closeModal();
      loadOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (newStatus === 'RECEIVED') {
      if (!window.confirm('Mark this order as RECEIVED? This will add the items to inventory.')) {
        return;
      }
    }

    try {
      setLoading(true);
      await api.patch(`/purchase-orders/${orderId}/status`, { status: newStatus });
      setSuccess(`Order status updated to ${newStatus}`);
      loadOrders();
      closeModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Delete this purchase order? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/purchase-orders/${orderId}`);
      setSuccess('Purchase order deleted successfully');
      loadOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete purchase order');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus && order.status !== filterStatus) return false;
    if (filterSupplier && order.supplier?.id !== filterSupplier) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'ORDERED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Purchase Orders
          </h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            + New Purchase Order
          </button>
        </div>

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

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Expected Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading && !showModal ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {order.supplier?.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {order.expectedDate
                          ? new Date(order.expectedDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {order.items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => openViewModal(order)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        {order.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'ORDERED')}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Order
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {order.status === 'ORDERED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'RECEIVED')}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Receive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No purchase orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full mx-4 my-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {modalMode === 'create' ? 'Create Purchase Order' : 'Purchase Order Details'}
              </h2>
            </div>

            {modalMode === 'create' ? (
              <form onSubmit={handleCreate} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Supplier *
                    </label>
                    <select
                      required
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Expected Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Items *
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <select
                          required
                          value={item.ingredientId}
                          onChange={(e) => updateItem(index, 'ingredientId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="">Select Ingredient</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <span className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                          ${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-right">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Total: ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Purchase Order'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Supplier</span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedOrder?.supplier?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder?.status)}`}>
                        {selectedOrder?.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Order Date</span>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedOrder?.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Expected Date</span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedOrder?.expectedDate
                        ? new Date(selectedOrder.expectedDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>

                {selectedOrder?.notes && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Notes</span>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Items
                  </h3>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Ingredient</th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Quantity</th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Unit Price</th>
                        <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedOrder?.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {item.ingredient?.name}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {Number(item.quantity).toFixed(2)} {item.ingredient?.unit}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            ${Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-white font-semibold">
                            ${Number(item.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan="3" className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          Total Amount:
                        </td>
                        <td className="px-4 py-2 font-bold text-gray-900 dark:text-white">
                          ${Number(selectedOrder?.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedOrder?.status === 'ORDERED' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded text-sm text-blue-800 dark:text-blue-200">
                    ℹ️  Marking this order as RECEIVED will automatically add these items to your inventory.
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Close
                  </button>
                  {selectedOrder?.status === 'ORDERED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'RECEIVED')}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Mark as Received'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
