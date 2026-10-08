const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Parse invoice payload and extract structured data
 * Expected payload: { text, file } or raw invoice text
 */
function parseInvoiceText(rawText) {
  // Simple regex-based parser for common invoice formats
  // This can be enhanced with ML/OCR in production

  const parsed = {
    sellerName: '',
    taxId: '',
    invoiceNumber: '',
    invoiceDate: null,
    lineItems: [],
    subtotal: 0,
    tax: 0,
    grandTotal: 0,
  };

  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);

  // Extract seller name (usually at top)
  if (lines.length > 0) {
    parsed.sellerName = lines[0];
  }

  // Extract invoice number
  const invoiceMatch = rawText.match(/invoice\s*(?:no\.?|number)?\s*[:#]?\s*([A-Z0-9\-]+)/i);
  if (invoiceMatch) {
    parsed.invoiceNumber = invoiceMatch[1];
  }

  // Extract tax ID / GST
  const taxIdMatch = rawText.match(/(?:tax\s*id|gst|vat|ein)\s*[:#]?\s*([A-Z0-9\-]+)/i);
  if (taxIdMatch) {
    parsed.taxId = taxIdMatch[1];
  }

  // Extract date (ISO format or common patterns)
  const dateMatch = rawText.match(/(?:date|issued)\s*[:#]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i);
  if (dateMatch) {
    parsed.invoiceDate = new Date(dateMatch[1]);
  }

  // Extract amounts (subtotal, tax, total)
  const subtotalMatch = rawText.match(/subtotal\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i);
  if (subtotalMatch) {
    parsed.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
  }

  const taxMatch = rawText.match(/(?:tax|gst|vat)\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i);
  if (taxMatch) {
    parsed.tax = parseFloat(taxMatch[1].replace(/,/g, ''));
  }

  const totalMatch = rawText.match(/(?:total|grand\s*total)\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i);
  if (totalMatch) {
    parsed.grandTotal = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  // If grandTotal not found, calculate it
  if (parsed.grandTotal === 0) {
    parsed.grandTotal = parsed.subtotal + parsed.tax;
  }

  // Extract line items (simplified: look for patterns like "item quantity price")
  const lineItemRegex = /^\s*(.+?)\s+(\d+(?:\.\d+)?)\s+\$?([\d,]+\.?\d{0,2})/gm;
  let match;
  while ((match = lineItemRegex.exec(rawText)) !== null) {
    parsed.lineItems.push({
      description: match[1].trim(),
      quantity: parseFloat(match[2]),
      unitPrice: parseFloat(match[3].replace(/,/g, '')),
      total: parseFloat(match[2]) * parseFloat(match[3].replace(/,/g, '')),
    });
  }

  return parsed;
}

/**
 * POST /api/ai/process-invoice
 * Accepts invoice file or raw text and processes it
 */
async function processInvoice(req, res, next) {
  try {
    const { text, supplierId } = req.body;

    if (!text || typeof text !== 'string') {
      throw new AppError('Invoice text is required', StatusCodes.BAD_REQUEST);
    }

    // Parse the invoice text
    const parsed = parseInvoiceText(text);

    // Create supplier invoice record
    const invoice = await prisma.supplierInvoice.create({
      data: {
        supplierId: supplierId || null,
        supplierName: parsed.sellerName,
        taxId: parsed.taxId,
        invoiceNumber: parsed.invoiceNumber,
        invoiceDate: parsed.invoiceDate,
        subtotal: parsed.subtotal,
        tax: parsed.tax,
        total: parsed.grandTotal,
        rawText: text,
        status: 'PROCESSED',
      },
    });

    // Create corresponding expense record
    const expense = await prisma.expense.create({
      data: {
        category: 'SUPPLIER_INVOICE',
        description: `Invoice ${parsed.invoiceNumber} from ${parsed.sellerName}`,
        amount: parsed.grandTotal,
        date: parsed.invoiceDate || new Date(),
        supplierId: supplierId || null,
        supplierInvoiceId: invoice.id,
        createdById: req.user.id, // From auth middleware
      },
    });

    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: {
        parsed,
        invoice,
        expense,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processInvoice,
  parseInvoiceText, // Export for testing
};
