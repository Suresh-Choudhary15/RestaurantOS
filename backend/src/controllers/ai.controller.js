const { StatusCodes } = require("http-status-codes");
const prisma = require("../lib/prisma");
const { AppError } = require("../middleware/errorHandler");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Perform OCR on image using Tesseract.js
 */
async function extractTextFromImage(imageBuffer) {
  try {
    const result = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    return result.data.text;
  } catch (error) {
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
}

/**
 * Parse invoice payload and extract structured data
 * Expected payload: { text, file } or raw invoice text
 */
function parseInvoiceText(rawText) {
  // Simple regex-based parser for common invoice formats
  // This can be enhanced with ML/OCR in production

  const parsed = {
    sellerName: "",
    taxId: "",
    invoiceNumber: "",
    invoiceDate: null,
    currency: parsed.currency || null,
    lineItems: [],
    subtotal: 0,
    tax: 0,
    grandTotal: 0,
  };

  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // Extract seller name (usually at top)
  if (lines.length > 0) {
    parsed.sellerName = lines[0];
  }

  // Extract invoice number
  const invoiceMatch = rawText.match(
    /invoice\s*(?:no\.?|number)?\s*[:#]?\s*([A-Z0-9\-]+)/i,
  );
  if (invoiceMatch) {
    parsed.invoiceNumber = invoiceMatch[1];
  }

  // Extract tax ID / GST
  const taxIdMatch = rawText.match(
    /(?:tax\s*id|gst|gstin|vat|ein)\s*[:#]?\s*([A-Z0-9\-]+)/i,
  );
  if (taxIdMatch) {
    parsed.taxId = taxIdMatch[1];
  }

  // Extract date (ISO format or common patterns)
  const dateMatch = rawText.match(
    /(?:date|issued)\s*[:#]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
  );
  if (dateMatch) {
    parsed.invoiceDate = new Date(dateMatch[1]);
  }

  // Extract amounts (subtotal, tax, total)
  const subtotalMatch = rawText.match(
    /subtotal\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i,
  );
  if (subtotalMatch) {
    parsed.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ""));
  }

  const taxMatch = rawText.match(
    /(?:tax|gst|cgst|sgst|igst)\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i,
  );
  if (taxMatch) {
    parsed.tax = parseFloat(taxMatch[1].replace(/,/g, ""));
  }

  const totalMatch = rawText.match(
    /(?:total|grand\s*total)\s*[:#]?\s*\$?([\d,]+\.?\d{0,2})/i,
  );
  if (totalMatch) {
    parsed.grandTotal = parseFloat(totalMatch[1].replace(/,/g, ""));
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
      unitPrice: parseFloat(match[3].replace(/,/g, "")),
      total: parseFloat(match[2]) * parseFloat(match[3].replace(/,/g, "")),
    });
  }

  return parsed;
}

/**
 * POST /api/ai/process-invoice
 * Accepts invoice file or raw text and processes it
 * For files: Uses Tesseract.js for OCR, sends OCR text + image to FastAPI for Groq extraction
 */
async function processInvoice(req, res, next) {
  try {
    let parsed;
    let rawText = "";
    let fileUrl = null;
    let imageBase64 = null;

    // Check if file upload
    if (req.file) {
      const file = req.file;

      // Validate file type (PNG, JPEG, JPG, WEBP only - no PDF support via Tesseract.js)
      const allowedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new AppError(
          "Invalid file type. Supported formats: PNG, JPEG, JPG, WEBP",
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new AppError(
          "File too large. Maximum size is 10MB",
          StatusCodes.BAD_REQUEST,
        );
      }

      let fileBuffer;
      try {
        // Read file buffer for Tesseract.js OCR
        fileBuffer = fs.readFileSync(file.path);

        // Perform OCR using Tesseract.js
        console.log(`Starting Tesseract.js OCR for ${file.originalname}`);
        rawText = await extractTextFromImage(fileBuffer);

        if (!rawText || rawText.trim().length === 0) {
          throw new AppError(
            "OCR could not extract text from image. Please ensure the invoice is clear and readable.",
            StatusCodes.BAD_REQUEST,
          );
        }

        // Convert image to base64 for Groq vision processing
        imageBase64 = fileBuffer.toString("base64");

        // Store file URL reference
        fileUrl = `/uploads/${file.filename}`;

        // Send OCR text + image to FastAPI for Groq extraction and normalization
        console.log(
          "Sending OCR text and image to FastAPI for Groq processing",
        );
        try {
          const aiResponse = await axios.post(
            `${AI_SERVICE_URL}/api/invoice/process`,
            {
              rawText,
              imageBase64,
              filename: file.originalname,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: 60000, // 60 second timeout for Groq API
            },
          );

          if (!aiResponse.data || !aiResponse.data.success) {
            throw new AppError(
              "AI service failed to process invoice",
              StatusCodes.INTERNAL_SERVER_ERROR,
            );
          }

          parsed = aiResponse.data.parsed || {};
        } catch (aiError) {
          console.error("FastAPI/Groq error:", aiError.message);

          // Fallback: Use regex parser if Groq/FastAPI fails
          console.log("Falling back to regex-based invoice parser");
          parsed = parseInvoiceText(rawText);
        }
      } catch (ocrError) {
        console.error("Tesseract.js OCR error:", ocrError.message);

        // If OCR fails and we have a FastAPI service, try direct fallback
        if (GROQ_API_KEY) {
          throw new AppError(
            "Failed to extract text from image. Please try a different image or paste text manually.",
            StatusCodes.BAD_REQUEST,
          );
        } else {
          throw ocrError;
        }
      } finally {
        // Clean up uploaded file
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error("Failed to delete temp file:", err);
          }
        }
      }
    } else if (req.body.text) {
      // Text-based processing (backwards compatibility)
      rawText = req.body.text;

      if (!rawText || typeof rawText !== "string") {
        throw new AppError("Invoice text is required", StatusCodes.BAD_REQUEST);
      }

      parsed = parseInvoiceText(rawText);
    } else {
      throw new AppError(
        "Either file or text is required",
        StatusCodes.BAD_REQUEST,
      );
    }

    const { supplierId } = req.body;

    // Validate and sanitize parsed data
    const sellerName = parsed.sellerName || "Unknown Supplier";
    const taxId = parsed.taxId || null;
    const invoiceNumber = parsed.invoiceNumber || null;
    const invoiceDate = parsed.invoiceDate
      ? new Date(parsed.invoiceDate)
      : new Date();

    // Recalculate totals to ensure integrity
    let subtotal = 0;
    const lineItems = (parsed.lineItems || []).map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemTotal = qty * price;
      subtotal += itemTotal;
      return {
        description: item.description || "Item",
        quantity: qty,
        unitPrice: price,
        total: itemTotal,
      };
    });

    const tax = Number(parsed.tax) || 0;
    const grandTotal = subtotal + tax;

    // Create invoice and expense in transaction
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.supplierInvoice.create({
        data: {
          supplierId: supplierId || null,
          supplierName: sellerName,
          taxId,
          invoiceNumber,
          invoiceDate,
          subtotal,
          tax,
          total: grandTotal,
          rawText,
          fileUrl,
          status: "PROCESSED",
        },
      });

      const expense = await tx.expense.create({
        data: {
          category: "SUPPLIER_INVOICE",
          description: `Invoice ${invoiceNumber || "N/A"} from ${sellerName}`,
          amount: grandTotal,
          date: invoiceDate,
          supplierId: supplierId || null,
          supplierInvoiceId: invoice.id,
          createdById: req.user.id,
        },
      });

      return { invoice, expense };
    });

    return res.status(StatusCodes.CREATED).json({
      status: "success",
      data: {
        parsed: {
          sellerName,
          taxId,
          invoiceNumber,
          invoiceDate,
          currency: parsed.currency || null,
          lineItems,
          subtotal,
          tax,
          grandTotal,
          confidence: parsed.confidence || null,
        },
        invoice: result.invoice,
        expense: result.expense,
      },
      message: "Invoice processed successfully",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processInvoice,
  parseInvoiceText, // Export for testing
};
