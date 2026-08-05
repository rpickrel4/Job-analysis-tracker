import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

/** Extracts plain text from an uploaded resume file (PDF, DOCX, or TXT). */
export async function extractResumeText(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    // pdf-parse/pdfjs-dist's default worker setup doesn't resolve inside
    // Next.js's serverless bundle, so we use unpdf, which bundles a
    // worker-free build of pdf.js meant for exactly this environment.
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
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
