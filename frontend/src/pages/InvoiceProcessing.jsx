import { useState } from 'react';
import api from '../services/api';

export default function InvoiceProcessing() {
  const [isDragging, setIsDragging] = useState(false);
  const [invoiceText, setInvoiceText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const text = await file.text();
      setInvoiceText(text);
    } else if (file.type === 'application/pdf') {
      setError('PDF parsing requires OCR. Please paste invoice text manually.');
    } else {
      setError('Unsupported file type. Please use .txt files or paste text manually.');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const text = await file.text();
      setInvoiceText(text);
    } else {
      setError('Please select a .txt file or paste text manually.');
    }
  };

  const handleProcessInvoice = async () => {
    if (!invoiceText.trim()) {
      setError('Please provide invoice text');
      return;
    }

    setLoading(true);
    setError('');
    setParsedData(null);

    try {
      const response = await api.post('/ai/process-invoice', {
        text: invoiceText,
      });

      setParsedData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExpenses = async () => {
    try {
      const response = await api.get('/expenses/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export expenses');
    }
  };

  return (
    <div className="invoice-processing-page">
      <div className="page-header">
        <h1>AI Invoice Processing</h1>
        <button onClick={handleExportExpenses} className="btn-export">
          Export Expenses (.xlsx)
        </button>
      </div>

      <div className="invoice-processor">
        <div className="upload-section">
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p>Drag & drop invoice file here</p>
              <p className="text-muted">or</p>
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <span className="btn-secondary">Choose File</span>
              </label>
            </div>
          </div>

          <div className="textarea-section">
            <label htmlFor="invoice-text">Or paste invoice text:</label>
            <textarea
              id="invoice-text"
              value={invoiceText}
              onChange={(e) => setInvoiceText(e.target.value)}
              placeholder="Paste invoice text here..."
              rows={10}
            />
          </div>

          <button
            onClick={handleProcessInvoice}
            disabled={loading || !invoiceText.trim()}
            className="btn-primary"
          >
            {loading ? 'Processing...' : 'Process Invoice'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="preview-section">
          <h2>Parsed Data Preview</h2>
          {parsedData ? (
            <div className="parsed-data">
              <div className="data-section">
                <h3>Invoice Details</h3>
                <table>
                  <tbody>
                    <tr>
                      <td><strong>Seller Name:</strong></td>
                      <td>{parsedData.parsed.sellerName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Tax ID:</strong></td>
                      <td>{parsedData.parsed.taxId || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Invoice Number:</strong></td>
                      <td>{parsedData.parsed.invoiceNumber || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Date:</strong></td>
                      <td>
                        {parsedData.parsed.invoiceDate
                          ? new Date(parsedData.parsed.invoiceDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="data-section">
                <h3>Amounts</h3>
                <table>
                  <tbody>
                    <tr>
                      <td><strong>Subtotal:</strong></td>
                      <td>${parsedData.parsed.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td><strong>Tax:</strong></td>
                      <td>${parsedData.parsed.tax.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td><strong>Grand Total:</strong></td>
                      <td className="grand-total">${parsedData.parsed.grandTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {parsedData.parsed.lineItems.length > 0 && (
                <div className="data-section">
                  <h3>Line Items</h3>
                  <table className="line-items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.parsed.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>${item.unitPrice.toFixed(2)}</td>
                          <td>${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="success-message">
                ✓ Invoice processed and saved to database
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Upload and process an invoice to see parsed data</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .invoice-processing-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin: 0;
          font-size: 2rem;
          color: #1a1a1a;
        }

        .invoice-processor {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .upload-section,
        .preview-section {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .drop-zone {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 3rem;
          text-align: center;
          transition: all 0.2s;
          background: #f7fafc;
          margin-bottom: 2rem;
        }

        .drop-zone.dragging {
          border-color: #4299e1;
          background: #ebf8ff;
        }

        .drop-zone-content svg {
          color: #718096;
          margin-bottom: 1rem;
        }

        .drop-zone-content p {
          margin: 0.5rem 0;
          color: #4a5568;
        }

        .text-muted {
          color: #a0aec0 !important;
          font-size: 0.875rem;
        }

        .textarea-section {
          margin-bottom: 1.5rem;
        }

        .textarea-section label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #2d3748;
        }

        .textarea-section textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.875rem;
          resize: vertical;
        }

        .btn-primary,
        .btn-secondary,
        .btn-export {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          width: 100%;
          background: #4299e1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3182ce;
        }

        .btn-primary:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #4299e1;
          border: 1px solid #4299e1;
          display: inline-block;
        }

        .btn-secondary:hover {
          background: #ebf8ff;
        }

        .btn-export {
          background: #48bb78;
          color: white;
        }

        .btn-export:hover {
          background: #38a169;
        }

        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fed7d7;
          color: #c53030;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .success-message {
          margin-top: 1.5rem;
          padding: 0.75rem;
          background: #c6f6d5;
          color: #22543d;
          border-radius: 6px;
          font-weight: 500;
        }

        .preview-section h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          color: #1a1a1a;
        }

        .parsed-data {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .data-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          color: #2d3748;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }

        .data-section table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-section table td,
        .data-section table th {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-section table td:first-child {
          width: 40%;
          color: #4a5568;
        }

        .grand-total {
          font-weight: 600;
          font-size: 1.125rem;
          color: #2d3748;
        }

        .line-items-table th {
          background: #f7fafc;
          font-weight: 600;
          color: #2d3748;
        }

        .line-items-table td:not(:first-child) {
          text-align: right;
        }

        .line-items-table th:not(:first-child) {
          text-align: right;
        }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: #a0aec0;
        }

        @media (max-width: 1024px) {
          .invoice-processor {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
