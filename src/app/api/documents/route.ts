import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive",
  ],
});

const docs = google.docs({ version: "v1", auth });
const drive = google.drive({ version: "v3", auth });

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      doc_type,       // "estimate" | "invoice"
      doc_number,
      recipient,
      doc_name,
      doc_date,
      item_name,
      item_unit,
      item_qty,
      item_price,
      item_amount,
      subtotal,
      vat,
      total,
      notes,
    } = body;

    // 1. Select template
    const templateId =
      doc_type === "estimate"
        ? process.env.GOOGLE_ESTIMATE_TEMPLATE_ID
        : process.env.GOOGLE_INVOICE_TEMPLATE_ID;

    if (!templateId) {
      return NextResponse.json({ error: "Template ID not configured" }, { status: 500 });
    }

    // 2. Copy template
    const copyRes = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: `${doc_type === "estimate" ? "견적서" : "거래명세서"}_${recipient}_${doc_number}`,
      },
    });
    const newDocId = copyRes.data.id!;

    // 3. Replace placeholders
    const replacements: Record<string, string> = {
      "{{TITLE}}": doc_type === "estimate" ? "ESTIMATE" : "INVOICE",
      "{{DOC_NUMBER}}": doc_number || "",
      "{{RECIPIENT}}": recipient || "",
      "{{DOC_NAME}}": doc_name || "MMT 공연",
      "{{DOC_DATE}}": doc_date || "",
      "{{NAME1}}": item_name || "",
      "{{UNIT1}}": item_unit || "회",
      "{{QTY1}}": String(item_qty || 1),
      "{{PRICE1}}": fmt(item_price || 0),
      "{{AMT1}}": fmt(item_amount || 0),
      "{{SUB}}": fmt(subtotal || 0),
      "{{VAT}}": fmt(vat || 0),
      "{{TOTAL}}": fmt(total || 0),
      "{{NOTES}}": notes || "",
    };

    const requests = Object.entries(replacements).map(([key, value]) => ({
      replaceAllText: {
        containsText: { text: key, matchCase: true },
        replaceText: value,
      },
    }));

    await docs.documents.batchUpdate({
      documentId: newDocId,
      requestBody: { requests },
    });

    // 4. Export as PDF
    const pdfRes = await drive.files.export(
      { fileId: newDocId, mimeType: "application/pdf" },
      { responseType: "arraybuffer" }
    );
    const pdfBuffer = Buffer.from(pdfRes.data as ArrayBuffer);
    const pdfBase64 = pdfBuffer.toString("base64");

    // 5. Return result
    return NextResponse.json({
      success: true,
      google_doc_id: newDocId,
      google_doc_url: `https://docs.google.com/document/d/${newDocId}/edit`,
      pdf_base64: pdfBase64,
      pdf_filename: `${doc_type === "estimate" ? "견적서" : "거래명세서"}_${recipient}_${doc_number}.pdf`,
    });
  } catch (error: unknown) {
    console.error("Document generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
