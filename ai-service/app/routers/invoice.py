"""
Invoice processing router for FastAPI
Accepts pre-extracted OCR text and image for Groq AI interpretation
"""
from fastapi import APIRouter, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from ..services.invoice_service import groq_service

router = APIRouter(prefix="/invoice", tags=["invoice"])


class InvoiceProcessRequest(BaseModel):
    """Request body for invoice processing with pre-extracted OCR text"""
    rawText: str
    imageBase64: Optional[str] = None
    filename: Optional[str] = None


@router.post("/process")
async def process_invoice(request: InvoiceProcessRequest):
    """
    Process invoice using Groq AI for intelligent extraction and normalization

    Expects:
    - rawText: OCR-extracted text from Tesseract.js (Express backend)
    - imageBase64: Optional base64-encoded invoice image for vision context
    - filename: Optional original filename for logging

    Returns structured invoice data with confidence score
    """
    try:
        if not request.rawText or not request.rawText.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="rawText is required and cannot be empty"
            )

        # Use Groq for intelligent extraction and normalization
        result = groq_service.extract_invoice_data(
            ocr_text=request.rawText,
            image_base64=request.imageBase64
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=result.get("error", "Failed to extract invoice data"),
            )

        return {
            "success": True,
            "rawText": request.rawText,
            "parsed": result["data"],
            "source": "groq_ai"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

