A common lightweight framework for this is STRIDE, which breaks threats into six categories per component: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, and Elevation of privilege.

Let's apply it to what you've actually built, since you now have real attack surface: auth, refresh tokens, rate limiting, CSRF, learning goals/sessions, a notification service, and Redis/Postgres behind it all.

Step 1: Map your assets and trust boundaries
Before listing threats, let's establish what's actually at stake and where the boundaries are. Based on everything we've built:

Assets worth protecting:

User credentials (password hashes)

Access/refresh tokens (session hijacking risk)

User's learning goals/session data (privacy — it's still someone's personal data)

Email addresses (used for notifications, PII)

Server resources (uptime, cost — DoS risk)

Trust boundaries (places where untrusted input meets your system):

Public internet → Express app (all HTTP inputs)

Express app → Postgres (SQL injection surface, mitigated by Prisma's parameterization)

Express app → Redis (session data)

Monolith → notification-service (internal network, but still a boundary)

Cookies → your app (anything client-controlled)

Step 2: Let's audit your actual code against STRIDE
Threat Model (STRIDE) for Your App

| #   | Threat                                                                                                     | Category                          | Likelihood                        | Impact                                                                                       | Current Mitigation                 | Gap     | Priority |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- | ------- | -------- |
| 1   | Open email relay — anyone hitting :3001/notifications/email can send arbitrary email via your SMTP account | Spoofing / Information Disclosure | High (port is published, no auth) | Critical (sender reputation burned, phishing from your domain, SMTP credentials blacklisted) | None — endpoint is completely open | Fix now | P0       |

| 2 | No authz on learning goals — GET /:id and PATCH /:id don't check if the goal belongs to the authenticated user | Elevation of Privilege | Medium (requires valid session) | High (read/modify any user's goals) | authenticate middleware checks session | Missing ownership check | P0 |

| 3 | Sessions route unauthenticated — POST /goals/:id/sessions and GET /goals/:id/sessions have no authenticate middleware | Spoofing / Tampering | Medium | Medium (anyone can log sessions for any goal) | None on this route | No auth at all | P0 |

| 4 | No rate limiting on /auth/refresh — attacker can hammer with stolen/guessed tokens | Denial of Service | Medium | Medium (session brute-force, Redis load) | Rate limit on /register and /login only | /refresh unthrottled | P1 |

| 5 | CSRF on state-changing endpoints — you have CSRF middleware, but let's confirm it's actually applied to non-auth routes | Tampering / Repudiation | Low (CSRF middleware exists) | High (forced state changes) | csurf applied after auth routes | Need to verify coverage | P1 |

| 6 | Information leakage via error messages — errorHandler may leak stack traces in dev mode | Information Disclosure | Low | Low-Medium (helps attackers map internals) | \_next not used, but errors logged | Dev mode shows full error message | P2 |

| 7 | No input validation on notification service — to, subject, body are unvalidated strings | Tampering | Medium | Medium (injection, oversized payloads) | None | Missing schema validation | P2 |

| 8 | No auth between monolith → notification service — if attacker compromises monolith (or spoofs it), they can send unlimited email | Spoofing | Low | High | Network isolation only (Docker network) | No JWT/mTLS between services | P2 |

| Fix                             | Threat Addressed                      | Impact                                 |
| ------------------------------- | ------------------------------------- | -------------------------------------- |
| Sessions route auth + ownership | Unauthorized session creation/reading | Blocks cross-user session manipulation |
| Learning goals ownership checks | Unauthorized goal read/modify         | Blocks cross-user goal access          |
| Notification service auth       | Open email relay                      | Blocks spam/phishing via your SMTP     |

Fix 1: Sessions Route Authentication
Sessions routes now require authentication via authenticate and requireAuth middleware

Unauthenticated requests are properly blocked

Fix 2: Learning Goals Service Authorization
Service uses userId from authenticated request context, not from request body

Users can only access/modify their own goals

Fix 3: Notification Service Authentication
Created authenticateMonolith middleware that validates MONOLITH_SECRET

Notification routes protected - returns 401 without valid Bearer token

MONOLITH_SECRET added to both monolith and notification-service environments

Supporting Changes
Added tsx and zod to notification service dependencies

Fixed Dockerfile to install dev dependencies

Ran Prisma migrations for notification database

Added MONOLITH_SECRET to .env

The monolith and notification service are both running and properly secured. You can now proceed to Lesson 23!
