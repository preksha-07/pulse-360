import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Widget from '../components/Widget';

describe('Widget Component', () => {
  it('should render the title and children correctly', () => {
    render(
      <Widget title="Test Title">
        <div data-testid="child">Test Child Content</div>
      </Widget>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Test Child Content');
  });

  it('should render the icon when provided', () => {
    const mockIcon = <span data-testid="icon">★</span>;
    render(
      <Widget title="Test Title" icon={mockIcon}>
        <div>Children</div>
      </Widget>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should render custom badge when provided', () => {
    render(
      <Widget title="Test Title" badge={{ text: 'ALERT', color: 'crimson' }}>
        <div>Children</div>
      </Widget>
    );

    const badge = screen.getByText('ALERT');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('widget-badge crimson');
  });

  it('should default badge color to cyan if not specified', () => {
    render(
      <Widget title="Test Title" badge={{ text: 'INFO' }}>
        <div>Children</div>
      </Widget>
    );

    const badge = screen.getByText('INFO');
    expect(badge).toHaveClass('widget-badge cyan');
  });

  it('should apply custom styles when provided', () => {
    const customStyle = { marginTop: '20px', padding: '10px' };
    const { container } = render(
      <Widget title="Test Title" style={customStyle}>
        <div>Children</div>
      </Widget>
    );

    const widgetDiv = container.querySelector('.widget');
    expect(widgetDiv).toHaveStyle('margin-top: 20px');
    expect(widgetDiv).toHaveStyle('padding: 10px');
  });
});
