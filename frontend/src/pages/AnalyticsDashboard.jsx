import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/analytics/dashboard-summary');
        setDashboardData(response.data.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-state">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="analytics-dashboard">
        <div className="empty-state">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const { salesOverview, activeOrders, tableOccupancy, lowStockWarnings, expenseSummary, shortage, prepTime } = dashboardData;

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="refresh-controls">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="refresh-select"
          >
            <option value={10000}>Refresh every 10s</option>
            <option value={30000}>Refresh every 30s</option>
            <option value={60000}>Refresh every 1m</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Today's Sales</h3>
          <div className="metric-value">${salesOverview?.todaySales || '0.00'}</div>
          <p className="metric-label">{salesOverview?.completedOrders || 0} completed orders</p>
        </div>

        <div className="metric-card">
          <h3>Active Orders</h3>
          <div className="metric-value">{(activeOrders?.pending || 0) + (activeOrders?.preparing || 0) + (activeOrders?.ready || 0)}</div>
          <p className="metric-label">
            {activeOrders?.pending || 0} pending • {activeOrders?.preparing || 0} preparing • {activeOrders?.ready || 0} ready
          </p>
        </div>

        <div className="metric-card">
          <h3>Table Occupancy</h3>
          <div className="metric-value">
            {tableOccupancy?.occupied || 0}/{tableOccupancy?.total || 0}
          </div>
          <p className="metric-label">
            {tableOccupancy?.available || 0} available
          </p>
        </div>

        <div className={`metric-card ${lowStockWarnings > 0 ? 'warning' : ''}`}>
          <h3>Low Stock Alerts</h3>
          <div className="metric-value">{lowStockWarnings || 0}</div>
          <p className="metric-label">
            {lowStockWarnings > 0 ? `${shortage?.critical || 0} critical` : 'All stocked'}
          </p>
        </div>
      </div>

      {/* Charts & Details Row */}
      <div className="charts-grid">
        {/* Orders Status */}
        <div className="chart-card">
          <h3>Order Status Breakdown</h3>
          <div className="status-breakdown">
            <div className="status-item">
              <span className="status-label">Pending</span>
              <div className="progress-bar">
                <div
                  className="progress-fill pending"
                  style={{ width: `${((activeOrders?.pending || 0) / Math.max(1, (activeOrders?.pending || 0) + (activeOrders?.preparing || 0) + (activeOrders?.ready || 0))) * 100}%` }}
                />
              </div>
              <span className="status-count">{activeOrders?.pending || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Preparing</span>
              <div className="progress-bar">
                <div
                  className="progress-fill preparing"
                  style={{ width: `${((activeOrders?.preparing || 0) / Math.max(1, (activeOrders?.pending || 0) + (activeOrders?.preparing || 0) + (activeOrders?.ready || 0))) * 100}%` }}
                />
              </div>
              <span className="status-count">{activeOrders?.preparing || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Ready</span>
              <div className="progress-bar">
                <div
                  className="progress-fill ready"
                  style={{ width: `${((activeOrders?.ready || 0) / Math.max(1, (activeOrders?.pending || 0) + (activeOrders?.preparing || 0) + (activeOrders?.ready || 0))) * 100}%` }}
                />
              </div>
              <span className="status-count">{activeOrders?.ready || 0}</span>
            </div>
          </div>
        </div>

        {/* Table Occupancy */}
        <div className="chart-card">
          <h3>Table Status</h3>
          <div className="occupancy-grid">
            <div className="occupancy-item available">
              <div className="occupancy-count">{tableOccupancy?.available || 0}</div>
              <p>Available</p>
            </div>
            <div className="occupancy-item occupied">
              <div className="occupancy-count">{tableOccupancy?.occupied || 0}</div>
              <p>Occupied</p>
            </div>
            <div className="occupancy-item reserved">
              <div className="occupancy-count">{tableOccupancy?.reserved || 0}</div>
              <p>Reserved</p>
            </div>
            <div className="occupancy-item maintenance">
              <div className="occupancy-count">{tableOccupancy?.maintenance || 0}</div>
              <p>Maintenance</p>
            </div>
          </div>
        </div>

        {/* Prep Time Estimate */}
        <div className="chart-card">
          <h3>Kitchen Queue</h3>
          <div className="prep-time-info">
            <div className="prep-metric">
              <span className="prep-label">Active Orders</span>
              <span className="prep-value">{prepTime?.activeOrders || 0}</span>
            </div>
            <div className="prep-metric">
              <span className="prep-label">Avg Prep Time</span>
              <span className="prep-value">{prepTime?.averagePrepTime || 0} min</span>
            </div>
            <div className="prep-metric">
              <span className="prep-label">Total Queue Time</span>
              <span className="prep-value">{prepTime?.totalQueueTime || 0} min</span>
            </div>
          </div>
        </div>

        {/* Expense Summary */}
        <div className="chart-card">
          <h3>Expense Summary (30 Days)</h3>
          <div className="expense-info">
            <div className="expense-total">
              <span className="label">Total Expenses</span>
              <span className="value">${expenseSummary?.total || '0.00'}</span>
            </div>
            <div className="expense-breakdown">
              {Object.entries(expenseSummary?.byCategory || {}).map(([category, amount]) => (
                <div key={category} className="expense-category">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">${Number(amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warnings */}
      {shortage?.items && shortage.items.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️  Low Stock Warnings ({shortage.items.length})</h3>
          <div className="alerts-grid">
            {shortage.items.slice(0, 5).map((item) => (
              <div key={item.id} className={`alert-card ${item.severity.toLowerCase()}`}>
                <div className="alert-header">
                  <span className="alert-name">{item.name}</span>
                  <span className={`alert-badge ${item.severity.toLowerCase()}`}>{item.severity}</span>
                </div>
                <div className="alert-details">
                  <p><strong>Current:</strong> {item.currentStock} {item.unit}</p>
                  <p><strong>Reorder Level:</strong> {item.reorderLevel} {item.unit}</p>
                  <p><strong>Supplier:</strong> {item.supplier}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .analytics-dashboard {
          padding: 2rem;
          max-width: 1600px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 2rem;
          color: #1a1a1a;
        }

        .refresh-controls {
          display: flex;
          gap: 1rem;
        }

        .refresh-select {
          padding: 0.5rem 1rem;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-2px);
        }

        .metric-card.warning {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .metric-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          opacity: 0.9;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }

        .metric-label {
          margin: 0;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .chart-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          color: #2d3748;
        }

        .status-breakdown {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .status-item {
          display: grid;
          grid-template-columns: 80px 1fr 50px;
          align-items: center;
          gap: 1rem;
        }

        .status-label {
          font-size: 0.875rem;
          color: #4a5568;
          font-weight: 500;
        }

        .progress-bar {
          background: #e2e8f0;
          border-radius: 4px;
          height: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .progress-fill.pending {
          background: #ecc94b;
        }

        .progress-fill.preparing {
          background: #ed8936;
        }

        .progress-fill.ready {
          background: #48bb78;
        }

        .status-count {
          text-align: right;
          font-weight: bold;
          color: #2d3748;
          font-size: 0.875rem;
        }

        .occupancy-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .occupancy-item {
          padding: 1rem;
          border-radius: 6px;
          text-align: center;
          border-left: 4px solid;
        }

        .occupancy-item.available {
          background: #c6f6d5;
          border-color: #22543d;
          color: #22543d;
        }

        .occupancy-item.occupied {
          background: #bee3f8;
          border-color: #2c5282;
          color: #2c5282;
        }

        .occupancy-item.reserved {
          background: #fbd38d;
          border-color: #7c2d12;
          color: #7c2d12;
        }

        .occupancy-item.maintenance {
          background: #fed7d7;
          border-color: #742a2a;
          color: #742a2a;
        }

        .occupancy-count {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .occupancy-item p {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .prep-time-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .prep-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f7fafc;
          border-radius: 6px;
        }

        .prep-label {
          color: #4a5568;
          font-weight: 500;
        }

        .prep-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
        }

        .expense-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .expense-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        .expense-total .label {
          color: #4a5568;
          font-weight: 500;
        }

        .expense-total .value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
        }

        .expense-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .expense-category {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .category-name {
          color: #4a5568;
          font-size: 0.875rem;
        }

        .category-amount {
          font-weight: bold;
          color: #2d3748;
        }

        .alerts-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #e2e8f0;
        }

        .alerts-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          color: #742a2a;
        }

        .alerts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .alert-card {
          border-radius: 6px;
          padding: 1rem;
          border-left: 4px solid;
        }

        .alert-card.critical {
          background: #fed7d7;
          border-color: #742a2a;
        }

        .alert-card.warning {
          background: #feebc8;
          border-color: #7c2d12;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .alert-name {
          font-weight: bold;
          color: #2d3748;
        }

        .alert-badge {
          font-size: 0.75rem;
          font-weight: bold;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .alert-badge.critical {
          background: #c53030;
          color: white;
        }

        .alert-badge.warning {
          background: #ed8936;
          color: white;
        }

        .alert-details {
          font-size: 0.875rem;
          color: #4a5568;
        }

        .alert-details p {
          margin: 0.25rem 0;
        }

        .loading-state,
        .error-state,
        .empty-state {
          padding: 3rem;
          text-align: center;
          color: #4a5568;
        }

        .error-state {
          color: #742a2a;
          background: #fed7d7;
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .metrics-grid,
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .occupancy-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
