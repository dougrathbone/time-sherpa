import React from 'react';
import { render, screen } from '@testing-library/react';
import AttendeeAvatar from '../AttendeeAvatar';

// Mock the profile images utility
jest.mock('../../utils/profileImages', () => ({
  getProfileImageUrl: jest.fn(() => Promise.resolve(null)),
  getInitials: jest.fn((email, displayName) => {
    const name = displayName || email.split('@')[0];
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }),
  getAvatarColor: jest.fn(() => '#075056')
}));

describe('AttendeeAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initials for user without profile image', async () => {
    render(
      <AttendeeAvatar 
        email="john.doe@company.com" 
        displayName="John Doe" 
      />
    );

    // Should show initials
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders initials from email when no display name provided', async () => {
    render(
      <AttendeeAvatar 
        email="sarah.smith@company.com" 
      />
    );

    // Should use email username for initials
    expect(screen.getByText('SA')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <AttendeeAvatar 
        email="test@company.com" 
        size="sm"
      />
    );

    let avatar = screen.getByText('TE').parentElement;
    expect(avatar).toHaveClass('w-6', 'h-6', 'text-xs');

    rerender(
      <AttendeeAvatar 
        email="test@company.com" 
        size="md"
      />
    );

    avatar = screen.getByText('TE').parentElement;
    expect(avatar).toHaveClass('w-8', 'h-8', 'text-sm');

    rerender(
      <AttendeeAvatar 
        email="test@company.com" 
        size="lg"
      />
    );

    avatar = screen.getByText('TE').parentElement;
    expect(avatar).toHaveClass('w-10', 'h-10', 'text-base');
  });

  it('applies custom className', () => {
    render(
      <AttendeeAvatar 
        email="test@company.com" 
        className="custom-class"
      />
    );

    const avatar = screen.getByText('TE').parentElement;
    expect(avatar).toHaveClass('custom-class');
  });

  it('sets correct title attribute', () => {
    render(
      <AttendeeAvatar 
        email="john.doe@company.com" 
        displayName="John Doe" 
      />
    );

    const avatar = screen.getByText('JD').parentElement;
    expect(avatar).toHaveAttribute('title', 'John Doe');
  });

  it('uses email as title when no display name provided', () => {
    render(
      <AttendeeAvatar 
        email="test@company.com" 
      />
    );

    const avatar = screen.getByText('TE').parentElement;
    expect(avatar).toHaveAttribute('title', 'test@company.com');
  });

  it('handles single name correctly', () => {
    render(
      <AttendeeAvatar 
        email="test@company.com" 
        displayName="John" 
      />
    );

    // Should show first letter of single name
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('handles names with multiple words', () => {
    render(
      <AttendeeAvatar 
        email="test@company.com" 
        displayName="John Michael Doe" 
      />
    );

    // Should show first two initials
    expect(screen.getByText('JM')).toBeInTheDocument();
  });

  it('defaults to small size when no size provided', () => {
    render(
      <AttendeeAvatar 
        email="test@company.com" 
      />
    );

    const avatar = screen.getByText('TE').parentElement;
    expect(avatar).toHaveClass('w-6', 'h-6', 'text-xs');
  });
});