# Google authentication helper

This directory is a static, independently deployable top-level Google sign-in
helper for The Dangling Conversation. It uses the official Google Identity
Services rendered button and returns the resulting Google ID token directly to
the specific opener window with `postMessage`. It does not store credentials
and does not require a backend or client secret.

## Production configuration

The popup helper is permanently hosted at
`https://benlen110.github.io/google-auth-helper/`. The Unity WebGL template
allows its exact origin, `https://benlen110.github.io`, and the helper allows
the itch iframe origin, `https://html-classic.itch.zone`.

Validation intentionally compares origins only. It does not depend on an itch
`/html/<build-id>/` path, `index.html`, or query string, so future itch uploads
do not require Google popup configuration changes while the iframe remains on
`https://html-classic.itch.zone`.

1. Keep `clientId` set to the public Google OAuth Web Application client ID.
2. Add only the stable helper origin (scheme plus hostname and optional port,
   with no path) to the Google Cloud OAuth client's Authorized JavaScript
   Origins.
3. Configure that same Web Application client ID for the Google provider in
   Unity Authentication's `production` environment.

No Google redirect URI is required by this GIS rendered-button callback flow.
Do not add a client secret to this directory or the Unity project.

## Required hosting headers

- Serve over HTTPS.
- Do not send `Cross-Origin-Opener-Policy: same-origin`; it severs
  `window.opener` for this cross-origin popup. Prefer no COOP header or
  `Cross-Origin-Opener-Policy: unsafe-none` until the deployed behavior is
  verified.
- Do not enable COEP for this helper.
- Preserve the CSP in `index.html`, or provide an equivalent response header
  that permits the GIS script, frame, connection, style, and image origins.
- Do not set an iframe policy; the helper is intended to run top-level.

If the deployed host or browser removes `window.opener`, stop and investigate
the response/browser isolation policy. Do not replace this with insecure token
polling.
