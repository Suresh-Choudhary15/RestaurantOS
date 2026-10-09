import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "./services/api";
import LoginPage from "./pages/LoginPage";

import TablesPage from "./pages/TablesPage";
import OrdersPage from "./pages/OrdersPage";
import MenuPage from "./pages/MenuPage";
import InventoryPage from "./pages/InventoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import ExpensesPage from "./pages/ExpensesPage";
import InvoiceProcessing from "./pages/InvoiceProcessing";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";

function ProtectedRoute({ user, children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RestaurantLayout({ user, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <nav className="flex w-64 flex-col gap-4 bg-slate-800 p-6 text-white">
        <h1 className="mb-2 border-b border-slate-700 pb-4 text-xl font-bold">
          RestaurantOS
        </h1>

        <p className="mb-2 break-words text-xs text-slate-300">
          {user.email}
        </p>

        <Link to="/dashboard" className="transition-colors hover:text-blue-400">
          Dashboard
        </Link>
        <Link to="/tables" className="transition-colors hover:text-blue-400">
          Tables
        </Link>
        <Link to="/orders" className="transition-colors hover:text-blue-400">
          Orders
        </Link>
        <Link to="/menu" className="transition-colors hover:text-blue-400">
          Menu
        </Link>
        <Link to="/inventory" className="transition-colors hover:text-blue-400">
          Inventory
        </Link>
        <Link to="/suppliers" className="transition-colors hover:text-blue-400">
          Suppliers
        </Link>
        <Link
          to="/purchase-orders"
          className="transition-colors hover:text-blue-400"
        >
          Purchase Orders
        </Link>
        <Link to="/expenses" className="transition-colors hover:text-blue-400">
          Expenses
        </Link>
        <Link
          to="/invoice-processing"
          className="transition-colors hover:text-blue-400"
        >
          Invoice Processing
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto rounded-lg border border-slate-600 px-4 py-2 text-left transition hover:bg-slate-700"
        >
          Sign out
        </button>
      </nav>

      <main className="min-w-0 flex-1 p-8">
        <Routes>
          <Route path="/dashboard" element={<AnalyticsDashboard />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/invoice-processing" element={<InvoiceProcessing />} />

          <Route
            path="/"
            element={
              <div className="mt-20 text-center">
                <h2 className="text-3xl font-bold">Welcome to RestaurantOS</h2>
                <p className="mt-2 text-gray-600">
                  Select a module from the sidebar to begin.
                </p>
              </div>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (!cancelled) {
          const currentUser = response.data.data.user;

          if (!currentUser) {
            throw new Error("Session is invalid.");
          }

          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem("token");
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
        }
      }
    }

    setAuthChecked(false);
    validateSession();

    return () => {
      cancelled = true;
    };
  }, [authVersion]);

  function handleLogin() {
    // Revalidate the newly saved token against the backend.
    setAuthVersion((version) => version + 1);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-slate-600">Checking your session...</p>
      </div>
    );
  }

  if (location.pathname === "/login") {
    return user ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <LoginPage
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />
    );
  }

  return (
    <ProtectedRoute user={user}>
      <RestaurantLayout user={user} onLogout={handleLogout} />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
