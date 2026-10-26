import { mockSupabase } from '../../__mocks__/supabase';
import { TeacherUploads } from '@/components/teacher/teacher-uploads';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the UploadProvider component and useUploads hook
vi.mock('@/components/providers/upload-provider', async (importOriginal) => {
  const actual = (await importOriginal()) as { useUploads: any; [key: string]: any };
  return {
    ...actual,
    useUploads: actual.useUploads,
    useAutoRefreshOnUpload: vi.fn(),
    UploadProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock the UploadProvider context
vi.mock('@/lib/context/upload-context', () => ({
  UploadContext: { createContext: () => ({}) },
  useUploads: () => ({
    uploads: [],
    stats: { totalUploads: 0, pendingApproval: 0, totalDownloads: 0, totalViews: 0 },
    loading: false,
    error: null,
    refreshUploads: vi.fn(),
  }),
}));

// Import the mocked UploadProvider
const { UploadProvider } = await import('@/components/providers/upload-provider');

// Mock the Supabase client to prevent real connections
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock the server action that fetches upload data
vi.mock('@/app/teacher/uploads/actions', () => ({
  getTeacherUploadsData: vi.fn(() =>
    Promise.resolve({
      books: [
        {
          id: '1',
          title: 'Math Worksheet 1',
          type: 'worksheet',
          subject: 'Mathematics',
          grade: 10,
          uploadedBy: 'teacher-123',
          icon: 'description' as const,
          published: true,
          createdAt: '2024-01-15',
          views: 45,
          pages: 10,
          fileSize: '2.5 MB',
        },
        {
          id: '2',
          title: 'Science Quiz',
          type: 'quiz',
          subject: 'Science',
          grade: 11,
          uploadedBy: 'teacher-123',
          icon: 'description' as const,
          published: false,
          createdAt: '2024-01-16',
          views: 20,
          pages: 5,
          fileSize: '1.2 MB',
        },
      ],
      subjects: ['Mathematics', 'Science'],
      materialTypes: ['worksheet', 'quiz'],
      contentBySubject: [
        { subject: 'Mathematics', count: 1 },
        { subject: 'Science', count: 1 },
      ],
      stats: {
        total: 2,
        published: 1,
        pending: 1,
        totalViews: 65,
      },
    }),
  ),
  getTeacherPreviewUrl: vi.fn(() => Promise.resolve({ url: 'https://example.com/preview.pdf' })),
}));

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h3 data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
}));

vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name, ...props }: any) => <span data-testid={`icon-${name}`} {...props}></span>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress" {...props}>
      <span data-testid="progress-value">{value}%</span>
    </div>
  ),
}));

describe('TeacherUploads Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render uploads list component', async () => {
    render(
      <UploadProvider>
        <TeacherUploads />
      </UploadProvider>,
    );

    // Wait for component to load and render
    await screen.findByText('My Uploads');

    // Check for upload titles
    expect(screen.getByText('Math Worksheet 1')).toBeInTheDocument();
    expect(screen.getByText('Science Quiz')).toBeInTheDocument();
  });

  it('should display upload statistics', async () => {
    render(
      <UploadProvider>
        <TeacherUploads />
      </UploadProvider>,
    );

    // Wait for component to render
    await screen.findByText('My Uploads');

    // Check that the component renders successfully with upload data
    expect(screen.getByText('Math Worksheet 1')).toBeInTheDocument();
    expect(screen.getByText('Science Quiz')).toBeInTheDocument();
    expect(screen.getByText('45 views')).toBeInTheDocument();
    expect(screen.getByText('20 views')).toBeInTheDocument();
  });

  it('should handle empty uploads list', async () => {
    // Mock empty response
    const { getTeacherUploadsData } = await import('@/app/teacher/uploads/actions');
    vi.mocked(getTeacherUploadsData).mockResolvedValueOnce({
      books: [],
      subjects: [],
      materialTypes: [],
      contentBySubject: [],
      stats: {
        total: 0,
        published: 0,
        pending: 0,
        totalViews: 0,
      },
    });

    render(
      <UploadProvider>
        <TeacherUploads />
      </UploadProvider>,
    );

    // Check for empty state
    const emptyState = await screen.findByText(/No materials found/i);
    expect(emptyState).toBeInTheDocument();
  });

  it('should handle upload interactions', async () => {
    render(
      <UploadProvider>
        <TeacherUploads />
      </UploadProvider>,
    );

    // Wait for component to render
    await screen.findByText('Math Worksheet 1');

    // Test clicking on an upload - use the actual rendered elements
    const uploadItems = screen.getAllByText('Math Worksheet 1');
    if (uploadItems.length > 0) {
      fireEvent.click(uploadItems[0]);
      // Should trigger navigation or interaction
    }
  });

  it('should have proper accessibility', async () => {
    render(
      <UploadProvider>
        <TeacherUploads />
      </UploadProvider>,
    );

    // Wait for component to render
    await screen.findByText('My Uploads');

    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('My Uploads');
  });
});
