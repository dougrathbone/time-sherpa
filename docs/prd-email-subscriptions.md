# PRD: Subscription Email Feature for TimeSherpa

This document outlines the product and project requirements for a new **Subscription Email** feature for the TimeSherpa application. It is intended for use by a development team to implement the functionality.

## 1. Feature Overview

To enhance user engagement and provide continuous value, this feature introduces an optional email subscription service. Users who opt-in will receive a periodic summary of their time analysis, highlighting key insights and changes. The goal is to proactively deliver value, encouraging users to return to the TimeSherpa dashboard for a more detailed review and to maintain a consistent focus on their time management goals.

### 1.1. Core Objectives
* **Increase User Retention:** Proactively deliver value to users, keeping TimeSherpa top-of-mind.
* **Drive Engagement:** Use email summaries as a hook to bring users back to the interactive web dashboard.
* **Enhance User Value:** Provide actionable insights directly to the user's inbox, requiring minimal effort on their part.

---

## 2. Architectural Evolution

This feature introduces a shift from the original purely **stateless architecture**. To manage subscriptions and user preferences, a persistent storage mechanism is required. This will be implemented using a **Repository Pattern** to ensure that the storage solution is decoupled and can be easily evolved in the future (e.g., moving from local JSON to a database).

* **User Data Storage:** We will now store the user's unique Google ID, their email address, and their subscription preferences.
* **API Token Storage:** To fetch calendar data for offline processing (i.e., sending scheduled emails), the system will need to securely store and manage Google API refresh tokens for subscribed users.

---

## 3. Functional Requirements

### 3.1. User Subscription & Configuration

1.  **Opt-In Mechanism:**
    * On the main dashboard, after a user has reviewed their initial report, a new UI element will prompt them to subscribe to email summaries.
    * The prompt will be non-intrusive, for example: "Want these insights in your inbox? Subscribe to your personalized summary."
    * The UI will present clear options for subscription frequency.

2.  **Subscription Frequency:**
    * Users must be able to choose their preferred email delivery frequency.
    * The available options are:
        * **Weekly Summary:** Sent once a week (e.g., Monday morning).
        * **Daily Summary:** Sent once a day (e.g., every morning).

3.  **Subscription Management Page:**
    * A dedicated "Settings" or "Preferences" area will be accessible to logged-in users.
    * In this area, users can:
        * View their current subscription status (subscribed or not).
        * Change their subscription frequency (Daily, Weekly).
        * Unsubscribe from all emails.

### 3.2. Email Content & Templating

1.  **Templated Emails:**
    * Emails must be generated from a template engine (e.g., Handlebars, EJS) to allow for easy modification of content and branding in the future.

2.  **Email Content Structure:**
    * **Subject Line:** Engaging and informative. Examples: "Your TimeSherpa Weekly Insights" or "Your Daily TimeSherpa Summary".
    * **Brief Summary:** A high-level overview of the user's time allocation for the past period (day/week).
        * Example: "Hi [User Name], here's a look at your past week. You spent 18 hours in meetings and had 10 hours of Focus Time."
    * **Key Changes & Insights:** A small, curated list of the most important changes or anomalies detected. This should mirror the "Proactive Schedule Suggestions" from the dashboard.
        * Example: "Heads up: Your 1:1 meeting time is up 25% compared to last week."
        * Example: "You have 4 hours of back-to-back meetings tomorrow. Plan for breaks."
    * **Call-to-Action (CTA):** A prominent button or link that directs the user back to the TimeSherpa application to see their full report.
        * Example Button Text: "View Full Report" or "Explore My Dashboard".

### 3.3. Background Processing

1.  **Scheduled Job:** A scheduler (e.g., node-cron) will run to trigger the email sending process.
    * A daily job will run for users subscribed to the daily summary.
    * A weekly job will run for users subscribed to the weekly summary.

