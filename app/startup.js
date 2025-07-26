// Azure App Service startup script
// This file ensures the application starts correctly on Azure

const path = require('path');
const { spawn } = require('child_process');

// Ensure we're in the right directory
process.chdir(__dirname);

// Check if dist directory exists
const fs = require('fs');
if (!fs.existsSync('./dist')) {
  console.error('Build artifacts not found. Please run "npm run build" first.');
  process.exit(1);
}

// Start the application
const server = spawn('node', ['dist/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.kill('SIGINT');
});