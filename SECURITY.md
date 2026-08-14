# Security policy

## Supported version

Security fixes are applied to the current `main` branch and the latest tagged release.

## Reporting a vulnerability

Do not open a public issue containing credentials, customer content, deployment-bypass values, signing material, or reproduction data.

Use a private GitHub security advisory after the repository is created, or contact the repository owner through an approved private channel. Include the affected commit, impact, reproduction steps, and a minimal proof of concept.

## Credential rules

- Keep `PSCB_API_KEY` and `PSCB_SESSION_SECRET` on the server.
- Never commit Vercel, GitHub, ElevenLabs, signing, certificate, or deployment-bypass credentials.
- Treat the documented `pscb_demo_` value as an evaluation credential only.
- Rotate any secret immediately if it is exposed in source, logs, build artifacts, or Git history.

## Capture claims

The browser API and iframe do not guarantee black operating-system screenshots. The application-controlled clear operation and supported native capture-exclusion paths have separate assurance boundaries and must be described accurately.
