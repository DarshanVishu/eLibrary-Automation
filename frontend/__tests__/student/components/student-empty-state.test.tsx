import { EmptyState } from '@/components/student/student-empty-state';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{`Icon-${name}`}</span>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button data-testid={`button-${variant || 'default'}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('EmptyState Component', () => {
  it('renders correctly with required props', () => {
    render(
      <EmptyState
        icon="folder_open"
        title="No folders"
        description="Create a folder to get started."
      />,
    );

    expect(screen.getByTestId('icon-folder_open')).toBeInTheDocument();
    expect(screen.getByText('No folders')).toBeInTheDocument();
    expect(screen.getByText('Create a folder to get started.')).toBeInTheDocument();
  });

  it('renders primary action button if provided', async () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        icon="book"
        title="Empty Library"
        description="Nothing here."
        action={{ label: 'Explore Books', onClick: handleAction, icon: 'search' }}
      />,
    );

    expect(screen.getByText('Explore Books')).toBeInTheDocument();
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('button-default'));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action button if provided', async () => {
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();
    render(
      <EmptyState
        icon="book"
        title="Empty Library"
        description="Nothing here."
        action={{ label: 'Primary', onClick: handlePrimary }}
        secondaryAction={{ label: 'Secondary', onClick: handleSecondary, variant: 'outline' }}
      />,
    );

    expect(screen.getByText('Secondary')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('button-outline'));
    expect(handleSecondary).toHaveBeenCalledTimes(1);
    expect(handlePrimary).not.toHaveBeenCalled();
  });
});
