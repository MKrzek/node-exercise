Target Architecture
We'll split into two tokens with very different lifetimes and storage:

|                   | Access token                      | Refresh token                                                 |
| ----------------- | --------------------------------- | ------------------------------------------------------------- |
| Lifetime          | 15 minutes                        | 7-30 days                                                     |
| Storage           | Memory/cookie, sent every request | HttpOnly cookie, sent only to refresh endpoint                |
| Contains          | userId, email, role               | Just a random opaque ID (not a JWT)                           |
| Server tracks it? | No (stateless, self-expiring)     | Yes, in Redis (or Postgres) — this is what enables revocation |
| Rotation          | New one issued every refresh      | New one issued every refresh, old one invalidated             |

The key design decision: refresh tokens are opaque random strings stored in Redis, not JWTs. This is what makes revocation instant — you just delete the Redis key. If you made refresh tokens JWTs too, you'd have the same "can't revoke" problem, just at a longer timescale.

Rotation & Reuse Detection
Every time a refresh token is used, we issue a brand-new one and delete the old one immediately. If someone ever presents an already-used (rotated-out) refresh token, that's a strong signal of theft — someone has a copy of a token that the legitimate user already rotated past. When that happens, we revoke the entire session family, not just that token.

Let's build this in pieces. First, the Redis-backed session store:
