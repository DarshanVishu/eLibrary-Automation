import { MaterialCard } from '@/components/student/student-material-card';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// Mock the Icon component since it might rely on specific SVG imports or contexts
vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{`Icon-${name}`}</span>,
}));

// Mock the Badge and Progress to avoid internal ui logic testing here
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div data-testid="badge">{children}</div>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress">Progress: {value}</div>,
}));

describe('MaterialCard Component', () => {
  const defaultProps = {
    id: 'mat-1',
    title: 'Algebra Vol 1',
    subject: 'Mathematics',
    grades: [9, 10],
    materialType: 'Textbook' as const,
  };

  it('should render the basic material details correctly', () => {
    render(<MaterialCard {...defaultProps} />);

    expect(screen.getByText('Algebra Vol 1')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Textbook')).toBeInTheDocument();
    expect(screen.getAllByTestId('badge').length).toBeGreaterThan(0);
  });

  it('should render cover image if provided', () => {
    render(<MaterialCard {...defaultProps} coverImage="https://example.com/cover.jpg" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
    expect(img).toHaveAttribute('alt', 'Algebra Vol 1');
  });

  it('should render a placeholder with subject icon if coverImage is not provided', () => {
    render(<MaterialCard {...defaultProps} subject="Science" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // Subject Science has the microscope icon
    expect(screen.getByTestId('icon-microscope')).toBeInTheDocument();
  });

  it('should render progress bar and percentage if progress is between 1 and 99', () => {
    render(<MaterialCard {...defaultProps} progress={50} />);

    expect(screen.getByTestId('progress')).toHaveTextContent('Progress: 50');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render Done label if progress is 100', () => {
    render(<MaterialCard {...defaultProps} progress={100} />);

    expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('should fire the onClick callback when card is clicked', async () => {
    const handleClick = vi.fn();
    render(<MaterialCard {...defaultProps} onClick={handleClick} />);

    // To click the card, typically testing library prefers userEvent on interactive elements
    const title = screen.getByText('Algebra Vol 1');
    await userEvent.click(title);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
