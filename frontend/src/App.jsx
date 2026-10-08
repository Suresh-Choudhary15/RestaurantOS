import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import MenuPage from './pages/MenuPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import ExpensesPage from './pages/ExpensesPage';
import InvoiceProcessing from './pages/InvoiceProcessing';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

const App = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-slate-800 text-white p-6 flex flex-col gap-4">
          <h1 className="text-xl font-bold mb-6 border-b border-slate-700 pb-2">RestaurantOS</h1>
          <Link to="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          <Link to="/tables" className="hover:text-blue-400 transition-colors">Tables</Link>
          <Link to="/orders" className="hover:text-blue-400 transition-colors">Orders</Link>
          <Link to="/menu" className="hover:text-blue-400 transition-colors">Menu</Link>
          <Link to="/inventory" className="hover:text-blue-400 transition-colors">Inventory</Link>
          <Link to="/suppliers" className="hover:text-blue-400 transition-colors">Suppliers</Link>
          <Link to="/expenses" className="hover:text-blue-400 transition-colors">Expenses</Link>
          <Link to="/invoice-processing" className="hover:text-blue-400 transition-colors">Invoice Processing</Link>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/dashboard" element={<AnalyticsDashboard />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/invoice-processing" element={<InvoiceProcessing />} />
            <Route path="/" element={<div className="text-center mt-20">
              <h2 className="text-3xl font-bold">Welcome to RestaurantOS</h2>
              <p className="text-gray-600 mt-2">Please select a module from the sidebar to begin.</p>
            </div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
