Things to remember: How node works

(1) res (the Express response object) extends Node's http.ServerResponse, which extends EventEmitter.

(2) .on() comes from Node's built-in EventEmitter class. Almost everything in Node extends it — HTTP servers, responses, streams, file system watchers, database connections.

(3) Browser: document.addEventListener('click', handler)
Node: emitter.on('finish', handler)

(4) in Node, async things that happen over time communicate via events, not return values.

`Request comes in
      ↓
requestLogger runs  ← you are here, response not sent yet
      ↓
route handler runs
      ↓
res.json() called   ← response sent
      ↓
'finish' event fires ← your callback runs here
`

Project structure:

1. app - the outer file
2. routes (send requests to service which in turn sends it to repositories) - he validate middleware runs before the route handler, but it's wired in the routes file. The distinction is:
   validate middleware — validates shape, calls next(err) on failure.

Route handler — calls service, service throws domain errors, asyncHandler catches and forwards to error handler via next.
So errors do get thrown (in the service), they just never get caught manually in the route. The route itself stays thin.

3. service - The service doesn't validate DB output — it trusts the repo returns the right shape. What the service actually does:

Enforces business rules (e.g. goal must exist before updating).
Throws domain errors (AppError, NotFoundError).
Orchestrates data assembly (builds the full object before passing to repo).

4. repository — only knows about storage, no business logic, no HTTP concepts.
   The service trusts the repo returns the correct shape.
   Swapping in-memory → PostgreSQL later means only changing the repo file.

5. middlware - utils that all req come through -used to modifly reqs before they reach routes
6. errors - where different centralised error types live
7. different validators

- Why req.parsed instead of overwriting req.body/req.query
  when the result of validation is success, then we would add it to the body/query/params
  BUTT req.body is writable (Express adds it), but req.query and req.params are defined as getters on Node's IncomingMessage and cannot be reassigned. that is why we added PARSED property to express REQUEST type and write the result of validation back to it.

  Any route reading from req.parsed is guaranteed to have passed validation. It makes it visually obvious in code whether you're using safe data or raw input.

- Why correlationId is its own middleware
  As then it will be run for all requests, and added to a req, but also for response

- Why asyncHandler instead of try/catch in every route
  to avoid repetition of try/catch; centralise how requests are handled

  ***

  (5) next() is synchronous — it does not await the route handler.
  Code after next() runs immediately, before any async handler completes.
  That's why res.on('finish') exists — it's the only reliable way
  to run code after the response is actually sent.
