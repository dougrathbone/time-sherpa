import React from 'react';
import { render, screen } from '@testing-library/react';
import Landing from '../Landing';
import { useAuth } from '../../hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../hooks/useAuth');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams()],
}));

const mockUseAuth = useAuth as jest.Mock;

describe('Landing Page', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
    });
  });

  it('renders the main heading', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(screen.getByText(/Master Your Time/i)).toBeInTheDocument();
  });

  it('renders the "Sign in with Google" button', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    const button = screen.getByRole('button', { name: /sign in with google/i });
    expect(button).toBeInTheDocument();
  });

  it('button is centered', () => {
    render(<BrowserRouter><Landing /></BrowserRouter>);
    const button = screen.getByRole('button', { name: /sign in with google/i });
    // Check if the button's parent has the centering classes
    expect(button.parentElement).toHaveClass('flex');
    expect(button.parentElement).toHaveClass('justify-center');
  });

  it('shows loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: jest.fn(),
    });
    render(<BrowserRouter><Landing /></BrowserRouter>);
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });
}); 