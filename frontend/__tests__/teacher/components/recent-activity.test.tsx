import { RecentActivity } from '@/components/teacher/dashboard/recent-activity';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name, className }: any) => <span data-testid={`icon-${name}`} className={className} />,
}));

describe('RecentActivity', () => {
  const sampleActivity = [{ type: 'approved', action: 'Maths PDF approved', time: '1 hour ago' }];

  it('renders check_circle icon with text-success when pendingCount is 0', () => {
    render(<RecentActivity recentActivity={sampleActivity} pendingCount={0} />);

    expect(screen.getByText('0 materials pending admin approval')).toBeInTheDocument();

    // Check that check_circle icon is rendered for pending status alert
    const checkIcons = screen.getAllByTestId('icon-check_circle');
    expect(checkIcons.length).toBeGreaterThanOrEqual(1);
    expect(checkIcons[0]).toHaveClass('text-success');
  });

  it('renders warning icon with text-warning when pendingCount > 0', () => {
    render(<RecentActivity recentActivity={sampleActivity} pendingCount={3} />);

    expect(screen.getByText('3 materials pending admin approval')).toBeInTheDocument();

    const warningIcon = screen.getByTestId('icon-warning');
    expect(warningIcon).toBeInTheDocument();
    expect(warningIcon).toHaveClass('text-warning');
  });
});
