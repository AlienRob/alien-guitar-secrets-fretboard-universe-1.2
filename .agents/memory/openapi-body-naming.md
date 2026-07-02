---
name: OpenAPI / Orval body schema naming
description: Why a request-body component must NOT be named <OperationId>Body in this repo's OpenAPI spec.
---

# OpenAPI request-body component naming (Orval codegen)

When adding a `POST`/`PUT` endpoint to `lib/api-spec/openapi.yaml`, do NOT name the
request-body `components.schemas` entry `<OperationIdPascalCase>Body`.

**Why:** Orval auto-generates a zod schema named `<OperationId>Body` for every
operation's request body (e.g. operationId `redeemPremiumCode` → `RedeemPremiumCodeBody`).
If your component schema is also named `RedeemPremiumCodeBody`, Orval emits two
exports with the same name and the generated barrel fails to compile (TS2308
"already exported a member named ...").

**How to apply:** Give the body component an entity-style name instead
(e.g. `RedeemCodeInput`, `ProfileUpdate`) and `$ref` it from `requestBody`.
The server then validates with the generated `<OperationId>Body` zod schema and
parses responses with `<OperationId>Response`.
