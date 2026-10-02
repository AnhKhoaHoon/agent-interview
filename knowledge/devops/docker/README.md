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

## Common pitfalls

- Do not bake credentials into `ARG`, `ENV`, source files, or image layers.
- `latest` weakens repeatability; use an intentional version or immutable
  digest for release images.
- A container restart loop is a symptom—read exit code, logs, configuration,
  health checks, and dependencies before raising restart limits.
