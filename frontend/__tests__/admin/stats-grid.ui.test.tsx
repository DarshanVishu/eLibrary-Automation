// @vitest-environment jsdom
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { AdminStatsGrid } from '@/components/admin/dashboard/stats-grid';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── Mock dependencies ────────────────────────────────────────────────────────
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
}));
vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name, ...props }: any) => <span data-testid={`icon-${name}`} {...props} />,
}));

afterEach(cleanup);

// ── Tests ────────────────────────────────────────────────────────────────────
describe('AdminStatsGrid', () => {
  const mockStats = [
    { label: 'Active Students', value: '120', icon: 'student', trend: 'Current', positive: true },
    { label: 'Resources', value: '85', icon: 'books', trend: 'Total', positive: true },
    { label: 'Total Views', value: '1,500', icon: 'eye', trend: 'Lifetime', positive: true },
    {
      label: 'Pending Review',
      value: '3',
      icon: 'pending',
      trend: 'Needs action',
      positive: false,
    },
  ];

  it('renders all 4 stat cards', () => {
    render(<AdminStatsGrid stats={mockStats} />);
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(4);
  });

  it('displays stat values', () => {
    render(<AdminStatsGrid stats={mockStats} />);
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays stat labels', () => {
    render(<AdminStatsGrid stats={mockStats} />);
    expect(screen.getByText('Active Students')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Total Views')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('displays trend text', () => {
    render(<AdminStatsGrid stats={mockStats} />);
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Needs action')).toBeInTheDocument();
  });

  it('renders icons for each stat', () => {
    render(<AdminStatsGrid stats={mockStats} />);
    expect(screen.getByTestId('icon-student')).toBeInTheDocument();
    expect(screen.getByTestId('icon-books')).toBeInTheDocument();
    expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
    expect(screen.getByTestId('icon-pending')).toBeInTheDocument();
  });

  it('applies positive/warning styling based on positive flag', () => {
    render(<AdminStatsGrid stats={mockStats} />);
    const currentTrend = screen.getByText('Current');
    expect(currentTrend.className).toContain('text-success');
    const actionTrend = screen.getByText('Needs action');
    expect(actionTrend.className).toContain('text-warning');
  });

  it('handles empty stats array', () => {
    render(<AdminStatsGrid stats={[]} />);
    expect(screen.queryAllByTestId('card')).toHaveLength(0);
  });

  it('omits trend when not provided', () => {
    const noTrendStats = [{ label: 'Test', value: '0', icon: 'star' }];
    render(<AdminStatsGrid stats={noTrendStats} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
