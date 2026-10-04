# Docker

## Core concepts

- An image is an immutable layered filesystem plus metadata; a container is a
  running instance with a writable layer and isolated process/network settings.
- A Dockerfile should build reproducibly: pin meaningful base versions, use a
  small runtime image, run as a non-root user, and keep secrets out of layers.
- Docker Compose describes local multi-container dependencies, networks,
  volumes, health checks, and environment wiring; it is not a substitute for
  production orchestration by itself.

## Operational checks

1. Use `docker ps`, `docker inspect`, and `docker logs --tail` to identify the
   container state, exit code, command, mounts, and recent errors.
2. Check resources with `docker stats`, then inspect host disk and volume use.
3. Validate networking from the correct container and verify service DNS names
   on the Compose network.
4. Reproduce startup with the exact image, environment, command, and mounted
   configuration rather than editing a live container.

## Interview answer points

- Multi-stage builds reduce runtime attack surface and image size by copying
  only required build artifacts into the final image.
- `CMD` provides default arguments; `ENTRYPOINT` defines the executable. Use
  exec form so signals reach the application process correctly.
- Persist state in volumes or an external service, not the container writable
  layer, because a recreated container loses that layer.

## Practical interview scenarios

### A container repeatedly exits and restarts

- **Inspect:** read state, exit code, OOM flag, restart count, health result,
  command, environment, mounts, and `docker logs`/daemon logs. Reproduce using
  the same image digest and inputs.
- **Act:** fix the verified entrypoint, configuration, permission, resource
  limit, or dependency issue. Raising the restart count is not a root-cause fix.
- **Verify:** confirm stable uptime, health check, application SLI, memory trend,
  and that termination signals are handled cleanly.

### A production image is unexpectedly large and slow to ship

- **Inspect:** use `docker history` and build output to identify large layers,
  duplicated artifacts, caches, package indexes, and an oversized base image.
- **Act:** use a multi-stage build, a suitable minimal runtime base,
  `.dockerignore`, deterministic dependency installation, and cache-friendly
  ordering. Remove build tooling from the runtime stage rather than deleting it
  in a later layer.
- **Verify:** compare image size, build time, pull/start time, runtime behavior,
  and vulnerability scan results. A smaller base is useful only if the runtime
  dependencies and debugging/operational needs remain supported.

### A Compose application cannot connect to its database

- **Inspect:** from the application container, resolve the Compose service name
  and connect to the database's container port. Check shared networks,
  published versus internal ports, credentials, logs, health, and readiness.
- **Act:** use the service DNS name rather than `localhost`; add application
  retry/backoff and a meaningful health check instead of assuming startup order
  means the database is ready.
- **Verify:** recreate the stack from clean state and prove connection, schema
  readiness, restart recovery, and persisted data behavior.

## Concise interview delivery

“I treat an image as the immutable release artifact and the container as its
runtime process. I inspect exit state, exact inputs, resources, networking, and
dependencies; fix the Dockerfile or configuration; then recreate and verify
health instead of patching the live container.”

## Common pitfalls

- Do not bake credentials into `ARG`, `ENV`, source files, or image layers.
- `latest` weakens repeatability; use an intentional version or immutable
  digest for release images.
- A container restart loop is a symptom—read exit code, logs, configuration,
  health checks, and dependencies before raising restart limits.

## Official references

- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker Compose networking](https://docs.docker.com/compose/how-tos/networking/)
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
