# Environment Variables Setup

This extension requires environment variables to connect to the backend API. To set up these variables, create a `.env.local` file in the root directory of the project.

## Required Variables

```
# API Configuration
VITE_API_URL=https://api.example.com
VITE_BEARER_TOKEN=your_bearer_token_here
```

## Variable Descriptions

- `VITE_API_URL`: The base URL of your backend API
- `VITE_BEARER_TOKEN`: The authentication token used for API requests

## Environment Files

For development:
- `.env.local`: Local environment variables (not committed to Git)

For production:
- The variables should be set in your build environment 