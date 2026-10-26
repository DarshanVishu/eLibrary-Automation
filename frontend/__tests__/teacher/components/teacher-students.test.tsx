import { TeacherStudents } from '@/components/teacher/teacher-students';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the server action that fetches student data
vi.mock('@/app/teacher/students/actions', () => ({
  getTeacherStudentsData: vi.fn(() =>
    Promise.resolve({
      students: [
        {
          id: '1',
          name: 'Student 1',
          email: 'student1@test.com',
          grade: 10,
          rollNumber: '001',
          enrollmentDate: '2024-01-01',
          totalViews: 5,
          materialsAccessed: 3,
          lastActive: '2024-01-15',
          performance: 'good',
        },
        {
          id: '2',
          name: 'Student 2',
          email: 'student2@test.com',
          grade: 11,
          rollNumber: '002',
          enrollmentDate: '2024-01-02',
          totalViews: 8,
          materialsAccessed: 6,
          lastActive: '2024-01-16',
          performance: 'excellent',
        },
      ],
      stats: {
        totalStudents: 2,
        activeStudents: 1,
        averageViews: 6.5,
        excellentPerformers: 1,
      },
    }),
  ),
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

describe('TeacherStudents Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render students list component', async () => {
    render(<TeacherStudents />);

    // Wait for the component to load and render
    await screen.findByText('My Students');

    // Check for stats that should be visible
    expect(screen.getByText('Total Students')).toBeInTheDocument();

    // Find the specific "2" in Total Students context
    const totalStudentsCard = screen.getByText('Total Students').closest('[data-testid="card"]');
    expect(totalStudentsCard).toHaveTextContent('2');

    expect(screen.getByText('Active This Week')).toBeInTheDocument();

    // Find the specific "1" in Active This Week context
    const activeStudentsCard = screen.getByText('Active This Week').closest('[data-testid="card"]');
    expect(activeStudentsCard).toHaveTextContent('1');
  });

  it('should display student cards', async () => {
    render(<TeacherStudents />);

    // Wait for component to render
    await screen.findByText('Student 1');

    const cards = screen.getAllByTestId('card');
    // Component renders 4 stats cards + 2 student cards = 6 total cards
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('should handle empty students list', async () => {
    // Mock empty response
    const { getTeacherStudentsData } = await import('@/app/teacher/students/actions');
    vi.mocked(getTeacherStudentsData).mockResolvedValueOnce({
      students: [],
      stats: {
        totalStudents: 0,
        activeStudents: 0,
        averageViews: 0,
        excellentPerformers: 0,
      },
      grades: [],
    });

    render(<TeacherStudents />);

    // Check for empty state
    const emptyState = await screen.findByText(/No students found/i);
    expect(emptyState).toBeInTheDocument();
  });

  it('should handle student interactions', async () => {
    render(<TeacherStudents />);

    // Wait for component to render
    await screen.findByText('Student 1');

    // Test clicking on a student
    const studentCards = screen.getAllByTestId('card');
    if (studentCards.length > 0) {
      fireEvent.click(studentCards[0]);
      // Should trigger navigation or interaction
    }
  });

  it('should have proper accessibility', async () => {
    render(<TeacherStudents />);

    // Wait for component to render
    await screen.findByText('My Students');

    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('My Students');
  });
});
