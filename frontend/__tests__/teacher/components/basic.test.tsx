import { render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, it, expect } from 'vitest';

// Mock ResizeObserver for this test
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock the Header component - let's create a simple test first
describe('Teacher Components', () => {
  describe('Basic Rendering', () => {
    it('should render a simple component without errors', () => {
      // This is a basic test to verify our setup works
      const TestComponent = () => <div data-testid="test-component">Hello Teacher</div>;

      render(<TestComponent />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Hello Teacher')).toBeInTheDocument();
    });

    it('should have working global mocks', () => {
      // Test that our global mocks are working
      expect(typeof global.ResizeObserver).toBe('function');

      // Test that toast mock is available
      expect(typeof toast.success).toBe('function');
      expect(typeof toast.error).toBe('function');
    });
  });
});
