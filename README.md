# TimeSherpa 📊🗓️

> AI-powered Google Calendar analysis tool for leaders and executives to gain insights into their time management.

![TimeSherpa Dashboard](https://img.shields.io/badge/status-beta-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)
![React](https://img.shields.io/badge/React-18.2+-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

TimeSherpa empowers executives and leaders to understand and optimize their time allocation by providing actionable insights based on their Google Calendar data. Using Google's Gemini AI, it analyzes past calendar events to categorize time spent and provides proactive suggestions for schedule optimization.

### Key Features

- **🔐 Google OAuth Integration** - Secure authentication with Google Calendar access
- **📈 AI-Powered Analysis** - Leverages Google Gemini AI to categorize and analyze calendar events
- **📊 Visual Analytics** - Interactive charts showing time distribution across categories
- **💡 Smart Insights** - Personalized recommendations based on calendar patterns
- **🎯 Focus Time Tracking** - Identifies and tracks dedicated focus/deep work time
- **👥 Collaboration Analytics** - Shows top collaborators and meeting patterns
- **📱 Responsive Design** - Works seamlessly across desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Passport.js** for OAuth authentication
- **Google APIs** (Calendar, OAuth2)
- **Google Gemini AI** for intelligent analysis

### Testing & Quality
- **Jest** for unit testing
- **React Testing Library** for component testing
- **ESLint** & **TypeScript** for code quality

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Google Cloud Project** with:
  - Google Calendar API enabled
  - OAuth 2.0 credentials configured
  - Google Gemini API key

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/time-sherpa.git
cd time-sherpa
```

### 2. Quick Setup (Recommended)

```bash
cd app
./scripts/setup.sh
```

Or manually install dependencies:

```bash
cd app
npm install
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
5. Download the credentials as `client_secret.json` and place it in the `/app` directory

### 4. Set Up Environment Variables

Create a `.env` file in the `/app` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
SESSION_SECRET=your-session-secret-key-here

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Client URL (for production)
CLIENT_URL=http://localhost:3000
```

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### 5. Run the Development Servers

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📁 Project Structure

```
time-sherpa/
├── app/                        # Main application directory
│   ├── src/
│   │   ├── client/            # React frontend
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Page components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── App.tsx        # Main app component
│   │   ├── server/            # Express backend
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # Business logic
│   │   │   └── middleware/    # Express middleware
│   │   └── server.ts          # Server entry point
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   └── tsconfig.json          # TypeScript config
└── docs/                      # Documentation
    └── project-guide.md       # Product requirements
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🔧 Development Workflow

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting (recommended)
- TypeScript strict mode

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Commit: `git commit -m "feat: add new feature"`
5. Push: `git push origin feature/your-feature-name`
6. Create a Pull Request

## 🚀 Deployment

### Building for Production

```bash
npm run build
```

This creates:
- Optimized frontend bundle in `/app/dist/client`
- Compiled backend code in `/app/dist`

### Environment Variables for Production

Set these environment variables in your production environment:

- `NODE_ENV=production`
- `PORT=3001`
- `SESSION_SECRET=<secure-random-string>`
- `GEMINI_API_KEY=<your-production-key>`
- `CLIENT_URL=<your-production-url>`

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create your feature branch
3. Follow the code style guidelines
4. Write tests for new features
5. Ensure all tests pass
6. Submit a pull request

### Areas for Contribution

- 📊 Additional visualization types
- 🌍 Internationalization support
- 📱 Mobile app development
- 🔗 Integration with other calendar services
- 🎨 UI/UX improvements
- 📈 Advanced analytics features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Google Calendar API and Gemini AI
- UI inspired by modern productivity tools
- Color scheme: `#FF5B04`, `#075056`, `#233038`, `#FDF6E3`, `#D3DBDD`, `#F4D47C`

## 📞 Support

- Create an issue for bug reports or feature requests
- Check existing issues before creating new ones
- For security vulnerabilities, please email directly

---

Made with ❤️ by the Doug Rathbone