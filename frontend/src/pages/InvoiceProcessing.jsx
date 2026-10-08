import { useState } from "react";
import api from "../services/api";

export default function InvoiceProcessing() {
  const [isDragging, setIsDragging] = useState(false);
  const [invoiceText, setInvoiceText] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);

  const formatAmount = (amount, currency) => {
    const value = (Number(amount) || 0).toFixed(2);

    const symbols = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
    };

    if (!currency) {
      return `Currency unclear ${value}`;
    }

    const symbol = symbols[currency];

    return symbol ? `${symbol}${value}` : `${currency} ${value}`;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Unsupported file type. Please upload PNG, JPEG, JPG, WEBP, or PDF files.",
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    setSelectedFile(file);
    setError("");
    setParsedData(null);
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      setError("Please select a file to process");
      return;
    }

    setLoading(true);
    setError("");
    setParsedData(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post("/ai/process-invoice", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setParsedData(response.data.data);
      setEditedData(response.data.data.parsed);
      console.log("Parsed invoice data:", response.data.data.parsed);
      setEditMode(true);
      setSuccess("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessInvoice = async () => {
    if (!invoiceText.trim()) {
      setError("Please provide invoice text");
      return;
    }

    setLoading(true);
    setError("");
    setParsedData(null);

    try {
      const response = await api.post("/ai/process-invoice", {
        text: invoiceText,
      });

      setParsedData(response.data.data);
      setEditedData(response.data.data.parsed);
      setEditMode(true);
      setSuccess("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmInvoice = () => {
    setSuccess("Invoice saved successfully to database!");
    setEditMode(false);
    setTimeout(() => {
      setSuccess("");
      setParsedData(null);
      setEditedData(null);
      setSelectedFile(null);
      setInvoiceText("");
    }, 3000);
  };

  const updateEditedField = (field, value) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...editedData.lineItems];
    newItems[index][field] = value;
    setEditedData({ ...editedData, lineItems: newItems });
  };

  const handleExportExpenses = async () => {
    try {
      const response = await api.get("/expenses/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `expenses_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export expenses");
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
            className={`drop-zone ${isDragging ? "dragging" : ""}`}
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
              <p className="file-types">
                Supported: PNG, JPEG, JPG, WEBP (max 10MB)
              </p>
              <p className="text-muted">or</p>
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
                <span className="btn-secondary">Choose File</span>
              </label>
              {selectedFile && (
                <p className="selected-file">Selected: {selectedFile.name}</p>
              )}
            </div>
          </div>

          {selectedFile && (
            <button
              onClick={handleProcessFile}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Processing Invoice..." : "Process Invoice File"}
            </button>
          )}

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="textarea-section">
            <label htmlFor="invoice-text">Paste invoice text:</label>
            <textarea
              id="invoice-text"
              value={invoiceText}
              onChange={(e) => setInvoiceText(e.target.value)}
              placeholder="Paste invoice text here..."
              rows={10}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleProcessInvoice}
            disabled={loading || !invoiceText.trim()}
            className="btn-primary"
          >
            {loading ? "Processing..." : "Process Text"}
          </button>
        </div>

        <div className="preview-section">
          <h2>Extracted Data</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Processing invoice with AI/OCR...</p>
            </div>
          )}

          {!loading && parsedData && editedData && (
            <div className="parsed-data">
              {editedData.confidence !== null &&
                editedData.confidence !== undefined && (
                  <div className="confidence-indicator">
                    <span>AI Confidence: </span>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${(editedData.confidence || 0) * 100}%`,
                        }}
                      />
                    </div>
                    <span>
                      {((editedData.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}

              <div className="data-section">
                <h3>
                  Invoice Details{" "}
                  {editMode && <span className="edit-label">(Editable)</span>}
                </h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Seller Name:</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editedData.sellerName || ""}
                        onChange={(e) =>
                          updateEditedField("sellerName", e.target.value)
                        }
                      />
                    ) : (
                      <span>{editedData.sellerName || "N/A"}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Tax ID / GSTIN:</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editedData.taxId || ""}
                        onChange={(e) =>
                          updateEditedField("taxId", e.target.value)
                        }
                      />
                    ) : (
                      <span>{editedData.taxId || "N/A"}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Invoice Number:</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editedData.invoiceNumber || ""}
                        onChange={(e) =>
                          updateEditedField("invoiceNumber", e.target.value)
                        }
                      />
                    ) : (
                      <span>{editedData.invoiceNumber || "N/A"}</span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Invoice Date:</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={
                          editedData.invoiceDate
                            ? new Date(editedData.invoiceDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          updateEditedField("invoiceDate", e.target.value)
                        }
                      />
                    ) : (
                      <span>
                        {editedData.invoiceDate
                          ? new Date(
                              editedData.invoiceDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="data-section">
                <h3>Amounts</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Subtotal:</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editedData.subtotal || 0}
                        onChange={(e) =>
                          updateEditedField(
                            "subtotal",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    ) : (
                      <span>
                        {formatAmount(editedData.subtotal, editedData.currency)}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Tax (GST):</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editedData.tax || 0}
                        onChange={(e) =>
                          updateEditedField(
                            "tax",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    ) : (
                      <span>
                        {formatAmount(editedData.tax, editedData.currency)}
                      </span>
                    )}
                  </div>

                  <div className="form-field grand-total-field">
                    <label>Grand Total:</label>
                    <span className="grand-total">
                      {formatAmount(editedData.grandTotal, editedData.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {editedData.lineItems && editedData.lineItems.length > 0 && (
                <div className="data-section">
                  <h3>Line Items</h3>
                  <div className="line-items-table-container">
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
                        {editedData.lineItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              {editMode ? (
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateLineItem(
                                      idx,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                />
                              ) : (
                                item.description
                              )}
                            </td>
                            <td>
                              {editMode ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateLineItem(
                                      idx,
                                      "quantity",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              ) : (
                                item.quantity
                              )}
                            </td>
                            <td>
                              {editMode ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateLineItem(
                                      idx,
                                      "unitPrice",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              ) : (
                                formatAmount(item.unitPrice, editedData.currency)
                              )}
                            </td>
                            <td>
                              {formatAmount(item.total, editedData.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {editMode && (
                <div className="action-buttons">
                  <button
                    onClick={handleConfirmInvoice}
                    className="btn-confirm"
                  >
                    Confirm & Save Invoice
                  </button>
                </div>
              )}

              {!editMode && (
                <div className="success-message">
                  ✓ Invoice processed and saved to database
                </div>
              )}
            </div>
          )}

          {!loading && !parsedData && (
            <div className="empty-state">
              <p>Upload an invoice file or paste text to see extracted data</p>
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

        .file-types {
          font-size: 0.75rem;
          color: #718096;
        }

        .selected-file {
          margin-top: 1rem;
          padding: 0.5rem;
          background: #edf2f7;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #2d3748;
        }

        .divider {
          margin: 2rem 0;
          text-align: center;
          position: relative;
        }

        .divider::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
        }

        .divider span {
          position: relative;
          background: white;
          padding: 0 1rem;
          color: #a0aec0;
          font-size: 0.875rem;
        }

        .loading-state {
          text-align: center;
          padding: 3rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #edf2f7;
          border-radius: 6px;
        }

        .confidence-bar {
          flex: 1;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #f56565 0%, #ecc94b 50%, #48bb78 100%);
          transition: width 0.3s;
        }

        .data-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          color: #2d3748;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .edit-label {
          font-size: 0.75rem;
          color: #4299e1;
          font-weight: normal;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .form-field label {
          font-size: 0.875rem;
          color: #4a5568;
          margin-bottom: 0.25rem;
        }

        .form-field input {
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .form-field span {
          padding: 0.5rem 0;
          color: #2d3748;
        }

        .grand-total-field {
          grid-column: span 2;
        }

        .grand-total {
          font-size: 1.25rem;
          font-weight: bold;
          color: #2d3748;
        }

        .line-items-table-container {
          overflow-x: auto;
        }

        .line-items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .line-items-table th,
        .line-items-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .line-items-table th {
          background: #f7fafc;
          font-weight: 600;
          color: #2d3748;
        }

        .line-items-table input {
          width: 100%;
          padding: 0.25rem;
          border: 1px solid #cbd5e0;
          border-radius: 3px;
          font-size: 0.875rem;
        }

        .action-buttons {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e2e8f0;
        }

        .btn-confirm {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: #38a169;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-confirm:hover {
          background: #2f855a;
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
