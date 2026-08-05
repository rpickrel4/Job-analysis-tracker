import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

/** Extracts plain text from an uploaded resume file (PDF, DOCX, or TXT). */
export async function extractResumeText(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8").trim();
  }

  throw new Error(
    `Unsupported resume file type: .${ext}. Please upload a PDF, DOCX, or TXT file.`
  );
}
