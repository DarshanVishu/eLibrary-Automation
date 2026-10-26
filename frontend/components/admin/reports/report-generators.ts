/**
 * Client-side PDF and CSV report generators.
 * Uses dynamic imports so jspdf and jspdf-autotable are not bundled into the main chunk.
 * Uses local Nunito font (same as the website design system) with automatic offline fallback.
 * Built with full ASCII compatibility to prevent PDF font encoding issues.
 * Handles edge cases for zero data, empty tables, and CSV character encodings.
 */
import type {
  OverallReportData,
  AllStudentsReportData,
  IndividualStudentReportData,
} from '@/lib/types/reports';
import { formatDate } from '@/lib/utils';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatPeriodLabel(from: string | null, to: string | null): string {
  if (!from && !to) return 'All Time';
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  return `Up to ${formatDate(to!)}`;
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeDate(iso: string | null): string {
  if (!iso) return '-';
  return formatDate(iso);
}

function pct(n: number): string {
  return `${n}%`;
}

function truncateText(text: string | null | undefined, maxLen = 34): string {
  if (!text) return '-';
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3) + '...';
}

function formatSubjectShort(name: string | null | undefined): string {
  if (!name) return '-';
  const clean = name.trim();
  const lower = clean.toLowerCase();

  // Strict mapping for the 16 actual subjects in the database
  const dbSubjectShortMap: Record<string, string> = {
    mathematics: 'Maths',
    science: 'Science',
    english: 'English',
    hindi: 'Hindi',
    'social science': 'Social Sci',
    'computer science': 'CS',
    sanskrit: 'Sanskrit',
    evs: 'EVS',
    'physical education': 'Physical Ed',
    'vocational education': 'Vocational',
    kannada: 'Kannada',
    'information technology': 'IT',
    'artificial intelligence': 'AI',
    'art education': 'Art',
    'value education': 'Value Ed',
    'general knowledge': 'GK',
  };

  return dbSubjectShortMap[lower] || clean;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return lines.join('\r\n');
}

// ─── PDF Font & Document Loader ───────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

let cachedFontBase64: { regular: string; bold: string } | null = null;

type JsPDFInstance = InstanceType<Awaited<ReturnType<typeof loadJsPDFClass>>>;

async function loadJsPDFClass() {
  const [{ jsPDF }, autoTable] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  void autoTable;
  return jsPDF;
}

async function createPdfDocument(options?: any): Promise<JsPDFInstance> {
  const JsPDF = await loadJsPDFClass();
  const doc = new JsPDF(options);

  try {
    if (!cachedFontBase64 && typeof window !== 'undefined') {
      const res = await fetch('/fonts/NotoSansKannada-VariableFont_wdth,wght.ttf');
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const b64 = arrayBufferToBase64(buf);
        cachedFontBase64 = {
          regular: b64,
          bold: b64,
        };
      } else {
        // Fallback to Nunito if needed
        const [regRes, boldRes] = await Promise.all([
          fetch('/fonts/nunito/Nunito-Regular.ttf'),
          fetch('/fonts/nunito/Nunito-Bold.ttf'),
        ]);
        if (regRes.ok && boldRes.ok) {
          const [regBuf, boldBuf] = await Promise.all([
            regRes.arrayBuffer(),
            boldRes.arrayBuffer(),
          ]);
          cachedFontBase64 = {
            regular: arrayBufferToBase64(regBuf),
            bold: arrayBufferToBase64(boldBuf),
          };
        }
      }
    }

    if (cachedFontBase64) {
      doc.addFileToVFS('NotoSansKannada.ttf', cachedFontBase64.regular);
      doc.addFont('NotoSansKannada.ttf', 'NotoSansKannada', 'normal');
      doc.addFont('NotoSansKannada.ttf', 'NotoSansKannada', 'bold');

      doc.setFont('NotoSansKannada', 'normal');
      (doc as any).__font = 'NotoSansKannada';
    } else {
      doc.setFont('helvetica', 'normal');
      (doc as any).__font = 'helvetica';
    }
  } catch {
    doc.setFont('helvetica', 'normal');
    (doc as any).__font = 'helvetica';
  }

  return doc;
}

function getFont(doc: JsPDFInstance): string {
  return (doc as any).__font || 'NotoSansKannada';
}

// ─── Complex Script Text Shaper (Canvas-based HarfBuzz/DirectWrite renderer) ───

const COMPLEX_SCRIPT_REGEX =
  /[\u0600-\u06FF\u0900-\u0DFF\u0E00-\u0E7F\u0F00-\u0FFF\u1000-\u109F\uA800-\uA87F]/;

export function hasComplexScript(text: string | null | undefined): boolean {
  if (!text) return false;
  return COMPLEX_SCRIPT_REGEX.test(text);
}

let fontFaceLoaded = false;
async function ensureKannadaFontFace() {
  if (fontFaceLoaded || typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    const fontFace = new FontFace(
      'Noto Sans Kannada Local',
      'url(/fonts/NotoSansKannada-VariableFont_wdth,wght.ttf)',
    );
    await fontFace.load();
    document.fonts.add(fontFace);
    fontFaceLoaded = true;
  } catch {
    // If FontFace fails, canvas will fallback to system fonts
  }
}

