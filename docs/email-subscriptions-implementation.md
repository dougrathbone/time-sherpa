# Email Subscription Feature Implementation

## Overview

The email subscription feature has been successfully implemented for TimeSherpa, allowing users to receive daily or weekly email summaries of their calendar analytics.

## Architecture

### Backend Components

1. **Repository Pattern**
   - `IUserRepository` interface for data abstraction
   - `JsonUserRepository` implementation with encrypted refresh token storage
   - AES-256-GCM encryption for secure token storage

2. **Email Service**
   - `IEmailService` interface for email service abstraction
   - `ConsoleEmailService` for development/testing (logs to console)
   - `NodemailerEmailService` for production (supports SMTP and Gmail)

3. **Scheduled Jobs**
   - `EmailScheduler` class using node-cron
   - Daily emails sent at 8 AM
   - Weekly emails sent on Mondays at 8 AM

4. **API Endpoints**
   - `GET /api/v1/subscription` - Get user's subscription preferences
   - `PUT /api/v1/subscription` - Update subscription preferences

### Frontend Components

1. **Settings Page** (`/settings`)
   - Toggle subscription on/off
   - Choose frequency (daily/weekly)
   - Save preferences

2. **Subscription Prompt**
   - Displayed on dashboard after initial analysis
   - Can be dismissed (remembered via localStorage)
   - Links to settings page

3. **Dashboard Updates**
   - Added Settings link in header
   - Integrated subscription prompt

## Email Templates

### Daily Summary
- Previous day's time allocation
- Key metrics: Meeting time, Focus time, 1:1 meetings
- Personalized insights and suggestions
- Link to full dashboard

### Weekly Summary
- Past week's time allocation
- Time breakdown by category
- Top collaborators
- Key insights and recommendations
- Link to full dashboard

## Configuration

### Environment Variables

```env
# Email Service Configuration
EMAIL_SERVICE=console  # Options: console, smtp, gmail
EMAIL_FROM=noreply@timesherpa.app

# SMTP Configuration (if EMAIL_SERVICE=smtp)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Gmail Configuration (if EMAIL_SERVICE=gmail)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# Encryption Key for storing refresh tokens
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

## Security

- Refresh tokens are encrypted using AES-256-GCM before storage
- Encryption key should be stored securely in environment variables
- OAuth flow requests offline access for refresh tokens

## Testing

- Unit tests created for:
  - JsonUserRepository
  - Email services
- Integration testing can be done by:
  1. Setting `EMAIL_SERVICE=console`
  2. Subscribing via the UI
  3. Checking console logs for email output

## Usage Flow

1. User logs in with Google OAuth
2. Refresh token is encrypted and stored
3. User sees subscription prompt on dashboard
4. User clicks "Subscribe Now" or navigates to Settings
5. User enables subscription and selects frequency
6. Scheduled jobs send emails based on preferences
7. Emails include calendar analysis and link back to dashboard

## Future Enhancements

- Email open tracking
- More sophisticated email analytics
- Custom email scheduling times
- Email template customization
- Multiple email notification types 