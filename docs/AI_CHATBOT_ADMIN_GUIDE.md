# AI Component Generator - Administrator Guide

This guide covers the setup, configuration, and management of the AI Component Generator feature for RenderX administrators.

## 🔧 Prerequisites

### Required Services
- **OpenAI API Account**: Active account with API access
- **RenderX Host SDK**: Version 1.0.5+ with config service support
- **Environment Variables**: Ability to set environment variables in your deployment

### Supported Models
- **GPT-4 Turbo** (Recommended): Best quality, higher cost (~$0.02-0.05 per component)
- **GPT-3.5 Turbo** (Default): Good quality, lower cost (~$0.002-0.005 per component)
- **GPT-4**: High quality, moderate cost

## 🚀 Setup Instructions

### 1. Get OpenAI API Key

1. **Create OpenAI Account**
   - Visit [OpenAI Platform](https://platform.openai.com)
   - Sign up or log in to your account

2. **Generate API Key**
   - Go to [API Keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
   - **Important**: Store securely, you won't see it again

3. **Set Usage Limits** (Recommended)
   - Go to [Usage Limits](https://platform.openai.com/account/limits)
   - Set monthly spending limits
   - Configure usage alerts

### 2. Configure Environment Variables

#### Production Deployment
Set these environment variables in your deployment configuration:

```bash
# Required: OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional: Model selection (defaults to gpt-4-turbo-preview)
OPENAI_MODEL=gpt-3.5-turbo

# Optional: Custom API endpoint (for Azure OpenAI, etc.)
OPENAI_API_ENDPOINT=https://api.openai.com/v1
```

#### Local Development
Create a `.env.local` file in your project root:

```bash
# .env.local
OPENAI_API_KEY=sk-your-development-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

#### Docker Deployment
Add to your `docker-compose.yml`:

```yaml
services:
  renderx-app:
    environment:
      - OPENAI_API_KEY=sk-your-api-key-here
      - OPENAI_MODEL=gpt-3.5-turbo
```

#### Kubernetes Deployment
Create a secret and reference it:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: openai-config
type: Opaque
stringData:
  OPENAI_API_KEY: sk-your-api-key-here
  OPENAI_MODEL: gpt-3.5-turbo
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: renderx-app
        envFrom:
        - secretRef:
            name: openai-config
```

### 3. Verify Configuration

1. **Restart Application**: After setting environment variables
2. **Check Feature Detection**: AI button should appear in Component Library
3. **Test Generation**: Try generating a simple component
4. **Monitor Logs**: Check for any configuration errors

## 🔒 Security Best Practices

### API Key Management
- **Never commit API keys** to version control
- **Use environment variables** for all deployments
- **Rotate keys regularly** (quarterly recommended)
- **Use separate keys** for development and production
- **Monitor usage** for unexpected spikes

### Access Control
- **Limit API key permissions** in OpenAI dashboard
- **Set spending limits** to prevent overuse
- **Monitor usage patterns** for abuse
- **Consider rate limiting** at application level

### Network Security
- **Use HTTPS** for all API communications
- **Whitelist IP addresses** if possible in OpenAI dashboard
- **Monitor network traffic** for anomalies

## 💰 Cost Management

### Understanding Costs
- **Token-based pricing**: Charged per input/output token
- **Model differences**: GPT-4 costs ~10x more than GPT-3.5
- **Typical usage**: 500-2000 tokens per component generation

### Cost Optimization
1. **Use GPT-3.5 Turbo** for most use cases
2. **Set spending limits** in OpenAI dashboard
3. **Monitor usage** regularly
4. **Educate users** on efficient prompting
5. **Consider caching** for common requests

### Budget Planning
- **Small team (5-10 users)**: $10-50/month
- **Medium team (20-50 users)**: $50-200/month
- **Large team (100+ users)**: $200-1000/month

*Estimates based on moderate usage (10-20 components per user per month)*

## 📊 Monitoring and Analytics

### Usage Tracking
Monitor these metrics in OpenAI dashboard:
- **Total requests**: Number of API calls
- **Token usage**: Input/output tokens consumed
- **Cost breakdown**: Daily/monthly spending
- **Error rates**: Failed requests

### Application Logs
Watch for these log entries:
- Configuration status on startup
- API key validation results
- Generation success/failure rates
- User error patterns

### Health Checks
Implement monitoring for:
- API key validity
- Service availability
- Response times
- Error rates

## 🛠️ Troubleshooting

### Common Issues

#### "AI features require configuration"
**Symptoms**: No AI button visible, configuration error in chat
**Causes**: 
- Missing `OPENAI_API_KEY` environment variable
- Invalid API key format
- Application not restarted after configuration

**Solutions**:
1. Verify environment variable is set correctly
2. Check API key format (should start with `sk-`)
3. Restart application
4. Check application logs for errors

#### "OpenAI API error: Invalid API key"
**Symptoms**: Error during component generation
**Causes**:
- Expired or revoked API key
- Incorrect key format
- Insufficient API key permissions

**Solutions**:
1. Generate new API key in OpenAI dashboard
2. Update environment variable
3. Restart application

#### "Rate limit exceeded"
**Symptoms**: Temporary failures during peak usage
**Causes**:
- Too many requests in short time
- Exceeded OpenAI rate limits
- Insufficient API quota

**Solutions**:
1. Wait and retry
2. Upgrade OpenAI plan
3. Implement request queuing
4. Educate users about rate limits

#### High API costs
**Symptoms**: Unexpected billing charges
**Causes**:
- Using expensive models (GPT-4)
- High usage volume
- Inefficient prompts

**Solutions**:
1. Switch to GPT-3.5 Turbo
2. Set spending limits
3. Monitor usage patterns
4. Optimize system prompts

### Diagnostic Commands

Check configuration status:
```bash
# Verify environment variables
echo $OPENAI_API_KEY | head -c 10  # Should show "sk-" prefix
echo $OPENAI_MODEL                 # Should show model name

# Test API connectivity (requires curl and jq)
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.openai.com/v1/models | jq '.data[0].id'
```

## 🔄 Maintenance

### Regular Tasks
- **Monthly**: Review usage and costs
- **Quarterly**: Rotate API keys
- **As needed**: Update model configurations
- **Monitor**: Error rates and user feedback

### Updates and Upgrades
- **Monitor OpenAI announcements** for new models
- **Test new models** in development environment
- **Update documentation** when changing configurations
- **Communicate changes** to users

### Backup and Recovery
- **Document configuration**: Keep secure record of settings
- **Test recovery procedures**: Ensure quick restoration
- **Monitor service health**: Set up alerts for outages

## 📋 Configuration Reference

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | None | OpenAI API key (sk-...) |
| `OPENAI_MODEL` | No | `gpt-4-turbo-preview` | Model to use for generation |
| `OPENAI_API_ENDPOINT` | No | `https://api.openai.com/v1` | API endpoint URL |

### Supported Models
| Model | Cost (Input/Output) | Quality | Speed | Recommended For |
|-------|-------------------|---------|-------|-----------------|
| `gpt-3.5-turbo` | $0.50/$1.50 per 1M tokens | Good | Fast | General use, cost-sensitive |
| `gpt-4-turbo-preview` | $10/$30 per 1M tokens | Excellent | Medium | High-quality components |
| `gpt-4` | $30/$60 per 1M tokens | Excellent | Slow | Premium use cases |

### Feature Flags
The AI features automatically enable/disable based on configuration:
- **Enabled**: When `OPENAI_API_KEY` is set and valid
- **Disabled**: When key is missing, invalid, or API is unreachable

## 📞 Support

### Getting Help
1. **Check logs** for specific error messages
2. **Review OpenAI status** at [status.openai.com](https://status.openai.com)
3. **Consult documentation** for configuration details
4. **Contact support** with specific error details

### Reporting Issues
Include this information when reporting problems:
- Environment (production, staging, development)
- Error messages from logs
- Steps to reproduce
- Expected vs actual behavior
- Configuration details (without API keys)

---

**Security Note**: Never share API keys in support requests or documentation. Use placeholder values like `sk-your-key-here` in examples.