const PT_TO_MM = 25.4 / 72; // ~0.3528 mm per point
const DPI_SCALE = 12; // 12 pixels per mm (~305 DPI) for razor-sharp rendering

interface ShapedImage {
  dataUrl: string;
  widthMm: number;
  heightMm: number;
}

function renderShapedText(
  text: string,
  options: {
    fontSizePt?: number;
    color?: string;
    fontWeight?: string;
  } = {},
): ShapedImage | null {
  if (typeof document === 'undefined') return null;

  const fontSizePt = options.fontSizePt || 8;
  const color = options.color || '#1e293b';
  const fontWeight = options.fontWeight || '500';
  const fontFamily = "'Noto Sans Kannada Local', 'Noto Sans Kannada', 'Tunga', 'Kedar', sans-serif";

  // Optical size adjustment: scaled to sit balanced and slightly compact
  const fontHeightMm = fontSizePt * PT_TO_MM * 0.96;
  const fontPx = Math.round(fontHeightMm * DPI_SCALE);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  const metrics = ctx.measureText(text);

  const widthPx = Math.ceil(metrics.width);
  // Kannada has subjoined consonants (ottakshara), allow proportional vertical box
  const heightPx = Math.ceil(fontPx * 1.3);

  canvas.width = Math.max(1, widthPx + 4);
  canvas.height = Math.max(1, heightPx);

  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillText(text, 2, canvas.height / 2);

  const dataUrl = canvas.toDataURL('image/png');
  const widthMm = canvas.width / DPI_SCALE;
  const heightMm = canvas.height / DPI_SCALE;

  return { dataUrl, widthMm, heightMm };
}

function attachComplexTextHandlers(
  tableOptions: any,
  doc: JsPDFInstance,
  rows: any[][],
  columnIndicesToCheck: number[],
  fontSizePt = 8,
) {
  const imageMap = new Map<string, ShapedImage>();

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const row = rows[rIdx];
    for (const cIdx of columnIndicesToCheck) {
      const val = row[cIdx];
      if (typeof val === 'string' && hasComplexScript(val)) {
        const img = renderShapedText(val, { fontSizePt });
        if (img) {
          imageMap.set(`${rIdx}_${cIdx}`, img);
        }
      }
    }
  }

  if (imageMap.size === 0) return tableOptions;

  const originalWillDrawCell = tableOptions.willDrawCell;
  tableOptions.willDrawCell = function (data: any) {
    if (originalWillDrawCell) originalWillDrawCell(data);
    if (data.section === 'body') {
      const key = `${data.row.index}_${data.column.index}`;
      if (imageMap.has(key)) {
        data.cell.text = []; // suppress unshaped raw text
      }
    }
  };

  const originalDidDrawCell = tableOptions.didDrawCell;
  tableOptions.didDrawCell = function (data: any) {
    if (originalDidDrawCell) originalDidDrawCell(data);
    if (data.section === 'body') {
      const key = `${data.row.index}_${data.column.index}`;
      const img = imageMap.get(key);
      if (img) {
        const cell = data.cell;
        const padX = cell.padding('left');
        const padY = cell.padding('top');
        const availW = cell.width - padX - cell.padding('right');

        // Scale width only if text exceeds cell width constraint
        const scaleW = img.widthMm > availW ? availW / img.widthMm : 1;
        const drawW = img.widthMm * scaleW;
        const drawH = img.heightMm * scaleW;

        const drawX = cell.x + padX;
        // Vertically align image to sit aligned with Latin baseline in cell
        const drawY = cell.y + padY + Math.max(0, (cell.height - padY - cell.padding('bottom') - drawH) / 2) + 0.1;

        doc.addImage(img.dataUrl, 'PNG', drawX, drawY, drawW, drawH);
      }
    }
  };

  return tableOptions;
}

function drawTextOrImage(
  doc: JsPDFInstance,
  text: string,
  x: number,
  y: number,
  options: {
    fontSizePt?: number;
    color?: string;
    fontWeight?: string;
    align?: 'left' | 'center' | 'right';
  } = {},
) {
  if (hasComplexScript(text)) {
    const img = renderShapedText(text, options);
    if (img) {
      let drawX = x;
      if (options.align === 'right') drawX = x - img.widthMm;
      else if (options.align === 'center') drawX = x - img.widthMm / 2;
      const drawY = y - img.heightMm * 0.72;
      doc.addImage(img.dataUrl, 'PNG', drawX, drawY, img.widthMm, img.heightMm);
      return;
    }
  }
  const font = getFont(doc);
  if (options.fontWeight === 'bold') doc.setFont(font, 'bold');
  else doc.setFont(font, 'normal');
  if (options.fontSizePt) doc.setFontSize(options.fontSizePt);
  doc.text(text, x, y, options as any);
}

function addPDFHeader(doc: JsPDFInstance, title: string, subtitle: string, schoolName: string) {
  const font = getFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top accent bar
  doc.setFillColor(98, 37, 209); // Primary brand color
  doc.rect(0, 0, pageWidth, 14, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(font, 'bold');
  doc.text(`${schoolName} - E-Library`, 14, 9.5);

  // Right-side label
  doc.setFontSize(8.5);
  doc.setFont(font, 'normal');
  doc.text('Institutional Academic Report', pageWidth - 14, 9.5, { align: 'right' });

  // Report title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(15);
  doc.setFont(font, 'bold');
  doc.text(title, 14, 25);

  // Subtitle / period
  doc.setFontSize(9.5);
  doc.setFont(font, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, 14, 31);

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 35, pageWidth - 14, 35);
}

