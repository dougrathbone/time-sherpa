# Project Guide & Product Requirements Document (PRD) for TimeSherpa

This document outlines the project and product requirements for **TimeSherpa**, a web application designed to help leaders and executives gain insights into their time management by analyzing their Google Calendar data. This guide is intended for use by Google Gemini and Claude to generate the application.

---

## 1. Project Overview

### 1.1. Product Vision
To empower leaders and executives to understand and optimize their time allocation by providing actionable insights based on their past and upcoming calendar events.

### 1.2. App Name
TimeSherpa

### 1.3. Target Audience
Leaders, executives, and knowledge workers who heavily rely on Google Calendar and are looking to improve their productivity and focus.

### 1.4. Core Features
* **Google Calendar Integration:** Securely connect to a user's Google Calendar using OAuth 2.0.
* **AI-Powered Calendar Analysis:** Utilize Google Gemini to analyze past calendar data to categorize and summarize time spend.
* **Visual Time-Spend Dashboard:** Display a clear and interactive visualization of how time is allocated across different categories.
* **Proactive Schedule Suggestions:** Provide recommendations based on historical trends and anomalies in the upcoming schedule.
* **Email Subscriptions:** Daily or weekly email summaries of time insights delivered directly to users' inboxes.
* **Smart Caching:** 10-minute cache duration for calendar analysis to improve performance and reduce API calls.
* **Opportunities for Improvement:** Dynamic recommendations based on calendar patterns to optimize time management.

---

## 2. Technical Specifications

* Single application that can be run by a single node instance. this means the client app and the server side app should reside under a shared basedpath.

### 2.1. Frontend
* **Language:** TypeScript
* **Framework:** React (or a similar modern framework like Vue.js or Svelte, with a preference for React)
* **Styling:** A fresh and friendly color scheme. Use a modern CSS framework like Tailwind CSS for utility-first styling.
* **State Management:** React Context API for authentication and calendar analysis caching.

### 2.2. Backend & APIs
* **Authentication:** Google OAuth 2.0 for a seamless and secure login experience.
* **AI Integration:** Google Gemini API for natural language processing of calendar event data. The analysis of the past month's calendar should be an asynchronous process that begins after the user logs in.
* **Email Service:** Mock email service for development, with interface ready for production email providers.
* **Scheduling:** Node-cron for scheduled email delivery (daily at 8 AM, weekly on Mondays).
* **Data Storage:** JSON-based user repository for storing user preferences and refresh tokens.
* **Architecture:** The application is **stateless** for calendar data. User preferences and OAuth tokens are stored server-side for email functionality.

### 2.3. Testing
* **Unit Test Coverage:** The codebase should have close to full unit test coverage to ensure reliability and maintainability.
* **GitHub Actions CI/CD:** The codebase should be tested on push and easily extended to deploy via CI/CD.

---

## 3. Functional Requirements

### 3.1. User Authentication & Onboarding
1.  **Landing Page:** A visually appealing landing page that clearly explains the value proposition of TimeSherpa and has a prominent "Sign in with Google" button.
2.  **Google OAuth Flow:**
    * The user clicks "Sign in with Google."
    * A Google OAuth consent screen appears, requesting permission to view their Google Calendar events.
    * The user grants permission.
    * The user is redirected back to the TimeSherpa dashboard or settings page (if new user).
    * This entire flow should be interactive and provide clear feedback to the user (e.g., loading spinners, success messages).

### 3.2. Calendar Data Processing (Asynchronous)
1.  **Data Fetching:** Upon successful login, the application will make an API call to the Google Calendar API to fetch the user's calendar events from the past month.
2.  **Gemini API Analysis:** The fetched event data (titles, descriptions, attendees) will be sent to the Google Gemini API.
3.  **Categorization:** The Gemini API will be prompted to analyze each event and categorize it. Suggested categories include, but are not limited to:
    * 1:1 Meetings
    * Team Meetings
    * External Meetings
    * Focus Time
    * Personal Time
4.  **Data Structuring:** The categorized data should be structured in a way that is easy to visualize (e.g., a JSON object with categories and the total time spent in each).
5.  **Caching:** Analysis results are cached for 10 minutes to reduce API calls and improve performance.

### 3.3. Time-Spend Visualization Dashboard
1.  **Main View:** The dashboard will present a clear and visually appealing summary of the user's time spend over the past month.
2.  **Visualizations:**
    * Use charts (e.g., donut charts, bar charts) to show the percentage of time spent in each category.
    * Display key metrics prominently, such as "Total Meeting Hours" and "Focus Hours."
    * Include a breakdown of time spent with specific people or in recurring meeting series.
3.  **Interactivity:** Allow the user to hover over visual elements to see more details.
4.  **Data Freshness Indicator:** Show when data was last updated with visual indicators (green for fresh, yellow for stale).
5.  **Manual Refresh:** Ability to manually refresh data when needed.

