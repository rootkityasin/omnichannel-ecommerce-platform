# Dokploy Prebuilt Image Deployment

GitHub Actions builds the Docker image and pushes it to GitHub Container Registry (GHCR). Dokploy should deploy this image directly instead of building from the repository on the server.

## Image

Use one of these image references in Dokploy:

```txt
ghcr.io/rootkityasin/omnichannel-ecommerce-platform:latest
ghcr.io/rootkityasin/omnichannel-ecommerce-platform:sha-<git-sha>
```

Prefer the `sha-*` tag for deterministic production deploys. Use `latest` only if you want Dokploy to track the default branch automatically.

## GitHub Package Access

If the repository or package is private, create a GitHub personal access token with package read access and configure Dokploy registry credentials:

```txt
Registry: ghcr.io
Username: <github-username>
Password: <github-token-with-read:packages>
```

For public packages, no registry credentials are required.

## Dokploy Settings

In Dokploy, choose image-based deployment instead of repository build:

```txt
Image: ghcr.io/rootkityasin/omnichannel-ecommerce-platform:latest
Port: 3003
```

Keep runtime environment variables in Dokploy, not in the GitHub Actions build. Required runtime variables include `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, tenant deployment settings, and RustFS variables.

## Build Cache

The GitHub workflow uses Docker Buildx with GitHub Actions cache:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

This keeps dependency and layer cache in GitHub Actions so Dokploy only pulls and runs the finished image.
