Lesson 20: Security Fundamentals
**Part 1: Why Security Matters**
The Problem:
Imagine your app without security:
User registers → Password stored as "password123" in database
↓
Hacker steals database
↓
All user passwords EXPOSED! 😱

What we'll build:
User registers → Password hashed to "$2b$10$abc123..." in database
↓
Hacker steals database
↓
Passwords are UNREADABLE! ✅

**Part 2: Authentication Flow (How login works)**
Step-by-step:

1. User registers (signs up)

Email: alice@example.com
Password: password123

2. Your app hashes the password

"password123" → bcrypt → "$2b$10$abc123xyz..."

3. Store in database

User {
email: "alice@example.com",
passwordHash: "$2b$10$abc123xyz..." // NOT the real password!
}

4. User logs in

Email: alice@example.com
Password: password123

5. Your app checks

bcrypt.compare("password123", "$2b$10$abc123xyz...")
// Returns: true ✅ (password matches!)

6. Create a "token" (like a digital ID card)

JWT token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

7. Send token to user

User stores it (in browser localStorage or cookie)
Sends it with every request: Authorization: Bearer <token>

8. Your app verifies token

JWT.verify(token, secretKey)
// Returns: { userId: "abc123", email: "alice@example.com" }

Part 3: Key Security Concepts

1. Password Hashing (bcrypt)
   What is it?

One-way function: "password123" → "$2b$10$abc123..."
Can't reverse it: "$2b$10$abc123..." → ❌ (impossible!)
Same input always gives same output
Tiny change in input = completely different hash

Example:
"password123" → "$2b$10$abc123..."
"password124" → "$2b$10$xyz789..." // Completely different!

Why?

If hackers steal your database, they can't read passwords
Even YOU (the developer) can't see user passwords

2. Salt (Random extra security)
   What is it?

Random string added to password before hashing

Prevents "rainbow table" attacks (pre-computed hashes)

Example:

Password: "password123"
Salt: "randomabc123"

Hash: bcrypt("password123" + "randomabc123")
// Result: "$2b$10$saltedhash..."

Good news: bcrypt does this automatically! You don't need to manually add salt.

3. JWT (JSON Web Token)
   What is it?

A digital "ID card" for logged-in users

Contains: User ID, email, expiration time