### 3.4. Proactive Schedule Suggestions
1.  **Trend Analysis:** The application will compare the upcoming week's schedule with the past month's trends.
2.  **Anomaly Detection:** Identify significant deviations from the established patterns.
3.  **Actionable Suggestions:** Display concise and helpful suggestions in a dedicated section of the dashboard. Examples:
    * "You're spending 30% more time in 1:1s this week. Consider if all are necessary to achieve your goals."
    * "You have 5 hours of back-to-back meetings on Tuesday. Try to schedule short breaks in between."
    * "Your focus time has decreased by 20% this week. Block out some time for deep work."

### 3.5. Opportunities for Improvement
1.  **Dynamic Recommendations:** Based on calendar analysis, provide specific improvement opportunities:
    * **Focus Time Alert:** When focus time is less than 40% of meeting time.
    * **Meeting Overload:** When total meeting hours exceed 30 per month.
    * **Category Imbalance:** When one category dominates more than 50% of time.
    * **Well-Balanced Recognition:** Positive reinforcement when schedule is healthy.
2.  **Visual Distinction:** Each recommendation type has its own color scheme and icon for quick recognition.

### 3.6. Email Subscriptions
1.  **Subscription Management:** Users can opt-in to receive email summaries through the Settings page.
2.  **Frequency Options:**
    * Daily: Delivered every morning at 8 AM with previous day's summary.
    * Weekly: Delivered Monday mornings with previous week's comprehensive review.
3.  **Email Content:** HTML and text versions with:
    * Time breakdown by category
    * Key insights and trends
    * Personalized recommendations
    * Link to view full dashboard
4.  **Subscription Prompt:** New users see a dismissible prompt on the dashboard encouraging email subscriptions.

---

## 4. User Interface (UI) & User Experience (UX)

### 4.1. Design Philosophy
* **Delightful & Fresh:** The UI should be modern, clean, and intuitive. Avoid clutter and focus on presenting information in a digestible format.
* **Friendly Color Scheme:** Use a palette that is inviting and easy on the eyes. Think of colors that evoke a sense of calm and productivity (e.g., soft blues, greens, and muted tones with a few bright accent colors for calls to action).

Colors: #FF5B04 (Orange), #075056 (Teal), #233038 (Dark), #FDF6E3 (Cream), #D3DBDD (Gray), #F4D47C (Yellow)

### 4.2. User Flow
1.  **New User:** `Landing Page` -> `Click "Sign in with Google"` -> `Google OAuth Consent` -> `Redirect to Settings` -> `Configure email preferences` -> `Redirect to Dashboard` -> `View analysis and suggestions`.
2.  **Returning User:** `Landing Page` -> `Click "Sign in with Google"` -> `Redirect to Dashboard` -> `View cached or updated analysis`.

---

## 5. API Documentation

### 5.1. Authentication Endpoints

#### `GET /api/auth/google`
Initiates Google OAuth flow.
- **Response:** Redirects to Google OAuth consent screen

#### `GET /api/auth/google/callback`
Handles OAuth callback from Google.
- **Query Parameters:** Code from Google OAuth
- **Response:** Redirects to dashboard or settings page

#### `GET /api/auth/user`
Returns current authenticated user.
- **Response:** 
  ```json
  {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "picture": "string"
    }
  }
  ```

#### `POST /api/auth/logout`
Logs out the current user.
- **Response:** `{ "message": "Logged out successfully" }`

### 5.2. Calendar Analysis Endpoints

#### `GET /api/calendar/analysis`
Fetches and analyzes past month's calendar data.
- **Response:**
  ```json
  {
    "categories": [
      {
        "name": "string",
        "totalHours": "number",
        "percentage": "number",
        "eventCount": "number"
      }
    ],
    "totalMeetingHours": "number",
    "focusHours": "number",
    "suggestions": ["string"],
    "topCollaborators": [
      {
        "name": "string",
        "meetingCount": "number",
        "totalHours": "number"
      }
    ],
    "lastUpdated": "string"
  }
  ```

### 5.3. Subscription Endpoints

#### `GET /api/v1/subscription`
Gets user's email subscription preferences.
- **Response:**
  ```json
  {
    "isSubscribed": "boolean",
    "frequency": "daily | weekly | null"
  }
  ```

#### `PUT /api/v1/subscription`
Updates user's email subscription preferences.
- **Request Body:**
  ```json
  {
    "isSubscribed": "boolean",
    "frequency": "daily | weekly | null"
  }
  ```
- **Response:** Updated preferences

---

## 6. Non-Functional Requirements

* **Performance:** The application should be fast and responsive. The asynchronous loading of calendar data is crucial to prevent a slow initial load time.
* **Security:** Adhere to best practices for securing user data, especially when handling Google API tokens. No sensitive user data should be stored persistently.
* **Scalability:** The stateless architecture will allow the application to scale horizontally with ease.
* **Browser Compatibility:** The website should be fully functional on the latest versions of major web browsers (Chrome, Firefox, Safari, Edge).
* **Reliability:** Scheduled email jobs should run reliably with proper error handling and logging.

This document provides a comprehensive guide for Claude and Gemini to create the TimeSherpa web application. The focus should be on delivering a high-quality, user-friendly experience that fulfills the core promise of helping users understand and optimize their time.