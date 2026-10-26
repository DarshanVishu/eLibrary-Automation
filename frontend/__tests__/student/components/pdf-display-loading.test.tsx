import { PDFDisplay } from '@/components/student/viewer/pdf-display';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('react-pdf', () => ({
  Document: ({ children }: any) => <div data-testid="react-pdf-document">{children}</div>,
  Page: () => <div data-testid="react-pdf-page" />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));

vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name }: any) => <span data-testid={`icon-${name}`} />,
}));

vi.mock('@/components/shared/dots-animation', () => ({
  Dots_v4: () => <div data-testid="dots-v4" />,
}));

describe('PDFDisplay Loading States', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('progressively updates loading state messages for large files', () => {
    const dummyRef = { current: null };

    render(
      <PDFDisplay
        pdfLoading={true}
        pdfError={false}
        numPages={0}
        containerRef={dummyRef}
        pageRefs={{ current: [] }}
        pageWidth={800}
        areaSelectionMode={false}
        notes={[]}
        drawStart={null}
        drawCurrent={null}
        onLoadSuccess={() => {}}
        onLoadError={() => {}}
        onTextSelection={() => {}}
        onPageMouseDown={() => {}}
        onPageMouseMove={() => {}}
        onPageMouseUp={() => {}}
      />,
    );

    // Initial stage (0-3s)
    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
    expect(screen.getByText('Preparing your textbook pages.')).toBeInTheDocument();

    // Fast-forward 3.5 seconds -> Stage 1
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByText('Please wait, loading textbook...')).toBeInTheDocument();
    expect(
      screen.getByText('Large textbooks may take a few moments to download and process.'),
    ).toBeInTheDocument();

    // Fast-forward another 4 seconds (total > 7s) -> Stage 2
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('Taking longer than usual, please wait...')).toBeInTheDocument();
    expect(
      screen.getByText('Processing pages and annotations. Thank you for your patience.'),
    ).toBeInTheDocument();
  });
});
