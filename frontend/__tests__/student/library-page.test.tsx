// @vitest-environment jsdom
import LibraryBrowse from '@/app/student/library/page';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams('type=Guide');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/hooks/useStudentMaterials', () => ({
  useStudentMaterials: () => ({
    user: { id: 'student-1', grade: 7 },
    materials: [
      {
        id: 'mat-1',
        title: 'Algebra Basics',
        subject: 'Mathematics',
        grades: [7],
        materialType: 'Textbook',
        progress: 0,
        isBookmarked: false,
      },
      {
        id: 'mat-2',
        title: 'Science Revision',
        subject: 'Science',
        grades: [7],
        materialType: 'Guide',
        progress: 35,
        isBookmarked: true,
      },
    ],
    bypassEnabled: false,
    studentGrade: 7,
    loading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/components/shared/loading-animation', () => ({
  FullScreenLoading: () => <div>Loading...</div>,
}));

vi.mock('@/components/shared/refresh-button', () => ({
  RefreshButton: ({ onRefresh }: { onRefresh: () => void }) => (
    <button onClick={onRefresh}>Refresh</button>
  ),
}));

vi.mock('@/components/student/student-empty-state', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('@/components/student/student-material-card', () => ({
  MaterialCard: ({ title, onClick }: { title: string; onClick?: () => void }) => (
    <button onClick={onClick}>{title}</button>
  ),
}));

vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name }: { name: string }) => <span>{name}</span>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => {
    const items: Array<{ value: string; label: string }> = [];

    const collectItems = (node: ReactNode): void => {
      for (const child of Array.isArray(node) ? node : [node]) {
        if (!child || typeof child !== 'object') continue;
        const element = child as ReactElement<{ value?: string; children?: ReactNode }>;
        if (typeof element.props?.value === 'string') {
          items.push({
            value: element.props.value,
            label:
              typeof element.props.children === 'string'
                ? element.props.children
                : element.props.value,
          });
        }
        collectItems(element.props?.children);
      }
    };

    collectItems(children);

    return (
      <select value={value ?? ''} onChange={(event) => onValueChange(event.target.value)}>
        <option value="">All</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    );
  },
  SelectTrigger: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('LibraryBrowse', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockPush.mockReset();
  });

  it('applies the material type search param on first render', () => {
    render(<LibraryBrowse />);

    expect(screen.getByRole('button', { name: 'Science Revision' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Algebra Basics' })).not.toBeInTheDocument();
  });

  it('updates the material type filter when selected', () => {
    render(<LibraryBrowse />);

    // Open filter popover
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
    // Change material type filter to 'all' or another type
    fireEvent.change(selects[1], { target: { value: 'all' } });

    expect(mockReplace).toHaveBeenCalledWith('/student/library');
  });
});
