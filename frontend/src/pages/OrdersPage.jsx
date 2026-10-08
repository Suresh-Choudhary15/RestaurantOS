import React, { useEffect, useState } from "react";
import { orderService } from "../services/api";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderService.getAll();
      const resData = response.data;

      const ordersList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.data?.orders)
          ? resData.data.orders
          : Array.isArray(resData?.data)
            ? resData.data
            : Array.isArray(resData?.orders)
              ? resData.orders
              : [];

      setOrders(ordersList);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Orders Management</h1>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Order ID</th>
            <th className="border p-2">Table</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(orders) && orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.id}>
                <td className="border p-2">{order.id}</td>
                <td className="border p-2">
                  {order.tableId || order.table?.tableNumber || "N/A"}
                </td>
                <td className="border p-2">{order.status}</td>
                <td className="border p-2">
                  $
                  {order.totalAmount
                    ? Number(order.totalAmount).toFixed(2)
                    : "0.00"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="border p-4 text-center text-gray-500">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersPage;