2.  **Data Analysis Process:**
    * The job will fetch the list of users subscribed to the current frequency.
    * For each user, the system will:
        1.  Use the stored refresh token to get a new access token for the Google Calendar API.
        2.  Fetch calendar events for the relevant period (past day or past week).
        3.  Send the data to the Gemini API for analysis and categorization.
        4.  (Optional - v2) Compare the new analysis with a stored summary from the previous period to identify trends.
        5.  Generate the email content based on the analysis.
        6.  Send the email using the Email Service.

---

## 4. Technical Requirements

### 4.1. User & Subscription Storage (Repository Pattern)

A repository pattern will be used to abstract the data storage mechanism.

**Interface: `IUserRepository`**
```typescript
interface SubscriptionPreferences {
  isSubscribed: boolean;
  frequency: 'daily' | 'weekly' | null;
}

interface User {
  googleId: string;
  email: string;
  refreshToken: string; // Encrypted
  preferences: SubscriptionPreferences;
}

interface IUserRepository {
  /**
   * Finds a user by their Google ID.
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Creates or updates a user's record.
   */
  save(user: User): Promise<void>;

  /**
   * Retrieves all users with an active subscription for a given frequency.
   */
  findSubscribedUsersByFrequency(frequency: 'daily' | 'weekly'): Promise<User[]>;
}
```

**Initial Implementation: `JsonUserRepository`**
* This class will implement the `IUserRepository` interface.
* It will store user data in a JSON file located at `/data/users.json`.
* The file will be read on application startup and written to on any change.
* **Security:** The `refreshToken` must be encrypted at rest within the JSON file.

### 4.2. Email Service Abstraction

An interface-based service class will be used to handle all email-sending operations.

**Interface: `IEmailService`**
```typescript
interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
}

interface IEmailService {
  /**
   * Sends an email.
   */
  sendEmail(options: EmailOptions): Promise<void>;
}
```

**Initial Implementation:**
* A concrete class (e.g., `NodemailerEmailService` or `ConsoleEmailService` for testing) will implement the `IEmailService` interface.
* This decouples the application from a specific email provider (e.g., SendGrid, Mailgun), allowing for easy substitution.

### 4.3. API Endpoints

The following RESTful API endpoints should be created on the server:

* **`GET /api/v1/subscription`**
    * **Description:** Gets the current user's subscription preferences.
    * **Response:** `200 OK` with `{ isSubscribed: boolean, frequency: 'daily' | 'weekly' | null }`

* **`PUT /api/v1/subscription`**
    * **Description:** Creates or updates the user's subscription preferences.
    * **Request Body:** `{ isSubscribed: boolean, frequency: 'daily' | 'weekly' }`
    * **Response:** `200 OK`

---

## 5. User Flow

1.  **New Subscription Flow:**
    * `User logs in` -> `Views Dashboard` -> `Sees 'Subscribe' UI element` -> `User clicks 'Subscribe'` -> `Modal/UI appears to select frequency (Weekly/Daily)` -> `User selects 'Weekly' and confirms` -> `Frontend calls PUT /api/v1/subscription` -> `Backend stores preference` -> `UI shows success message`.

2.  **Subscription Management Flow:**
    * `User logs in` -> `Mapss to Settings page` -> `Sees current subscription status ('Weekly')` -> `User changes frequency to 'Daily'` -> `Frontend calls PUT /api/v1/subscription` -> `Backend updates preference` -> `UI confirms change`.

3.  **Unsubscribe Flow:**
    * `User navigates to Settings page` -> `Clicks 'Unsubscribe' button` -> `Confirmation prompt appears` -> `User confirms` -> `Frontend calls PUT /api/v1/subscription with { isSubscribed: false }` -> `Backend updates preference` -> `UI confirms user is unsubscribed`.

---

## 6. Out of Scope for this Iteration

* **A/B Testing of Email Content:** All users will receive the same email template.
* **Advanced Analytics on Email Engagement:** We will not track email open rates or click-through rates initially.
* **Alternative Storage Providers:** The only storage implementation will be the local JSON file. Database integrations (e.g., PostgreSQL, MongoDB) are deferred.
* **Admin Dashboard:** There will be no internal dashboard for managing all subscribed users.