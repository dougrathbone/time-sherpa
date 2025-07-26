# TimeSherpa - Azure Deployment

## Quick Start for Azure Deployment

### 1. Prerequisites
- Azure account with active subscription
- GitHub repository with the TimeSherpa code
- Azure CLI installed locally (optional, for manual setup)

### 2. Automated Deployment via GitHub Actions

The easiest way to deploy is using the included GitHub Actions workflow:

1. **Fork/Clone this repository** to your GitHub account

2. **Create Azure Web App** (via Azure Portal or CLI):
   - Resource Group: `TimeSherpa-RG`
   - App Name: `time-sherpa-app` (or your preferred name)
   - Runtime: `Node 18 LTS`
   - Operating System: `Linux`

3. **Configure GitHub Secrets**:
   - Go to your repository Settings > Secrets and variables > Actions
   - Add `AZUREAPPSERVICE_PUBLISHPROFILE`:
     - In Azure Portal, go to your Web App
     - Click "Get publish profile" 
     - Copy the entire XML content as the secret value

4. **Set Environment Variables** in Azure Portal:
   - Go to your Web App > Configuration > Application settings
   - Add required environment variables (see AZURE_DEPLOYMENT.md)

5. **Deploy**: Push to master branch or manually trigger the GitHub Action

### 3. Required Environment Variables

Set these in Azure Portal > Web App > Configuration:

```
NODE_ENV=production
PORT=8080
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret
GEMINI_API_KEY=your-gemini-api-key
ENCRYPTION_KEY=your-32-character-encryption-key
GMAIL_USER=your-gmail-address
GMAIL_APP_PASSWORD=your-gmail-app-password
```

### 4. OAuth Configuration

Update your Google Cloud Console OAuth settings:
- Add your Azure domain to authorized domains
- Update redirect URIs to include: `https://your-app-name.azurewebsites.net/api/auth/google/callback`

### 5. Files Included for Azure Deployment

- `.github/workflows/azure-deploy.yml` - GitHub Actions workflow
- `azure-pipelines.yml` - Azure DevOps pipeline (alternative)
- `web.config` - IIS configuration for Azure App Service
- `.deployment` - Azure deployment configuration
- `deploy.cmd` - Custom deployment script
- `startup.js` - Application startup script
- `AZURE_DEPLOYMENT.md` - Detailed deployment guide

### 6. Monitoring

After deployment:
- Check Application Logs in Azure Portal
- Monitor Application Insights (if enabled)
- Verify all features work with your domain

### 7. Troubleshooting

Common issues:
- **Build failures**: Check GitHub Actions logs
- **Environment variables**: Verify all required variables are set in Azure
- **OAuth errors**: Ensure redirect URIs are updated in Google Cloud Console
- **Port issues**: Azure automatically assigns port 8080

For detailed deployment instructions, see `AZURE_DEPLOYMENT.md`.

### 8. Cost Optimization

- Start with B1 Basic plan (~$13/month)
- Upgrade to S1 Standard for production workloads
- Enable auto-scaling based on CPU/memory usage
- Consider Azure Cosmos DB for user data in production

---

**Need help?** Check the detailed deployment guide in `AZURE_DEPLOYMENT.md` or create an issue in this repository.