import React, { useEffect, useState } from "react";
import { expenseService } from "../services/api";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    description: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const response = await expenseService.getAll();
      const resData = response.data;

      // Extract array safely across envelope wrappers
      const expensesList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.data?.expenses)
          ? resData.data.expenses
          : Array.isArray(resData?.data)
            ? resData.data
            : Array.isArray(resData?.expenses)
              ? resData.expenses
              : [];

      setExpenses(expensesList);
    } catch (error) {
      console.error("Error loading expenses:", error);
      setExpenses([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await expenseService.create(newExpense);
      setNewExpense({ amount: "", description: "", category: "", date: "" });
      loadExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Expenses Management</h1>
      <form onSubmit={handleCreate} className="mb-6 grid grid-cols-2 gap-2">
        <input
          className="border p-2"
          placeholder="Amount"
          type="number"
          value={newExpense.amount}
          onChange={(e) =>
            setNewExpense({ ...newExpense, amount: e.target.value })
          }
        />
        <input
          className="border p-2"
          placeholder="Category"
          value={newExpense.category}
          onChange={(e) =>
            setNewExpense({ ...newExpense, category: e.target.value })
          }
        />
        <input
          className="border p-2"
          placeholder="Description"
          value={newExpense.description}
          onChange={(e) =>
            setNewExpense({ ...newExpense, description: e.target.value })
          }
        />
        <input
          className="border p-2"
          type="date"
          value={newExpense.date}
          onChange={(e) =>
            setNewExpense({ ...newExpense, date: e.target.value })
          }
        />
        <button className="bg-red-400 text-white px-4 py-2 rounded col-span-2">
          Add Expense
        </button>
      </form>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(expenses) && expenses.length > 0 ? (
            expenses.map((e) => (
              <tr key={e.id}>
                <td className="border p-2">
                  {e.date ? new Date(e.date).toLocaleDateString() : "N/A"}
                </td>
                <td className="border p-2">{e.category}</td>
                <td className="border p-2">${e.amount}</td>
                <td className="border p-2">{e.description}</td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      expenseService.delete(e.id).then(loadExpenses)
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
              <td colSpan="5" className="border p-4 text-center text-gray-500">
                No expenses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpensesPage;
