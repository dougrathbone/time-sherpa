import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('renders loading message', () => {
    render(<LoadingState />);
    
    expect(screen.getByText('Analyzing Your Calendar')).toBeInTheDocument();
    expect(screen.getByText('Our AI is processing your calendar data to generate insights...')).toBeInTheDocument();
  });

  it('displays loading spinner', () => {
    render(<LoadingState />);
    
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });
}); 