Signed with a secret key (so it can't be faked)

Structure:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 // Header (algorithm)
.
{userId: "abc123", email: "alice@example.com"} // Payload (data)
.
signature // Signature (proof it's real)

**How it works:**

User logs in → You create JWT

User sends JWT with every request

You verify JWT → You know who they are

No need to query database every time! ✅

Expiry:

JWTs expire (e.g., 1 hour, 7 days)

After expiry, user must log in again

Prevents stolen tokens from working forever

4. CSRF (Cross-Site Request Forgery)
   Example:
   User is logged into your bank: yourbank.com
   User visits evil site: evil.com

evil.com has hidden code:
<img src="yourbank.com/transfer?to=hacker&amount=1000" />

User's browser sends the request WITH their cookie!
Money is transferred! 😱

**The fix:**

Use CSRF tokens (unique per session)

Or use Authorization: Bearer <token> header (JWT approach)

Or use SameSite cookies (modern browsers)

We'll use: JWT in Authorization header (simpler for APIs)

5. RBAC (Role-Based Access Control)

_What is it?_
Different users have different permissions

**Example:**

user: Can view their own data

admin: Can view all data, delete users

**Implementation:**

// In JWT, include role
JWT payload: { userId: "abc123", role: "admin" }

// In your route
if (user.role !== "admin") {
return res.status(403).json({ error: "Forbidden" })
}

6. Input/Output Sanitization
   The attack (SQL Injection):

User inputs: alice@example.com' OR '1'='1
Your SQL: SELECT \* FROM users WHERE email = 'alice@example.com' OR '1'='1'
Result: Returns ALL users! 😱

The fix:

Use parameterized queries (Prisma does this automatically!)

Never build SQL strings with user input

**The attack (XSS - Cross-Site Scripting)**
User posts comment: <script>stealCookies()</script>
Other users see the comment → Their cookies are stolen! 😱
The fix:

Escape HTML output

Use libraries like dompurify for rich text

\***\*Complete Authentication Flow**
**Step 1: User Registers (Signs Up)**

User's Browser:
Email: alice@example.com
Password: password123
↓
POST /api/auth/register
{ email: "alice@example.com", password: "password123" }
↓
Your Backend (authService.register):

1. Hash password: bcrypt.hash("password123")
2. Save to database:
   User {
   email: "alice@example.com",
   passwordHash: "$2b$10$abc123xyz..."
   }
3. Return: { userId: "abc123", email: "alice@example.com" }
   ↓
   User's Browser:
   ✅ "Registration successful!"

**Step 2: User Logs In**

User's Browser:
Email: alice@example.com
Password: password123
↓
POST /api/auth/login
{ email: "alice@example.com", password: "password123" }
↓
Your Backend (authService.login):

1. Find user in database by email
2. Check password: bcrypt.compare("password123", "$2b$10$abc123xyz...")
3. If match → Create JWT:
   jwt.sign({ userId: "abc123", email: "alice@example.com" },JWT_SECRET)
   // Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
4. Return: { token: "eyJhbGci...", user: {...} }
   ↓
   User's Browser:
5. Save token to localStorage:
   localStorage.setItem('token', 'eyJhbGci...')
6. ✅ "Login successful!"

**Step 3: User Makes Authenticated Request**

User's Browser:
GET /api/learning-goals
Headers:
Authorization: Bearer eyJhbGci...
↓
Your Backend (middleware/authenticate.ts):

1. Extract token from header: "eyJhbGci..."
2. Verify token: jwt.verify(token, JWT_SECRET)
3. If valid → Get userId: "abc123"
4. Attach to request: req.userId = "abc123"
5. Continue to next middleware/route
   ↓
   Your Route Handler:
6. Query database: prisma.learningGoal.findMany({ where: { userId: "abc123" } })
7. Return: { data: [...] }
   ↓
   User's Browser:
   ✅ Shows user's learning goals

**Visual Flow**

┌─────────────────┐
│ User Browser │
│ (localStorage) │
│ token: "abc123" │
└────────┬────────┘
│
│ Request: GET /api/learning-goals
│ Header: Authorization: Bearer abc123
↓
┌─────────────────────────────────────────┐
│ Your Backend (Express) │
│ ┌────────────────────────────────────┐ │
│ │ middleware/authenticate.ts │ │
│ │ 1. Extract token from header │ │
│ │ 2. jwt.verify(token, JWT_SECRET) │ │
│ │ 3. req.userId = decoded.userId │ │
│ │ 4. next() │ │
│ └────────────────────────────────────┘ │
│ ↓ │
│ ┌────────────────────────────────────┐ │
│ │ Route handler │ │
│ │ prisma.learningGoal.findMany({ │ │
│ │ where: { userId: req.userId } │ │
│ │ }) │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
↓
│ Response: { data: [...] }
↓
┌─────────────────┐
│ User Browser │
│ Display data │
└─────────────────┘

Key Points:

1. JWT is like a digital ID card
   Contains: userId, email, exp (expiration)

Signed with JWT_SECRET (can't be faked)

User stores it (localStorage or cookie)

2. Backend verifies on every request
   Checks signature (proves it's real)

Checks expiry (not expired)

Extracts userId (knows who user is)

3. No database query needed for auth
   Old way: Query database every request to check session

JWT way: Just verify token (faster!) ✅

4. Token expires
   Typical: 1 hour, 7 days, 30 days

After expiry → User must log in again

Prevents stolen tokens from working forever

Paste the new value into .env, replacing the old one. This costs nothing (existing JWTs just get invalidated, so all users will need to log in again — acceptable for a dev project).

About .dockerignore containing .env
This is actually fine and intentional now, not a bug — here's why:

Your docker-compose.yml injects environment variables directly into the container via the environment: block (e.g., JWT_SECRET: ${JWT_SECRET}). Docker Compose reads .env from your host machine to resolve ${JWT_SECRET}, and injects the actual value as a real environment variable when the container starts — it doesn't need the .env file to physically exist inside the container for this to work.

Since .dockerignore excludes .env from being copied into the image, your secrets never get baked into the Docker image itself — a genuinely better security practice, since anyone with access to the image (e.g., pushed to a registry) can't extract secrets from it.

Your import 'dotenv/config' line in code will simply find no .env file inside the container and do nothing — that's harmless, because docker-compose already set process.env.JWT_SECRET before your app even starts.

Why each rule matters
.max(72) — this one is a hidden gotcha, not a style choice. bcrypt silently truncates any input longer than 72 bytes before hashing. If a user sets a 100-character password, bcrypt only actually "sees" the first 72 characters — meaning characters 73–100 do nothing, which can confuse users and, in rare edge cases, weaken uniqueness. Capping it explicitly avoids that silent truncation.

Complexity regexes — each one blocks a common weak-password pattern:

No lowercase check → allows "12345678"

No uppercase check → allows "password1!"

No number check → allows "Password!"

No special-char check → allows "Password1" (still crackable faster than with symbols)
