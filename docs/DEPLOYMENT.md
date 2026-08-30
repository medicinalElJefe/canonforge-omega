# Permanent deployment

OMEGA Genesis is fully implemented and verified in source. The permanent Cloudflare deployment workflow is intentionally credential-gated.

## Required GitHub Actions repository secrets

Add these two repository Actions secrets before running **OMEGA Genesis Cloudflare deploy**:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token allowed to deploy Workers/Durable Objects/static assets for the intended account.
- `CLOUDFLARE_ACCOUNT_ID` — the target Cloudflare account ID.

The workflow will otherwise finish successfully with `BLOCKED_CREDENTIALS` after completing the Python tests, release verification, dependency install and Worker syntax check. This distinguishes an external credential boundary from an application failure.

## Hosted write authority

Cloud reads are designed to be public, but canonical cloud writes are locked unless the Worker secret `OMEGA_WRITE_TOKEN` is configured. Do not store that token in source control.

The current workflow does not automatically set `OMEGA_WRITE_TOKEN`, because no safe repository secret with that value is available through the connected tooling. It may be configured directly with Wrangler after the permanent Worker exists:

```bash
cd cloudflare/omega-genesis-worker
npx wrangler secret put OMEGA_WRITE_TOKEN
```

The web cockpit requests this token only when a canonical transition is attempted outside localhost and stores it in browser `sessionStorage`, not persistent storage.

## Security boundary

The public repository and Worker do not embed the private Google Drive corpus. They contain only safe corpus names, hashes, counts, schemas and authority contracts. Full corpus indexing occurs on an approved local project/Drive subtree.

## Expected permanent service

The Worker project name is `omega-genesis-v1`. Its public hostname must be taken from the successful Wrangler deployment output rather than guessed. The deployment must not be called live until that exact URL and the `/_omega/health` endpoint have been verified.
