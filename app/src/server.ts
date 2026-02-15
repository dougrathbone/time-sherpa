import app from './server/app';

const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

// Start server (used for local dev and traditional deployments like Azure)
app.listen(PORT, () => {
  console.log(`TimeSherpa server running on port ${PORT}`);
  console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
});
