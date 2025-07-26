import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionableInsightModal from '../ActionableInsightModal';
import { ActionableSuggestion } from '../../../shared/types';

const mockSuggestion: ActionableSuggestion = {
  id: 'test-suggestion',
  text: 'Consider blocking 2-3 hours of focus time daily to enhance deep work productivity.',
  type: 'focus_time',
  actionable: true,
  actionLabel: 'Schedule Focus Time',
  suggestedTimeSlots: [
    {
      startTime: '09:00',
      endTime: '11:00',
      date: '2024-01-15',
      reasoning: 'Morning focus time when you\'re most productive'
    },
    {
      startTime: '14:00',
      endTime: '16:00', 
      date: '2024-01-16',
      reasoning: 'Afternoon deep work session'
    }
  ]
};

const mockOnClose = jest.fn();
const mockOnSchedule = jest.fn();

describe('ActionableInsightModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open with suggestion', () => {
    render(
      <ActionableInsightModal
        suggestion={mockSuggestion}
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    expect(screen.getByText('Take Action on This Insight')).toBeInTheDocument();
    expect(screen.getByText('Consider blocking 2-3 hours of focus time daily to enhance deep work productivity.')).toBeInTheDocument();
    expect(screen.getByText('Suggested Time Slots')).toBeInTheDocument();
  });

  it('shows time slots with proper formatting', () => {
    render(
      <ActionableInsightModal
        suggestion={mockSuggestion}
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    expect(screen.getByText('Monday, Jan 15')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM - 11:00 AM')).toBeInTheDocument();
    expect(screen.getByText('Morning focus time when you\'re most productive')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ActionableInsightModal
        suggestion={mockSuggestion}
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting a time slot', () => {
    render(
      <ActionableInsightModal
        suggestion={mockSuggestion}
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    const firstTimeSlot = screen.getAllByRole('radio')[0];
    fireEvent.click(firstTimeSlot);

    expect(firstTimeSlot).toBeChecked();
  });

  it('calls onSchedule when schedule button is clicked with selected slot', async () => {
    mockOnSchedule.mockResolvedValue(undefined);

    render(
      <ActionableInsightModal
        suggestion={mockSuggestion}
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    // Select first time slot
    const firstTimeSlot = screen.getAllByRole('radio')[0];
    fireEvent.click(firstTimeSlot);

    // Click schedule button
    const scheduleButton = screen.getByRole('button', { name: /schedule focus time/i });
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(mockOnSchedule).toHaveBeenCalledWith(
        mockSuggestion,
        mockSuggestion.suggestedTimeSlots![0]
      );
    });
  });

  it('does not render when not open', () => {
    render(
      <ActionableInsightModal
        suggestion={mockSuggestion}
        isOpen={false}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    expect(screen.queryByText('Take Action on This Insight')).not.toBeInTheDocument();
  });

  it('does not render when suggestion is null', () => {
    render(
      <ActionableInsightModal
        suggestion={null}
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    expect(screen.queryByText('Take Action on This Insight')).not.toBeInTheDocument();
  });

  it('disables schedule button when no time slot is selected', () => {
    render(
      <ActionableInsightModal
        suggestion={mockSuggestion}
        isOpen={true}
        onClose={mockOnClose}
        onSchedule={mockOnSchedule}
      />
    );

    const scheduleButton = screen.getByRole('button', { name: /schedule focus time/i });
    expect(scheduleButton).toBeDisabled();
  });
});