```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound component', () => {
  it('renders "404 - Page Not Found" text', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
  });

  it('renders a message about the page not existing', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    expect(screen.getByText('The page you are looking for does not exist.')).toBeInTheDocument();
  });

  it('renders a "Go to Dashboard" button', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    const button = screen.getByRole('link', { name: /go to dashboard/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/dashboard');
  });
});
```