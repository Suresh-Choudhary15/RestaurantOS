"""
Invoice Processing Service
Uses Groq AI for intelligent invoice extraction and normalization
(Tesseract OCR now runs in Express backend via Tesseract.js)
"""
import os
import json
from typing import Optional, Dict
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

class GroqService:
    """Groq AI service for intelligent invoice extraction and normalization"""

    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        # Use llama-3.2-90b-vision-preview for vision capabilities
        self.model = "qwen/qwen3.8-27b"

        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")

    def extract_invoice_data(
        self,
        ocr_text: str,
        image_base64: Optional[str] = None
    ) -> Dict:
        """
        Use Groq AI to extract and normalize invoice data

        Args:
            ocr_text: Pre-extracted text from Tesseract.js OCR (Express backend)
            image_base64: Optional base64-encoded invoice image for vision context

        Returns:
            Normalized invoice data dictionary with confidence score
        """
        try:
            # Build the prompt for Groq
            prompt = self._build_extraction_prompt(ocr_text)

            # Prepare message content (text + optional image)
            message_content = [
                {
                    "type": "text",
                    "text": prompt
                }
            ]

            # Add image if provided (for vision-based correction of OCR errors)
            if image_base64:
                message_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                })

            # Call Groq API
            response = httpx.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "user",
                            "content": message_content
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1024,
                },
                timeout=30.0
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")

            response_data = response.json()

            # Extract the response content
            if not response_data.get("choices"):
                raise Exception("No response from Groq API")

            content = response_data["choices"][0]["message"]["content"]

            # Parse the JSON response from Groq
            parsed = self._parse_groq_response(content)

            return {
                "success": True,
                "data": parsed,
                "source": "groq_ai"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "source": "groq_ai"
            }

    def _build_extraction_prompt(self, ocr_text: str) -> str:
        """Build the Groq prompt for invoice extraction"""
        return f"""You are an expert invoice data extraction system.

Analyze the following OCR-extracted invoice text and return a JSON object with normalized, structured invoice data.

OCR Text:
{ocr_text}

Extract and normalize the following fields:
1. sellerName: The supplier/vendor name (string)
2. taxId: Tax ID, GST number, or similar (string, can be null)
3. invoiceNumber: Invoice number or reference (string, can be null)
4. invoiceDate: Invoice date in ISO format YYYY-MM-DD (string, can be null)
5. lineItems: Array of line items with {{description, quantity (number), unitPrice (number)}}
6. subtotal: Amount before tax (number)
7. tax: Tax amount (number)
8. grandTotal: Total amount including tax (number)
9. currency: Invoice currency as an ISO 4217 code (USD, INR, EUR, GBP, etc.), or null if unclear

Correction Rules:
- If the OCR text is ambiguous or poorly formatted, infer reasonable values
- For Indian invoices: Look for GSTIN, CGST, SGST, IGST fields
- Support currency symbols: $, ₹, €, £, etc.
- Parse dates in common formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
- If subtotal + tax ≠ grandTotal, prefer the explicitly stated grandTotal
- Quantities and prices must be positive numbers
- Identify currency from the invoice's currency code, symbol, and context.
- Return the currency as an ISO 4217 code, such as USD, INR, EUR, or GBP.
- Never assume INR just because the application is used in India.
- If the invoice clearly uses US dollars, return USD.
- If a dollar symbol is ambiguous and the currency cannot be identified confidently, return null.
- Remove currency symbols and thousand separators from numeric amounts.
- Never convert amounts between currencies.

Return ONLY a valid JSON object (no markdown, no extra text):
{{
  "sellerName": "",
  "taxId": "",
  "invoiceNumber": "",
  "invoiceDate": null,
  "currency": null,
  "lineItems": [],
  "subtotal": 0.0,
  "tax": 0.0,
  "grandTotal": 0.0,
  "confidence": 0.85
}}

Notes:
- confidence: 0.0 to 1.0 indicating extraction confidence
- If you cannot extract a field, use null or 0 as appropriate
- Do not include any explanation, only the JSON object"""

    def _parse_groq_response(self, content: str) -> Dict:
        """Parse Groq's JSON response"""
        try:
            # Try to extract JSON from the response
            # Groq might include markdown code blocks
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            parsed = json.loads(json_str)

            # Validate and normalize the response
            return {
                "sellerName": str(parsed.get("sellerName", "")).strip() or "",
                "taxId": str(parsed.get("taxId", "")).strip() or "",
                "invoiceNumber": str(parsed.get("invoiceNumber", "")).strip() or "",
                "invoiceDate": parsed.get("invoiceDate"),
                "currency": parsed.get("currency"),  # Extract currency field
                "lineItems": parsed.get("lineItems", []),
                "subtotal": float(parsed.get("subtotal", 0)) or 0.0,
                "tax": float(parsed.get("tax", 0)) or 0.0,
                "grandTotal": float(parsed.get("grandTotal", 0)) or 0.0,
                "confidence": float(parsed.get("confidence", 0.7)) or 0.7,
            }

        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse Groq response: {str(e)}")


# Global service instance
groq_service = GroqService()
