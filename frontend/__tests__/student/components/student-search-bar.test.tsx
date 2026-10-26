import { SearchBar } from '@/components/student/student-search-bar';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{`Icon-${name}`}</span>,
}));

describe('SearchBar Component', () => {
  it('renders search input with default placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    // clear button should not be present initially
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Find items..." />);

    expect(screen.getByPlaceholderText('Find items...')).toBeInTheDocument();
  });

  it('calls onChange when user types in input', async () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'x');

    // handleChange should fire for the single keystroke
    expect(handleChange).toHaveBeenCalledWith('x');
  });

  it('displays clear button when value is given and clears when clicked', async () => {
    const handleChange = vi.fn();
    render(<SearchBar value="hello" onChange={handleChange} />);

    const input = screen.getByDisplayValue('hello');
    expect(input).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toBeInTheDocument();

    await userEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });
});
