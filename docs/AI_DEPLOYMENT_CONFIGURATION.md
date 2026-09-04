# AI deployment configuration

The production AI API reads its runtime configuration from Vercel environment variables. This repository also includes a GitHub Actions workflow that can synchronize those values to Vercel and trigger a production deployment.

## GitHub Actions configuration

Configure the following under **GitHub → Repository Settings → Secrets and variables → Actions**.

### Secrets

- `LLM_API_KEY` — the provider API key. Never commit this value.
- `VERCEL_TOKEN` — a Vercel access token with permission to manage the project environment and deploy.
- `VERCEL_ORG_ID` — the Vercel team or account identifier for the project.
- `VERCEL_PROJECT_ID` — the Vercel project identifier.

### Variables

- `LLM_PROVIDER` — any provider identifier, for example `gemini`.
- `LLM_MODEL` — any model identifier supported by the configured provider.
- `LLM_ENDPOINT` — the provider API endpoint.

## Synchronizing configuration

Run the **Sync AI configuration to Vercel** workflow from the Actions tab. The workflow validates the required values, writes the configuration to the Vercel Production environment, deploys the frontend, and checks `/api/v1/ai/config`.

## Provider behavior

The server-side AI API does not use a fixed model dropdown. It accepts arbitrary provider, model, and endpoint values from the deployment configuration.

Gemini-compatible configurations are detected when either:

- `LLM_PROVIDER` is `gemini` or `google`; or
- `LLM_ENDPOINT` targets `generativelanguage.googleapis.com`.

Other providers currently use an OpenAI-compatible chat-completions request format. Provider-specific APIs that use a different protocol should be added as server-side adapters rather than exposing API keys to the browser.

## Security

`LLM_API_KEY` must remain server-side. The public configuration endpoint intentionally returns only provider, model, endpoint, and configuration status. It never returns the API key.
