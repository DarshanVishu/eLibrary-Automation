export interface MaterialData {
  id: string;
  title: string;
  subject: string;
  grade: number;
  pdfUrl?: string;
}

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NoteRecord {
  id: string;
  annotation_data: {
    page: number;
    type: 'note' | 'highlight' | 'area';
    note?: string;
    text?: string;
    color?: string;
    rects?: HighlightRect[];
    updatedAt?: string;
  };
}
