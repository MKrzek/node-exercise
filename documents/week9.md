# How JWT works

A JWT (JSON Web Token) is a signed string the server gives the client after login. The client sends it back on every request to prove who they are.

1. Client: POST /auth/login { email, password }
2. Server: verifies password → signs a token → returns it
3. Client: stores token, sends it on future requests:
   Authorization: Bearer <token>
4. Server: verifies token signature → allows or rejects request

# The token itself looks like this:

eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.abc123
└─── header ───────┘.└──── payload ──────────┘.└─ signature ┘

Three base64 parts separated by dots. The signature is what makes it tamper-proof — only your server can produce it because only your server knows the secret key.

# Key points

Stateless — the server stores nothing. The token contains everything needed to identify the user.

Expiry — tokens have an expiresIn — after that they're invalid.

Not encrypted — the payload is readable by anyone. Never put sensitive data in it.
