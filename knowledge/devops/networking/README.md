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

## Common pitfalls

- Opening `0.0.0.0/0` is not a diagnostic fix for a routing or target issue.
- `ping` uses ICMP and does not prove TCP/HTTP reachability.
- Increasing all timeouts can amplify overload; first identify queueing,
  dependency latency, or connection-pool saturation.
