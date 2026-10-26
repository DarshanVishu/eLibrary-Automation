'use client';
import { Dots_v4 } from '@/components/shared/dots-animation';
import dynamic from 'next/dynamic';

const PDFViewerClient = dynamic(() => import('./pdf-viewer-client'), {
  ssr: false,
  loading: () => (
    // Fill the main content area while the heavy PDF bundle loads
    <div className="bg-background text-foreground flex h-full flex-col items-center justify-center gap-3">
      <Dots_v4 />
      <p className="text-muted-foreground animate-pulse text-sm font-medium">
        Please wait, loading reader...
      </p>
    </div>
  ),
});

export default function PDFViewerPage() {
  return (
    // Negate the layout's p-5/p-6 padding so the viewer fills the full content
    // area edge-to-edge, then re-constrain overflow so the flex viewer works.
    <div className="-m-5 flex h-[calc(100%+2.5rem)] flex-col overflow-hidden lg:-m-6 lg:h-[calc(100%+3rem)]">
      {/* react-pdf CSS served as static files to avoid Turbopack/bundler issues */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/react-pdf/TextLayer.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/react-pdf/AnnotationLayer.css" />
      <PDFViewerClient />
    </div>
  );
}
