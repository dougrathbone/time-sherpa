# Azure Deployment Guide

This guide covers deploying the TimeSherpa application to Azure App Service using GitHub Actions.

## Prerequisites

1. **Azure Account**: Ensure you have an active Azure subscription
2. **Azure CLI**: Install the Azure CLI for local setup commands
3. **GitHub Repository**: Your code should be in a GitHub repository

## Azure Resources Setup

### 1. Create Azure Web App

```bash
# Login to Azure
az login

# Create a resource group
az group create --name TimeSherpa-RG --location "East US"

# Create an App Service plan
az appservice plan create --name TimeSherpa-Plan --resource-group TimeSherpa-RG --sku B1 --is-linux

# Create the web app
az webapp create --resource-group TimeSherpa-RG --plan TimeSherpa-Plan --name time-sherpa-app --runtime "NODE|18-lts"
```

### 2. Configure App Settings

Set the following environment variables in your Azure Web App:

```bash
# Set Node.js version
az webapp config appsettings set --resource-group TimeSherpa-RG --name time-sherpa-app --settings NODE_ENV=production

# Set application port
az webapp config appsettings set --resource-group TimeSherpa-RG --name time-sherpa-app --settings PORT=8080

# Add your application environment variables
az webapp config appsettings set --resource-group TimeSherpa-RG --name time-sherpa-app --settings \
  GOOGLE_CLIENT_ID="your-google-client-id" \
  GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  SESSION_SECRET="your-session-secret" \
  GEMINI_API_KEY="your-gemini-api-key" \
  ENCRYPTION_KEY="your-32-character-encryption-key" \
  GMAIL_USER="your-gmail-address" \
  GMAIL_APP_PASSWORD="your-gmail-app-password"
```

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository (Settings > Secrets and variables > Actions):

### Required Secrets

1. **AZUREAPPSERVICE_PUBLISHPROFILE**:
   ```bash
   # Get the publish profile
   az webapp deployment list-publishing-profiles --resource-group TimeSherpa-RG --name time-sherpa-app --xml
   ```
   Copy the entire XML output and add it as a secret.

### Optional: Azure Service Principal (Alternative to Publish Profile)

If you prefer using a service principal instead of publish profile:

```bash
# Create service principal
az ad sp create-for-rbac --name "TimeSherpa-GitHub-Actions" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/TimeSherpa-RG --sdk-auth
```

Add these secrets:
- **AZURE_CREDENTIALS**: The JSON output from the service principal creation
- **AZURE_WEBAPP_NAME**: time-sherpa-app
- **AZURE_RESOURCE_GROUP**: TimeSherpa-RG

## Environment Variables Reference

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `8080` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `SESSION_SECRET` | Express session secret | Random 32+ character string |
| `GEMINI_API_KEY` | Google Gemini AI API key | From Google AI Studio |
| `ENCRYPTION_KEY` | Data encryption key | 64-character hex string |
| `GMAIL_USER` | Gmail address for notifications | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail app password | From Gmail security settings |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIRECT_URI` | OAuth redirect URI | Auto-generated from hostname |
| `SESSION_MAX_AGE` | Session timeout (ms) | `86400000` (24 hours) |

## Deployment Process

### Automatic Deployment

The GitHub Actions workflow (`azure-deploy.yml`) automatically:

1. **Tests**: Runs linting, type checking, and unit tests
2. **Builds**: Compiles TypeScript and builds the application
3. **Deploys**: Uploads to Azure Web App Service

### Manual Deployment

To deploy manually:

```bash
# Build the application locally
npm run build

# Deploy using Azure CLI
az webapp deployment source config-zip --resource-group TimeSherpa-RG --name time-sherpa-app --src deployment.zip
```

## Monitoring and Troubleshooting

### View Application Logs

```bash
# Stream logs
az webapp log tail --resource-group TimeSherpa-RG --name time-sherpa-app

# Download logs
az webapp log download --resource-group TimeSherpa-RG --name time-sherpa-app
```

### Common Issues

1. **Build Failures**: Check that all dependencies are in `package.json`, not `devDependencies`
2. **Environment Variables**: Ensure all required environment variables are set in Azure App Settings
3. **OAuth Redirect**: Update Google OAuth settings with your Azure domain
4. **Port Issues**: Azure automatically assigns port 8080, ensure your app listens on `process.env.PORT`

## Security Considerations

1. **Secrets Management**: Never commit secrets to your repository
2. **HTTPS**: Azure Web Apps automatically provide HTTPS
3. **Environment Variables**: Use Azure App Settings for sensitive data
4. **Authentication**: Ensure Google OAuth is properly configured for your domain

## Custom Domain (Optional)

To use a custom domain:

```bash
# Add custom domain
az webapp config hostname add --webapp-name time-sherpa-app --resource-group TimeSherpa-RG --hostname your-domain.com

# Enable HTTPS
az webapp config ssl bind --certificate-thumbprint {thumbprint} --ssl-type SNI --name time-sherpa-app --resource-group TimeSherpa-RG
```

## Scaling and Performance

For production workloads, consider:

1. **App Service Plan**: Upgrade from B1 to S1 or higher for better performance
2. **Application Insights**: Enable for monitoring and diagnostics
3. **CDN**: Use Azure CDN for static assets
4. **Database**: Consider Azure Cosmos DB for user data instead of JSON files

## Cost Management

- **Auto-scaling**: Configure based on CPU/memory usage
- **Staging Slots**: Use for blue-green deployments
- **Resource monitoring**: Set up alerts for cost thresholds