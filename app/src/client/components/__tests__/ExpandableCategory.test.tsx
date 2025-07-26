import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpandableCategory from '../ExpandableCategory';

const mockCategory = {
  name: '1:1 Meetings',
  totalHours: 8.5,
  percentage: 35,
  eventCount: 12,
  meetings: [
    {
      id: '1',
      title: 'Weekly 1:1 with John',
      startTime: '2025-01-26T10:00:00Z',
      endTime: '2025-01-26T11:00:00Z',
      duration: 1,
      attendeeCount: 2,
      attendees: [
        { email: 'john.doe@company.com', displayName: 'John Doe' },
        { email: 'me@company.com', displayName: 'Me' }
      ],
      googleCalendarLink: 'https://calendar.google.com/calendar/event?eid=abc123',
      organizer: { email: 'me@company.com', displayName: 'Me' }
    },
    {
      id: '2',
      title: 'Career Discussion with Sarah',
      startTime: '2025-01-25T14:00:00Z',
      endTime: '2025-01-25T14:30:00Z',
      duration: 0.5,
      attendeeCount: 2,
      attendees: [
        { email: 'sarah.smith@company.com', displayName: 'Sarah Smith' }
      ],
      googleCalendarLink: 'https://calendar.google.com/calendar/event?eid=def456'
    }
  ]
};

describe('ExpandableCategory', () => {
  it('renders category information correctly', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    expect(screen.getByText('1:1 Meetings')).toBeInTheDocument();
    expect(screen.getByText('8.5h (35%)')).toBeInTheDocument();
    expect(screen.getByText('12 events')).toBeInTheDocument();
  });

  it('starts in collapsed state', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Meetings should not be visible initially
    expect(screen.queryByText('Weekly 1:1 with John')).not.toBeInTheDocument();
    expect(screen.queryByText('Career Discussion with Sarah')).not.toBeInTheDocument();
  });

  it('expands when clicked to show meetings', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Click to expand
    fireEvent.click(screen.getByText('1:1 Meetings'));

    // Meetings should now be visible
    expect(screen.getByText('Weekly 1:1 with John')).toBeInTheDocument();
    expect(screen.getByText('Career Discussion with Sarah')).toBeInTheDocument();
  });

  it('collapses when clicked again', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Click to expand
    fireEvent.click(screen.getByText('1:1 Meetings'));
    expect(screen.getByText('Weekly 1:1 with John')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText('1:1 Meetings'));
    expect(screen.queryByText('Weekly 1:1 with John')).not.toBeInTheDocument();
  });

  it('displays meeting details when expanded', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Expand the category
    fireEvent.click(screen.getByText('1:1 Meetings'));

    // Check meeting details
    expect(screen.getByText('Weekly 1:1 with John')).toBeInTheDocument();
    expect(screen.getByText('Career Discussion with Sarah')).toBeInTheDocument();
    
    // Check duration formatting
    expect(screen.getByText('1.0h')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
    
    // Check attendee counts
    expect(screen.getByText('2 attendees:')).toBeInTheDocument();
    expect(screen.getByText('1 attendee:')).toBeInTheDocument();
    
    // Check organizer info
    expect(screen.getByText('Organized by Me')).toBeInTheDocument();
  });

  it('renders Google Calendar links', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Expand the category
    fireEvent.click(screen.getByText('1:1 Meetings'));

    // Check for calendar links
    const links = screen.getAllByText('Open');
    expect(links).toHaveLength(2);
    
    expect(links[0].closest('a')).toHaveAttribute(
      'href', 
      'https://calendar.google.com/calendar/event?eid=abc123'
    );
    expect(links[1].closest('a')).toHaveAttribute(
      'href', 
      'https://calendar.google.com/calendar/event?eid=def456'
    );
  });

  it('handles empty meetings list', () => {
    const emptyCategory = {
      ...mockCategory,
      meetings: [],
      eventCount: 0
    };

    render(
      <ExpandableCategory 
        category={emptyCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Expand the category
    fireEvent.click(screen.getByText('1:1 Meetings'));

    // Should show empty state
    expect(screen.getByText('No meetings in this category')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Expand the category
    fireEvent.click(screen.getByText('1:1 Meetings'));

    // Check that times are formatted (exact format may vary based on locale)
    // We'll just check that some time-like strings are present
    expect(screen.getAllByText(/Jan \d+, \d+:\d+ [AP]M/)).toHaveLength(2);
  });

  it('opens Google Calendar links in new tab', () => {
    render(
      <ExpandableCategory 
        category={mockCategory} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Expand the category
    fireEvent.click(screen.getByText('1:1 Meetings'));

    // Check link attributes
    const links = screen.getAllByText('Open');
    links.forEach(link => {
      const anchor = link.closest('a');
      expect(anchor).toHaveAttribute('target', '_blank');
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('shows correct attendee limit and overflow', () => {
    const categoryWithManyAttendees = {
      ...mockCategory,
      meetings: [{
        ...mockCategory.meetings[0],
        attendees: [
          { email: 'person1@company.com', displayName: 'Person 1' },
          { email: 'person2@company.com', displayName: 'Person 2' },
          { email: 'person3@company.com', displayName: 'Person 3' },
          { email: 'person4@company.com', displayName: 'Person 4' },
          { email: 'person5@company.com', displayName: 'Person 5' },
          { email: 'person6@company.com', displayName: 'Person 6' },
          { email: 'person7@company.com', displayName: 'Person 7' },
        ],
        attendeeCount: 7
      }]
    };

    render(
      <ExpandableCategory 
        category={categoryWithManyAttendees} 
        color="#FF5B04" 
        index={0} 
      />
    );

    // Expand the category
    fireEvent.click(screen.getByText('1:1 Meetings'));

    // Should show +2 for the 2 extra attendees beyond the 5-person limit
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('7 attendees:')).toBeInTheDocument();
  });
});