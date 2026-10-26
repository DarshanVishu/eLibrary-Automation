/**
 * PDF utilities for extracting metadata from PDF files.
 *
 * Uses direct binary parsing instead of pdfjs-dist to avoid web-worker
 * initialisation issues in Next.js / Turbopack environments.
 * The PDF spec stores the total page count as /Count N inside the root
 * Pages dictionary; the highest /Count value in the file equals the total.
 */

/**
 * Extracts page count from a PDF file by reading the binary directly.
 * Does not require any web worker or external loader configuration.
 *
 * @param file - PDF File object
 * @returns Total number of pages, or 0 if it cannot be determined.
 */
export async function extractPdfPageCount(file: File): Promise<number> {
  if (!isPdfFile(file)) return 0;

  try {
    const buffer = await file.arrayBuffer();
    // Decode as latin-1 so every byte maps 1:1 to a character.
    const text = new TextDecoder('latin1').decode(new Uint8Array(buffer));

    // Walk all /Count N entries. In a PDF page tree the root Pages node
    // holds the total; intermediate nodes hold subtotals. The maximum value
    // across all /Count entries is always the total page count.
    const re = /\/Count\s+(\d+)/g;
    let max = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
    return max;
  } catch {
    return 0;
  }
}

/**
 * Checks if a file is a PDF.
 *
 * @param file - File object
 * @returns true if the file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
