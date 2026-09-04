# Learning Tracker API

Base URL: `http://localhost:4000`

All protected routes require a Bearer token in the `Authorization` header:

---

## Auth

### POST /auth/register

Create a new user account.

**Request**

```json
{ "email": "user@example.com", "password": "password123" }

Response 201
{ "data": { "token": "...", "userId": "uuid" } }

Errors

422 — invalid email or password too short

409 EMAIL_TAKEN — email already registered

POST /auth/login
Login with existing credentials.

{ "email": "user@example.com", "password": "password123" }

Response 200

{ "data": { "token": "...", "userId": "uuid" } }

Errors

422 — validation error

401 INVALID_CREDENTIALS — wrong email or password

429 TOO_MANY_REQUESTS — rate limited (10 requests per 15 min)

Goals
All routes require authentication.

GET /goals
Get all goals for the authenticated user.

Query params

| Param    | Type                          | Default   | Description      |
| -------- | ----------------------------- | --------- | ---------------- |
| status   | planned \| in_progress \| done | —         | Filter by status |
| sort     | createdAt \| updatedAt \| title | createdAt | Sort field       |
| order    | asc \| desc                   | desc      | Sort direction   |
| page     | number (min 1)                | 1         | Page number      |
| pageSize | number (1-100)                | 10        | Results per page |
```

Response 200

Errors

401 UNAUTHORIZED — missing or invalid token

422 VALIDATION_ERROR — invalid query params

GET /goals/:id
Get a single goal by ID.

Response 200

{ "data": { "id": "uuid", "userId": "uuid", "title": "...", "description": "...", "status": "planned", "createdAt": "...", "updatedAt": "..." } }

Errors

401 UNAUTHORIZED

404 NOT_FOUND

422 VALIDATION_ERROR — invalid UUID

# POST /goals

Create a new goal.

Request

{ "title": "Learn Node", "description": "Study event loop", "status": "planned" }

Response 201

{ "data": { "id": "uuid", ... } }

Errors

401 UNAUTHORIZED

422 VALIDATION_ERROR

# PATCH /goals/:id

Update an existing goal.

Request (all fields optional, at least one required)

{ "title": "...", "description": "...", "status": "in_progress" }

Response 200

{ "data": { "id": "uuid", ... } }

Errors

401 UNAUTHORIZED

404 NOT_FOUND

422 VALIDATION_ERROR

Sessions
All routes require authentication.

# POST /goals/:id/sessions

Add a learning session to a goal. Automatically moves goal status from planned to in_progress on first session.

Request
{ "durationMinutes": 25, "notes": "Covered event loop" }

Response 201
{ "data": { "id": "uuid", "goalId": "uuid", "durationMinutes": 25, "notes": "...", "createdAt": "..." } }

Errors

401 UNAUTHORIZED

404 NOT_FOUND — goal not found

422 VALIDATION_ERROR

# GET /goals/:id/sessions

Get all sessions for a goal.

Response 200
{ "data": [...], "count": 5 }

Errors

401 UNAUTHORIZED

404 NOT_FOUND

422 VALIDATION_ERROR

# Stats

# GET /stats/goals

Get aggregated stats for the authenticated user's goals.

Response 200
{
"data": {
"byStatus": [
{ "status": "planned", "count": 2 },
{ "status": "in_progress", "count": 1 }
],
"sessionMinutesPerGoal": [
{ "goalId": "uuid", "totalMinutes": 75 }
]
}
}

# Queue

# POST /queue/email

Add an email job to the queue.

Request
{ "recipient": "user@example.com", "subject": "Welcome!" }

Response 200
{ "data": { "jobId": "1", "status": "queued" } }

# GET /queue/email

Get current queue stats.

Response 200
{ "data": { "waiting": 0, "active": 0, "completed": 7, "failed": 0 } }

# Health

# GET /health

Returns server health status.

# GET /version

Returns app version.