function addPDFFooter(doc: JsPDFInstance, generatedAt: string, schoolName: string) {
  const font = getFont(doc);
  const pageCount = (doc.internal as any).getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(8);
    doc.setFont(font, 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(
      `${schoolName} E-Library  |  Generated on ${formatDate(generatedAt)}`,
      14,
      pageHeight - 7,
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
}

function statBox(
  doc: JsPDFInstance,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  sublabel?: string,
) {
  const font = getFont(doc);
  const h = sublabel ? 20 : 17;
  doc.setFillColor(247, 248, 252);
  doc.setDrawColor(225, 228, 238);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont(font, 'bold');
  doc.setTextColor(110, 115, 135);
  doc.text(label.toUpperCase(), x + 4, y + 5);

  doc.setFontSize(11);
  doc.setFont(font, 'bold');
  doc.setTextColor(20, 25, 45);
  doc.text(value, x + 4, y + 12);

  if (sublabel) {
    doc.setFontSize(7);
    doc.setFont(font, 'normal');
    doc.setTextColor(120, 125, 140);
    doc.text(sublabel, x + 4, y + 17);
  }
}

function sectionHeading(doc: JsPDFInstance, text: string, y: number): number {
  const font = getFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  if (y > doc.internal.pageSize.getHeight() - 35) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(11);
  doc.setFont(font, 'bold');
  doc.setTextColor(40, 45, 70);
  doc.text(text, 14, y);

  doc.setDrawColor(210, 215, 230);
  doc.line(14, y + 2.5, pageWidth - 14, y + 2.5);
  return y + 7;
}

function getTableFinalY(doc: JsPDFInstance, fallbackY: number): number {
  return (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 10
    : fallbackY + 40;
}

// ─── Overall Platform Report ──────────────────────────────────────────────────

export async function generateOverallPDF(data: OverallReportData): Promise<void> {
  await ensureKannadaFontFace();
  const doc = await createPdfDocument({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { autoTable } = (await import('jspdf-autotable')) as any;
  const font = getFont(doc);

  const { summary } = data;
  const periodLabel = formatPeriodLabel(data.period.from, data.period.to);
  addPDFHeader(
    doc,
    'Platform Overview & Institutional Learning Report',
    `Period: ${periodLabel}`,
    data.schoolName,
  );

  let y = 40;

  // ── Executive Key Metrics ──
  y = sectionHeading(doc, 'Executive Summary & Learning KPIs', y);

  const boxW = 43;
  // Row 1
  statBox(
    doc,
    14,
    y,
    boxW,
    'Student Cohort',
    `${summary.totalStudents}`,
    `${summary.activeStudents} active / ${summary.inactiveStudents} inactive`,
  );
  statBox(
    doc,
    14 + (boxW + 2.5),
    y,
    boxW,
    'Active Readers',
    `${summary.activeReaders}`,
    `${summary.participationRate}% participation`,
  );
  statBox(
    doc,
    14 + (boxW + 2.5) * 2,
    y,
    boxW,
    'Total Sessions',
    `${summary.totalViews}`,
    'Interactive book views',
  );
  statBox(
    doc,
    14 + (boxW + 2.5) * 3,
    y,
    boxW,
    'Avg Reading Depth',
    `${summary.averageProgressPct}%`,
    'Across all readers',
  );
  y += 23;

  // Row 2
  statBox(
    doc,
    14,
    y,
    boxW,
    'Books Mastered',
    `${summary.completedBooksCount}`,
    'Completed with >= 80%',
  );
  statBox(
    doc,
    14 + (boxW + 2.5),
    y,
    boxW,
    'Cohort Completion',
    `${summary.cohortCompletionRate}%`,
    'Completed >= 1 book',
  );
  statBox(
    doc,
    14 + (boxW + 2.5) * 2,
    y,
    boxW,
    'Digital Repository',
    `${summary.totalResources}`,
    `${summary.totalPagesDigitized} digitized pages`,
  );
  statBox(
    doc,
    14 + (boxW + 2.5) * 3,
    y,
    boxW,
    'Catalog Storage',
    `${summary.totalStorageMB}`,
    `${summary.totalBookmarks} bookmarks saved`,
  );
  y += 26;

  // ── Grade-by-Grade Performance Matrix ──
  y = sectionHeading(doc, 'Grade-by-Grade Engagement & Performance Matrix', y);
  const gradeRows =
    data.gradeMatrix.length > 0
      ? data.gradeMatrix.map((g) => [
          `Grade ${g.grade}`,
          g.totalStudents,
          g.activeReaders,
          pct(g.participationPct),
          g.totalViews,
          pct(g.avgProgressPct),
          g.completedBooks,
          formatSubjectShort(g.topSubject),
        ])
      : [['No student grade data recorded in period', '-', '-', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: y,
    head: [
      [
        'Grade',
        'Enrolled',
        'Active Readers',
        'Participation',
        'Total Views',
        'Avg Progress',
        'Mastered Books',
        'Top Subject Focus',
      ],
    ],
    body: gradeRows,
    theme: 'striped',
    styles: { font, fontSize: 8, cellPadding: 2.2 },
    headStyles: { font, fillColor: [98, 37, 209], fontSize: 8.5, halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });
  y = getTableFinalY(doc, y);

  // ── Subject Curriculum Matrix ──
  y = sectionHeading(doc, 'Subject Curriculum Breakdown & Reader Interest', y);
  const subjectRows =
    data.subjectMatrix.length > 0
      ? data.subjectMatrix.map((s) => [
          s.subject,
          s.titlesCount,
          s.totalViews,
          s.uniqueReaders,
          pct(s.avgCompletionPct),
          s.bookmarksCount,
          s.topGrade,
        ])
      : [['No subject activity recorded in period', '-', '-', '-', '-', '-', '-']];

  autoTable(
    doc,
    attachComplexTextHandlers(
      {
        startY: y,
        head: [
          [
            'Subject',
            'Available Titles',
            'Total Views',
            'Unique Readers',
            'Avg Completion',
            'Bookmarks',
            'Top Grade Level',
          ],
        ],
        body: subjectRows,
        theme: 'striped',
        styles: { font, fontSize: 8, cellPadding: 2.2 },
        headStyles: { font, fillColor: [98, 37, 209], fontSize: 8.5 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      },
      doc,
      subjectRows,
      [0],
      8,
    ),
  );
  y = getTableFinalY(doc, y);

  // ── Top 15 Most Engaged Resources ──
  y = sectionHeading(doc, 'Top 15 Most Engaged Learning Resources', y);
  const topResRows =
    data.topResources.length > 0
      ? data.topResources.map((r) => [
          r.rank,
          truncateText(r.title, 34),
          formatSubjectShort(r.subject),
          r.materialType,
          r.targetGrades,
          r.views,
          r.uniqueReaders,
          pct(r.avgProgressPct),
          r.completionsCount,
        ])
      : [['-', 'No resource reading activity in period', '-', '-', '-', '-', '-', '-', '-']];

  autoTable(
    doc,
    attachComplexTextHandlers(
      {
        startY: y,
        head: [
          [
            '#',
            'Title',
            'Subject',
            'Type',
            'Target Grades',
            'Views',
            'Readers',
            'Avg Progress',
            'Completions',
          ],
        ],
        body: topResRows,
        theme: 'striped',
        styles: { font, fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { font, fillColor: [98, 37, 209], fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 46 },
          2: { cellWidth: 24 },
          3: { cellWidth: 22 },
          4: { cellWidth: 22 },
          5: { cellWidth: 14, halign: 'center' },
          6: { cellWidth: 14, halign: 'center' },
          7: { cellWidth: 16, halign: 'center' },
          8: { cellWidth: 16, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      },
      doc,
      topResRows,
      [1, 2],
      7.5,
    ),
  );
  y = getTableFinalY(doc, y);

  // ── Student Honor Roll ──
  y = sectionHeading(doc, 'Student Honor Roll - Top Dedicated Readers', y);
  const honorRollRows =
    data.studentHonorRoll.length > 0
      ? data.studentHonorRoll.map((s) => [
          `#${s.rank}`,
          s.name,
          s.grade ? `Grade ${s.grade}` : '-',
          s.booksCompleted,
          s.totalViews,
          pct(s.avgProgressPct),
          safeDate(s.lastActive),
        ])
      : [['-', 'No student readers recorded in period', '-', '-', '-', '-', '-']];

  autoTable(
    doc,
    attachComplexTextHandlers(
      {
        startY: y,
        head: [
          [
            'Rank',
            'Student Name',
            'Grade',
            'Books Mastered (>= 80%)',
            'Total Reading Views',
            'Avg Progress',
            'Last Active',
          ],
        ],
        body: honorRollRows,
        theme: 'striped',
        styles: { font, fontSize: 8, cellPadding: 2.2 },
        headStyles: { font, fillColor: [98, 37, 209], fontSize: 8.5 },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 24, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      },
      doc,
      honorRollRows,
      [1],
      8,
    ),
  );
  y = getTableFinalY(doc, y);

  // ── Material Type & Inactive Cohort ──
  y = sectionHeading(doc, 'Material Type Distribution & Inactive Cohort Analysis', y);
  const matRows =
    data.materialTypeMatrix.length > 0
      ? data.materialTypeMatrix.map((m) => [
          m.type,
          m.titlesCount,
          m.totalViews,
          pct(m.viewSharePct),
          pct(m.avgProgressPct),
        ])
      : [['No materials found', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: y,
    head: [['Material Type', 'Titles', 'Views', 'Share (%)', 'Avg Progress']],
    body: matRows,
    theme: 'striped',
    styles: { font, fontSize: 8, cellPadding: 2 },
    headStyles: { font, fillColor: [98, 37, 209], fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  addPDFFooter(doc, data.generatedAt, data.schoolName);
  doc.save(`platform-overview-report-${formatDate(data.generatedAt).replace(/\//g, '-')}.pdf`);
}

export function generateOverallCSV(data: OverallReportData): void {
  const period = formatPeriodLabel(data.period.from, data.period.to);

  const summaryCSV = buildCSV(
    ['Metric', 'Value'],
    [
      ['Report Type', 'Platform Overview & Institutional Learning Report'],
      ['School Name', data.schoolName],
      ['Period', period],
      ['Generated At', formatDate(data.generatedAt)],
      ['Total Enrolled Students', data.summary.totalStudents],
      ['Active Students', data.summary.activeStudents],
      ['Inactive Students', data.summary.inactiveStudents],
      ['Staff Count', data.summary.staffCount],
      ['Total Resources', data.summary.totalResources],
      ['Published Resources', data.summary.publishedResources],
      ['Digitized Pages in Library', data.summary.totalPagesDigitized],
      ['Total Storage', data.summary.totalStorageMB],
      ['Total Reading Sessions / Views', data.summary.totalViews],
      ['Active Readers in Period', data.summary.activeReaders],
      ['Student Participation Rate (%)', data.summary.participationRate],
      ['Average Reading Progress (%)', data.summary.averageProgressPct],
      ['Books Mastered (>= 80%)', data.summary.completedBooksCount],
      ['Cohort Completion Rate (%)', data.summary.cohortCompletionRate],
      ['Total Bookmarks', data.summary.totalBookmarks],
      ['Total Annotations', data.summary.totalAnnotations],
    ],
  );

  const gradeCSV = buildCSV(
    [
      'Grade',
      'Enrolled',
      'Active Readers',
      'Participation (%)',
      'Total Views',
      'Avg Progress (%)',
      'Completed Books',
      'Top Subject',
    ],
    data.gradeMatrix.map((g) => [
      `Grade ${g.grade}`,
      g.totalStudents,
      g.activeReaders,
      g.participationPct,
      g.totalViews,
      g.avgProgressPct,
      g.completedBooks,
      formatSubjectShort(g.topSubject),
    ]),
  );

  const subjectCSV = buildCSV(
    [
      'Subject',
      'Available Titles',
      'Total Views',
      'Unique Readers',
      'Avg Completion (%)',
      'Bookmarks',
      'Top Grade Level',
    ],
    data.subjectMatrix.map((s) => [
      s.subject,
      s.titlesCount,
      s.totalViews,
      s.uniqueReaders,
      s.avgCompletionPct,
      s.bookmarksCount,
      s.topGrade,
    ]),
  );

  const topResCSV = buildCSV(
    [
      'Rank',
      'Title',
      'Subject',
      'Type',
      'Target Grades',
      'Views',
      'Unique Readers',
      'Avg Progress (%)',
      'Completions',
    ],
    data.topResources.map((r) => [
      r.rank,
      r.title,
      formatSubjectShort(r.subject),
      r.materialType,
      r.targetGrades,
      r.views,
      r.uniqueReaders,
      r.avgProgressPct,
      r.completionsCount,
    ]),
  );

  const honorRollCSV = buildCSV(
    [
      'Rank',
      'Name',
      'Grade',
      'Books Completed (>= 80%)',
      'Total Views',
      'Avg Progress (%)',
      'Last Active',
    ],
    data.studentHonorRoll.map((s) => [
      s.rank,
      s.name,
      s.grade ? `Grade ${s.grade}` : '',
      s.booksCompleted,
      s.totalViews,
      s.avgProgressPct,
      s.lastActive ? formatDate(s.lastActive) : '',
    ]),
  );

  const combined = `PLATFORM OVERVIEW & INSTITUTIONAL LEARNING REPORT\r\n\r\nEXECUTIVE SUMMARY\r\n${summaryCSV}\r\n\r\nGRADE PERFORMANCE MATRIX\r\n${gradeCSV}\r\n\r\nSUBJECT PERFORMANCE MATRIX\r\n${subjectCSV}\r\n\r\nTOP 15 ENGAGED RESOURCES\r\n${topResCSV}\r\n\r\nSTUDENT HONOR ROLL\r\n${honorRollCSV}`;
  const blob = new Blob(['\uFEFF' + combined], { type: 'text/csv;charset=utf-8;' });
  downloadFile(
    blob,
    `platform-overview-report-${formatDate(data.generatedAt).replace(/\//g, '-')}.csv`,
  );
}

// ─── All-Students Report ──────────────────────────────────────────────────────

export async function generateAllStudentsPDF(data: AllStudentsReportData): Promise<void> {
  await ensureKannadaFontFace();
  const doc = await createPdfDocument({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { autoTable } = (await import('jspdf-autotable')) as any;
  const font = getFont(doc);

  const { summary } = data;
  const periodLabel = formatPeriodLabel(data.period.from, data.period.to);
  const subtitle = `Period: ${periodLabel}  |  Cohort: ${summary.totalCohort} students  |  Active: ${summary.activeCohort}  |  Completions: ${summary.totalCohortCompletions} books`;
  addPDFHeader(doc, 'All Students Activity & Progression Report', subtitle, data.schoolName);

  // Landscape A4 width: 297mm. Margins left 10, right 10 -> Printable width: 277mm.
  // Column widths sum exactly to 277mm for 100% full width table coverage.
  const studentRows =
    data.students.length > 0
      ? data.students.map((s) => [
          s.rank,
          s.name,
          s.grade ? `Grade ${s.grade}` : '-',
          s.email ?? '-',
          s.status === 'active' ? 'Active' : 'Inactive',
          s.engagementLevel,
          s.uniqueBooksRead,
          s.totalViews,
          s.estimatedPagesRead,
          pct(s.avgProgressPct),
          s.booksCompleted,
          s.booksInProgress,
          formatSubjectShort(s.primarySubject),
          s.bookmarkCount,
          s.notesCount,
          safeDate(s.lastActive),
        ])
      : [
          [
            '-',
            'No students found for this period',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
          ],
        ];

  autoTable(
    doc,
    attachComplexTextHandlers(
      {
        startY: 40,
        head: [
          [
            '#',
            'Student Name',
            'Grade',
            'Email',
            'Status',
            'Level',
            'Books\nRead',
            'Total\nViews',
            'Pages\nRead',
            'Avg\nProg',
            'Mastered\n(>= 80%)',
            'In\nProg',
            'Primary Subject',
            'Marks',
            'Notes',
            'Last Active',
          ],
        ],
        body: studentRows,
        theme: 'striped',
        tableWidth: 277,
        styles: { font, fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { font, fillColor: [98, 37, 209], fontSize: 8, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 34, fontStyle: 'bold' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 32 },
          4: { cellWidth: 16, halign: 'center' },
          5: { cellWidth: 16, halign: 'center' },
          6: { cellWidth: 14, halign: 'center' },
          7: { cellWidth: 14, halign: 'center' },
          8: { cellWidth: 14, halign: 'center' },
          9: { cellWidth: 14, halign: 'center' },
          10: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          11: { cellWidth: 14, halign: 'center' },
          12: { cellWidth: 20 },
          13: { cellWidth: 12, halign: 'center' },
          14: { cellWidth: 12, halign: 'center' },
          15: { cellWidth: 16, halign: 'center' },
        },
        margin: { left: 14, right: 10 },
        didParseCell: (hookData: any) => {
          if (hookData.section === 'body') {
            if (hookData.column.index === 4) {
              const val = hookData.cell.text[0];
              hookData.cell.styles.textColor = val === 'Active' ? [22, 130, 75] : [180, 60, 40];
            }
            if (hookData.column.index === 5) {
              const lvl = hookData.cell.text[0];
              if (lvl === 'High') hookData.cell.styles.textColor = [22, 130, 75];
              else if (lvl === 'Moderate') hookData.cell.styles.textColor = [0, 100, 200];
              else if (lvl === 'Low') hookData.cell.styles.textColor = [200, 130, 0];
              else hookData.cell.styles.textColor = [150, 150, 150];
            }
          }
        },
      },
      doc,
      studentRows,
      [1, 12],
      7.5,
    ),
  );

  addPDFFooter(doc, data.generatedAt, data.schoolName);
  doc.save(`all-students-activity-report-${formatDate(data.generatedAt).replace(/\//g, '-')}.pdf`);
}

export function generateAllStudentsCSV(data: AllStudentsReportData): void {
  const csv = buildCSV(
    [
      'Rank',
      'Student Name',
      'Grade',
      'Email',
      'Account Status',
      'Engagement Level',
      'Unique Books Read',
      'Total Views',
      'Estimated Pages Read',
      'Avg Progress (%)',
      'Books Mastered (>= 80%)',
      'Books In Progress',
      'Books Started',
      'Primary Subject',
      'Bookmarks',
      'Study Notes',
      'Last Active Date',
      'Enrollment Date',
    ],
    data.students.map((s) => [
      s.rank,
      s.name,
      s.grade ? `Grade ${s.grade}` : '',
      s.email ?? '',
      s.status === 'active' ? 'Active' : 'Inactive',
      s.engagementLevel,
      s.uniqueBooksRead,
      s.totalViews,
      s.estimatedPagesRead,
      s.avgProgressPct,
      s.booksCompleted,
      s.booksInProgress,
      s.booksStarted,
      formatSubjectShort(s.primarySubject),
      s.bookmarkCount,
      s.notesCount,
      s.lastActive ? formatDate(s.lastActive) : '',
      formatDate(s.joinedAt),
    ]),
  );
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(
    blob,
    `all-students-activity-report-${formatDate(data.generatedAt).replace(/\//g, '-')}.csv`,
  );
}

// ─── Individual Student Report ────────────────────────────────────────────────

export async function generateIndividualStudentPDF(
  data: IndividualStudentReportData,
): Promise<void> {
  await ensureKannadaFontFace();
  const doc = await createPdfDocument({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { autoTable } = (await import('jspdf-autotable')) as any;
  const font = getFont(doc);

  const { profile, academicOverview, subjectBreakdown, resourceTranscript, learningInsights } =
    data;
  const periodLabel = formatPeriodLabel(data.period.from, data.period.to);
  addPDFHeader(
    doc,
    'Student Academic Dossier & Learning Portfolio',
    `Period: ${periodLabel}`,
    data.schoolName,
  );

  let y = 39;

  // ── Student Profile Dossier Card ──
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(246, 248, 254);
  doc.setDrawColor(220, 225, 242);
  doc.roundedRect(14, y, pageWidth - 28, 24, 2.5, 2.5, 'FD');

  doc.setFontSize(13);
  doc.setFont(font, 'bold');
  doc.setTextColor(25, 30, 55);
  drawTextOrImage(doc, profile.name, 20, y + 7.5, { fontSizePt: 13, fontWeight: 'bold' });

  // Status & Engagement tags
  doc.setFontSize(8);
  doc.setFont(font, 'bold');
  doc.setTextColor(98, 37, 209);
  doc.text(
    `ID: ${profile.studentId}   |   ${profile.grade ? `Grade ${profile.grade}` : 'No Grade'}`,
    20,
    y + 13.5,
  );

  doc.setFont(font, 'normal');
  doc.setTextColor(80, 85, 105);
  const line2 = [
    profile.email ?? null,
    `Status: ${profile.status === 'active' ? 'Active' : 'Inactive'}`,
    `Engagement: ${profile.engagementLevel}`,
    `Enrolled: ${formatDate(profile.joinedAt)}`,
  ]
    .filter(Boolean)
    .join('   |   ');
  doc.text(line2, 20, y + 19);
  y += 29;

  // ── Academic Overview Stat Boxes ──
  y = sectionHeading(doc, 'Academic Engagement Overview', y);
  const boxW = 34.5;
  // Row 1
  statBox(
    doc,
    14,
    y,
    boxW,
    'Total Sessions',
    `${academicOverview.totalReadingSessions}`,
    'Interactive views',
  );
  statBox(
    doc,
    14 + (boxW + 2),
    y,
    boxW,
    'Books Explored',
    `${academicOverview.uniqueBooksRead}`,
    'Distinct titles',
  );
  statBox(
    doc,
    14 + (boxW + 2) * 2,
    y,
    boxW,
    'Pages Read',
    `${academicOverview.estimatedPagesRead}`,
    'Est. volume',
  );
  statBox(
    doc,
    14 + (boxW + 2) * 3,
    y,
    boxW,
    'Avg Progress',
    pct(academicOverview.overallCompletionRate),
    'Across titles',
  );
  statBox(
    doc,
    14 + (boxW + 2) * 4,
    y,
    boxW,
    'Mastered Books',
    `${academicOverview.booksMastered}`,
    '>= 80% progress',
  );
  y += 22;

  // Row 2
  statBox(doc, 14, y, boxW, 'In Progress', `${academicOverview.booksInProgress}`, 'Active reading');
  statBox(
    doc,
    14 + (boxW + 2),
    y,
    boxW,
    'Saved Bookmarks',
    `${academicOverview.savedBookmarks}`,
    'Quick access',
  );
  statBox(
    doc,
    14 + (boxW + 2) * 2,
    y,
    boxW,
    'Study Notes',
    `${academicOverview.notesAndAnnotations}`,
    'Annotations',
  );
  statBox(
    doc,
    14 + (boxW + 2) * 3,
    y,
    boxW,
    'Primary Subject',
    formatSubjectShort(academicOverview.primarySubject),
    'Most active',
  );
  statBox(
    doc,
    14 + (boxW + 2) * 4,
    y,
    boxW,
    'Study Consistency',
    `${academicOverview.readingConsistency}`,
    'Habit index',
  );
  y += 25;

  // ── Subject Breakdown Table ──
  y = sectionHeading(doc, 'Subject-Wise Mastery & Activity Breakdown', y);
  const subBreakdownRows =
    subjectBreakdown.length > 0
      ? subjectBreakdown.map((s) => [
          s.subject,
          s.booksAccessed,
          s.totalViews,
          pct(s.avgProgressPct),
          s.completedCount,
        ])
      : [['No subject activity recorded in this period', '-', '-', '-', '-']];

  autoTable(
    doc,
    attachComplexTextHandlers(
      {
        startY: y,
        head: [
          ['Subject', 'Books Explored', 'Total Views', 'Average Progress', 'Mastered Books (>= 80%)'],
        ],
        body: subBreakdownRows,
        theme: 'striped',
        styles: { font, fontSize: 8, cellPadding: 2.2 },
        headStyles: { font, fillColor: [98, 37, 209], fontSize: 8.5 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      },
      doc,
      subBreakdownRows,
      [0],
      8,
    ),
  );
  y = getTableFinalY(doc, y);

  // ── Detailed Resource Activity Transcript ──
  y = sectionHeading(doc, 'Detailed Learning Resource Reading Transcript', y);
  const transcriptRows =
    resourceTranscript.length > 0
      ? resourceTranscript.map((r, i) => [
          i + 1,
          truncateText(r.title, 34),
          formatSubjectShort(r.subject),
          r.materialType,
          r.readingStatus,
          pct(r.progressPct),
          r.readingDepth,
          r.timesViewed,
          r.isBookmarked ? 'Yes' : 'No',
          safeDate(r.lastReadDate),
        ])
      : [
          [
            '-',
            'No reading history recorded in this period',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
          ],
        ];

  autoTable(
    doc,
    attachComplexTextHandlers(
      {
        startY: y,
        head: [
          [
            '#',
            'Title',
            'Subject',
            'Type',
            'Status',
            'Progress',
            'Reading Depth',
            'Views',
            'Mark',
            'Last Read',
          ],
        ],
        body: transcriptRows,
        theme: 'striped',
        tableWidth: 182,
        styles: { font, fontSize: 7.5, cellPadding: 1.8, overflow: 'linebreak' },
        headStyles: { font, fillColor: [98, 37, 209], fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 44, fontStyle: 'bold' },
          2: { cellWidth: 24 },
          3: { cellWidth: 18 },
          4: { cellWidth: 17, halign: 'center' },
          5: { cellWidth: 14, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 10, halign: 'center' },
          8: { cellWidth: 10, halign: 'center' },
          9: { cellWidth: 18, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
        didParseCell: (hookData: any) => {
          if (hookData.section === 'body' && hookData.column.index === 4) {
            const val = hookData.cell.text[0];
            if (val === 'Completed') hookData.cell.styles.textColor = [22, 130, 75];
            else if (val === 'In Progress') hookData.cell.styles.textColor = [0, 100, 200];
            else hookData.cell.styles.textColor = [150, 150, 150];
          }
        },
      },
      doc,
      transcriptRows,
      [1, 2],
      7.5,
    ),
  );
  y = getTableFinalY(doc, y);

  // ── Qualitative Learning Insights ──
  y = sectionHeading(doc, 'Academic Observations & Learning Insights', y);
  doc.setFillColor(250, 251, 255);
  doc.setDrawColor(225, 230, 245);

  const insightLines = learningInsights;
  const cardHeight = Math.max(22, insightLines.length * 6 + 6);
  if (y + cardHeight > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    y = 20;
  }
  doc.roundedRect(14, y, pageWidth - 28, cardHeight, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont(font, 'normal');
  doc.setTextColor(50, 55, 75);
  insightLines.forEach((line, idx) => {
    doc.text(`*  ${line}`, 18, y + 6 + idx * 6);
  });

  addPDFFooter(doc, data.generatedAt, data.schoolName);
  const safeName = profile.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  doc.save(
    `student-academic-dossier-${safeName}-${formatDate(data.generatedAt).replace(/\//g, '-')}.pdf`,
  );
}

export function generateIndividualStudentCSV(data: IndividualStudentReportData): void {
  const { profile, academicOverview, subjectBreakdown, resourceTranscript } = data;
  const period = formatPeriodLabel(data.period.from, data.period.to);

  const profileCSV = buildCSV(
    ['Field', 'Value'],
    [
      ['Student Name', profile.name],
      ['Student ID', profile.studentId],
      ['Grade', profile.grade ? `Grade ${profile.grade}` : ''],
      ['Email', profile.email ?? ''],
      ['Account Status', profile.status === 'active' ? 'Active' : 'Inactive'],
      ['Engagement Level', profile.engagementLevel],
      ['Enrollment Date', formatDate(profile.joinedAt)],
      ['Last Active Date', profile.lastActive ? formatDate(profile.lastActive) : ''],
      ['Reporting Period', period],
      ['Total Reading Sessions', academicOverview.totalReadingSessions],
      ['Unique Books Explored', academicOverview.uniqueBooksRead],
      ['Estimated Pages Read', academicOverview.estimatedPagesRead],
      ['Average Reading Progress (%)', academicOverview.overallCompletionRate],
      ['Books Mastered (>= 80%)', academicOverview.booksMastered],
      ['Books In Progress (15-79%)', academicOverview.booksInProgress],
      ['Books Started (< 15%)', academicOverview.booksStarted],
      ['Saved Bookmarks', academicOverview.savedBookmarks],
      ['Notes & Annotations Created', academicOverview.notesAndAnnotations],
      ['Primary Subject Focus', formatSubjectShort(academicOverview.primarySubject)],
      ['Reading Consistency', academicOverview.readingConsistency],
    ],
  );

  const subjectCSV = buildCSV(
    ['Subject', 'Books Explored', 'Total Views', 'Avg Progress (%)', 'Mastered Books (>= 80%)'],
    subjectBreakdown.map((s) => [
      s.subject,
      s.booksAccessed,
      s.totalViews,
      s.avgProgressPct,
      s.completedCount,
    ]),
  );

  const transcriptCSV = buildCSV(
    [
      '#',
      'Title',
      'Subject',
      'Material Type',
      'Reading Status',
      'Progress (%)',
      'Reading Depth',
      'Times Viewed',
      'Bookmarked',
      'Annotations',
      'Last Read Date',
    ],
    resourceTranscript.map((r, i) => [
      i + 1,
      r.title,
      formatSubjectShort(r.subject),
      r.materialType,
      r.readingStatus,
      r.progressPct,
      r.readingDepth,
      r.timesViewed,
      r.isBookmarked ? 'Yes' : 'No',
      r.annotationsCount,
      r.lastReadDate ? formatDate(r.lastReadDate) : '',
    ]),
  );

  const combined = `STUDENT ACADEMIC DOSSIER & LEARNING PORTFOLIO\r\n\r\nSTUDENT PROFILE & ACADEMIC SUMMARY\r\n${profileCSV}\r\n\r\nSUBJECT MASTERY BREAKDOWN\r\n${subjectCSV}\r\n\r\nRESOURCE ACTIVITY TRANSCRIPT\r\n${transcriptCSV}`;
  const blob = new Blob(['\uFEFF' + combined], { type: 'text/csv;charset=utf-8;' });
  const safeName = profile.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  downloadFile(
    blob,
    `student-academic-dossier-${safeName}-${formatDate(data.generatedAt).replace(/\//g, '-')}.csv`,
  );
}
