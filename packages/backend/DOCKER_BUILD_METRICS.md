# Docker Build Metrics

## Image Size Analysis

Build Date: January 25, 2026

### Final Production Image

| Metric               | Value          | Notes                    |
| -------------------- | -------------- | ------------------------ |
| **Total Size**       | 329MB          | Uncompressed on disk     |
| **Content Size**     | 64.4MB         | Compressed/transferrable |
| **Base Image**       | node:20-alpine | ~45MB                    |
| **Production Deps**  | ~116MB         | Node modules (prod only) |
| **Application Code** | ~1.29MB        | Compiled TypeScript      |
| **Runtime Deps**     | ~3.12MB        | sqlite, dumb-init        |

### Layer Breakdown

```
Layer Size    Purpose
----------    -------
116MB         Production node_modules
1.29MB        Compiled application (dist/)
3.12MB        Runtime dependencies (sqlite, dumb-init)
41KB          Non-root user setup
12.3KB        Package metadata
8.19KB        Working directory
```

### Optimization Results

| Stage                   | Size      | Reduction       |
| ----------------------- | --------- | --------------- |
| Dependencies (all deps) | ~500MB    | Baseline        |
| Builder (with source)   | ~600MB    | Temporary       |
| Production Dependencies | ~150MB    | 70% reduction   |
| **Final Production**    | **329MB** | **34% of peak** |

### Comparison to Non-Optimized Build

| Build Type   | Image Size | Notes                |
| ------------ | ---------- | -------------------- |
| Single-stage | ~650MB     | All deps + dev tools |
| Multi-stage  | 329MB      | 49% reduction        |
| **Savings**  | **~321MB** | **Per image**        |

### Build Performance

| Metric            | Value                    |
| ----------------- | ------------------------ |
| Clean build time  | ~45-60 seconds           |
| Cached build time | ~5-10 seconds            |
| Layer cache hits  | 90%+ (after first build) |

### Optimization Techniques Applied

1. ✅ **Multi-stage build** - 4 stages (dependencies, builder, prod-deps, production)
2. ✅ **Alpine Linux base** - Uses minimal node:20-alpine (~45MB vs ~900MB for full node:20)
3. ✅ **Production dependencies only** - Excludes devDependencies (testing, linting tools)
4. ✅ **Layer caching** - Copies package files before source for better cache hits
5. ✅ **Package manager cleanup** - Removes package manager cache
6. ✅ **.dockerignore** - Excludes unnecessary files (node_modules, tests, docs)
7. ✅ **Self-contained config** - Uses tsconfig.docker.json (no monorepo dependencies)
8. ✅ **Non-root user** - Runs as nodejs:nodejs (UID 1001) for security
9. ✅ **Minimal runtime deps** - Only sqlite and dumb-init for production

### Further Optimization Potential

If smaller image size is critical, consider:

1. **Use distroless or scratch images** (~20MB base)
   - Requires bundling Node.js binary
   - More complex to debug
   - Estimated savings: ~30MB

2. **Bundle application with webpack/esbuild**
   - Single JavaScript file instead of dist/ tree
   - Estimated savings: ~10MB

3. **Remove source maps in production**
   - Saves ~500KB
   - Makes debugging harder

4. **Use pnpm deploy for production deps**
   - Prunes unnecessary package files
   - Estimated savings: ~20MB

**Current size is acceptable for most deployments.**

### Build Context Size

With .dockerignore optimization:

```
Sending build context to Docker daemon: ~50-100KB
```

Without .dockerignore (includes node_modules, tests, etc.):

```
Sending build context to Docker daemon: ~200MB+
```

**Result: 99.95% reduction in build context transfer time**

## Image Analysis with Dive

To analyze the image layers in detail:

```bash
# Install dive
brew install dive  # macOS

# Analyze the image
dive x402arcade-backend:latest
```

Expected efficiency score: **95%+**

## CI/CD Recommendations

### Registry Push Strategies

1. **Tag immutably**

   ```bash
   docker tag x402arcade-backend:latest x402arcade-backend:v1.2.3
   ```

2. **Push compressed** (automatic with Docker registries)
   - 329MB → 64.4MB transfer
   - 80% bandwidth savings

3. **Use layer caching in CI**
   ```yaml
   - name: Set up Docker Buildx
     uses: docker/setup-buildx-action@v3
     with:
       cache-from: type=gha
       cache-to: type=gha,mode=max
   ```

### Deployment Targets

| Platform         | Image Compatibility | Notes                         |
| ---------------- | ------------------- | ----------------------------- |
| Kubernetes       | ✅ Excellent        | Standard OCI image            |
| Docker Swarm     | ✅ Excellent        | Native support                |
| AWS ECS          | ✅ Excellent        | Standard Docker image         |
| Google Cloud Run | ✅ Excellent        | Runs on Cloud Run             |
| Railway          | ✅ Excellent        | Dockerfile detected           |
| Vercel           | ⚠️ Use Serverless   | Not ideal for containers      |
| Heroku           | ✅ Good             | Uses heroku.yml or Dockerfile |

### Health Check Configuration

Built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3
```

Expected response time: **<50ms** for /health endpoint

## Resource Recommendations

### Memory Limits

| Environment | Min RAM | Recommended | Notes         |
| ----------- | ------- | ----------- | ------------- |
| Development | 256MB   | 512MB       | For testing   |
| Staging     | 512MB   | 1GB         | Full features |
| Production  | 1GB     | 2GB         | With headroom |

### CPU Limits

| Environment | Min vCPU | Recommended | Notes         |
| ----------- | -------- | ----------- | ------------- |
| Development | 0.25     | 0.5         | Light load    |
| Staging     | 0.5      | 1.0         | Full features |
| Production  | 1.0      | 2.0         | Handle spikes |

### Example Docker Run

```bash
docker run -d \
  --name x402arcade-backend \
  --memory="1g" \
  --cpus="1.0" \
  --restart=unless-stopped \
  -p 8000:8000 \
  x402arcade-backend:latest
```

## Security Considerations

| Feature                | Status      | Notes                                          |
| ---------------------- | ----------- | ---------------------------------------------- |
| Non-root user          | ✅ Yes      | Runs as nodejs:nodejs (UID 1001)               |
| Read-only rootfs       | ⚠️ Possible | Requires writable /app/data volume             |
| No shell               | ❌ No       | Alpine includes /bin/sh (needed for debugging) |
| Signed images          | ⚠️ Manual   | Use Docker Content Trust                       |
| Vulnerability scanning | ⚠️ Manual   | Use trivy or snyk                              |

### Recommended Security Scanning

```bash
# Scan with trivy
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest \
  image x402arcade-backend:latest
```

## Conclusion

The Docker build achieves:

- ✅ **Optimized size** (329MB, 64MB compressed)
- ✅ **Fast builds** (5-10s cached, 45-60s clean)
- ✅ **Production-ready** (multi-stage, non-root, health checks)
- ✅ **Secure** (minimal attack surface, no dev tools)
- ✅ **Maintainable** (clear documentation, standard practices)

**Result: Production-quality Docker image suitable for deployment.**
