// @vitest-environment jsdom
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { AdminPendingBanner } from '@/components/admin/dashboard/pending-banner';
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
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));
vi.mock('@/components/shared/upload-sheet', () => ({
  UploadSheet: () => null,
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('AdminPendingBanner', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<AdminPendingBanner count={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows submission count when count > 0', () => {
    render(<AdminPendingBanner count={5} />);
    expect(screen.getByText('5 submissions')).toBeInTheDocument();
    expect(screen.getByText(/awaiting your review/)).toBeInTheDocument();
  });

  it('renders Review Now button', () => {
    render(<AdminPendingBanner count={3} />);
    expect(screen.getByText('Review Now')).toBeInTheDocument();
  });

  it('renders Upload Content button', () => {
    render(<AdminPendingBanner count={3} />);
    expect(screen.getByText('Upload Content')).toBeInTheDocument();
  });

  it('navigates to approvals when Review Now is clicked', async () => {
    render(<AdminPendingBanner count={2} />);
    const btn = screen.getByText('Review Now');
    btn.click();
    expect(mockPush).toHaveBeenCalledWith('/admin/approvals');
  });
});
