# Networking

## Core concepts

- DNS resolves names; TCP establishes reliable connections; TLS authenticates
  and encrypts the session; HTTP carries the application request. Diagnose in
  that order rather than treating every failure as an application bug.
- A load balancer distributes traffic and performs health checks. It does not
  make an unhealthy target, blocked security rule, or incorrect application
  timeout healthy.
- CIDR, routing tables, security groups/firewalls, and network ACLs each decide
  different parts of reachability.

## Safe troubleshooting order

1. Define source, destination, port, protocol, and exact failure symptom.
2. Resolve DNS with `dig` or `nslookup`; verify the expected record and TTL.
3. Test the TCP path with `nc -vz HOST PORT` or `curl -v`.
4. Inspect listener/process state with `ss -lntp` and firewall/security rules.
5. Check route tables, NAT/proxy/load-balancer health, TLS certificate name and
   expiry, then application logs and timeouts.

## Interview answer points

- A 502 commonly means a proxy cannot get a valid upstream response; a 504
  means it waited too long. Confirm proxy and upstream logs before changing a
  timeout.
- Explain that private workloads need an explicit egress path such as NAT for
  outbound internet access, while inbound access should be narrowly exposed.
- Use health checks that test meaningful readiness, not merely that a process
  has opened a port.

## Practical interview scenarios

### Users receive 502/504 responses after a deployment

- **Inspect by layer:** confirm DNS, establish TCP/TLS with `curl -v`, inspect
  load-balancer target health, proxy logs, application readiness, upstream
  latency, connection pools, and the release timeline.
- **Interpret:** a 502 suggests the intermediary received an invalid/failed
  upstream response; a 504 indicates an upstream response did not arrive within
  the gateway's time limit. The exact meaning still depends on the intermediary.
- **Act:** remove unhealthy targets or roll back the regression before tuning.
  Increase a timeout only when the request is intentionally long and capacity,
  retry behavior, and user expectations have been evaluated.
- **Verify:** compare 5xx rate and latency by route, target health, saturation,
  and a synthetic request through the real entry path.

### A workload cannot resolve an internal service name

- **Inspect from the failing network namespace:** check `/etc/resolv.conf`,
  `dig NAME`, search suffixes, record type, authoritative answer, TTL, resolver
  health/logs, and network policy/firewall access to DNS.
- **Act:** fix the incorrect record, resolver configuration, or blocked path;
  do not replace the name with a hard-coded IP that bypasses service discovery.
- **Verify:** resolve and connect from the same workload identity/location, then
  confirm cache/TTL behavior and resolver error metrics.

### Connections fail intermittently under load

- **Inspect:** segment by source, destination, zone, and time. Compare packet
  loss/retransmits, listener backlog, connection pool, ephemeral ports,
  conntrack/NAT capacity, load-balancer resets, and application saturation.
- **Act:** mitigate the proven bottleneck and apply bounded retries with
  backoff/jitter only for safe, transient operations.
- **Verify:** run a controlled request test and confirm success rate, tail
  latency, reset/retransmit counts, and resource headroom.

## Concise interview delivery

“I troubleshoot from DNS to TCP, TLS, HTTP, then the application. I test from
the affected source, correlate both sides of the connection, and avoid opening
firewalls or increasing timeouts until routing, health, saturation, and logs
identify the failing layer.”

## Common pitfalls

- Opening `0.0.0.0/0` is not a diagnostic fix for a routing or target issue.
- `ping` uses ICMP and does not prove TCP/HTTP reachability.
- Increasing all timeouts can amplify overload; first identify queueing,
  dependency latency, or connection-pool saturation.

## Official references

- [DNS concepts and facilities (RFC 1034)](https://www.rfc-editor.org/rfc/rfc1034)
- [Transmission Control Protocol (RFC 9293)](https://www.rfc-editor.org/rfc/rfc9293)
- [HTTP semantics (RFC 9110)](https://www.rfc-editor.org/rfc/rfc9110)
- [Linux kernel networking documentation](https://docs.kernel.org/networking/)
