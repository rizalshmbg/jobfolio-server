# JobFolio Server

REST API for tracking job applications, built with TypeScript, Express 5, Prisma 7, and PostgreSQL.

## Features

- Registration and login with bcrypt password hashing.
- JWT access tokens and rotating refresh tokens stored in HTTP-only cookies.
- Job application creation, editing, deletion, search, filtering, sorting, and pagination.
- Dashboard totals by application status and the five most recently updated applications.
- Profile retrieval and name updates.
- Zod request validation, Pino logging, and integration tests with Vitest and Supertest.

Application records and dashboard results are scoped to the authenticated user.

## Requirements

- Node.js compatible with Prisma: `^20.19`, `^22.12`, or `>=24.0`.
- pnpm `12.4.1`, as specified in `package.json`.
- A running PostgreSQL server and a database for the application.

## Local setup

Run commands from the project root.

### 1. Configure the environment

Create a `.env` file:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/jobfolio?schema=public
JWT_SECRET=replace_with_a_generated_secret_of_at_least_64_characters
CLIENT_URL=http://localhost:5173
```

Replace the database credentials and set `CLIENT_URL` to your frontend's origin. Generate a JWT secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
```

Paste the output into `JWT_SECRET`. Environment files are ignored by Git.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` | `development` |
| `PORT` | HTTP server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret, at least 64 characters | Required |
| `CLIENT_URL` | Allowed browser origin for credentialed CORS requests | Required |

### 2. Install dependencies and prepare the database

Create the PostgreSQL database named in `DATABASE_URL`, then run:

```sh
pnpm install
pnpm exec prisma generate --config prisma7.config.ts
pnpm exec prisma migrate deploy --config prisma7.config.ts
```

The install hook also runs `prisma generate`. The explicit command above uses the project's custom config file, `prisma7.config.ts`; include `--config prisma7.config.ts` when running Prisma commands that need its datasource configuration.

To create a migration after changing the schema during development:

```sh
pnpm exec prisma migrate dev --config prisma7.config.ts --name describe_change
pnpm exec prisma generate --config prisma7.config.ts
```

### 3. Start the development server

```sh
pnpm dev
```

The default API base URL is `http://localhost:3000/api`. Open `http://localhost:3000/api/health` to check the server:

```json
{
  "status": "OK",
  "message": "JobFolio API is running"
}
```

The health endpoint reports that the HTTP application is running; it does not query the database.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server with automatic reloads |
| `pnpm check` | Type-check without emitting files |
| `pnpm build` | Compile TypeScript into `dist/` |
| `pnpm start` | Run the compiled server |
| `pnpm test` | Run Vitest in watch mode |
| `pnpm test:run` | Run the test suite once |
| `pnpm db:migrate:test --config prisma7.config.ts` | Apply migrations using `.env.test` |
| `pnpm db:status:test --config prisma7.config.ts` | Check migration status using `.env.test` |

For a production build, generate the Prisma client and apply migrations as above, run `pnpm build`, then start with `NODE_ENV=production` set in the deployment environment. Production refresh cookies require HTTPS.

## Authentication

1. Register with `POST /api/auth/register` using `name`, `email`, and `password`. Registration returns the user; log in separately to obtain tokens.
2. Log in with `POST /api/auth/login` using `email` and `password`. The response includes `data.user` and `data.accessToken`, and sets a `refreshToken` cookie.
3. Send `Authorization: Bearer <accessToken>` on protected requests. Access tokens expire after 15 minutes.
4. Call `POST /api/auth/refresh` with the refresh cookie to obtain a new access token and rotate the refresh token. Refresh tokens have a seven-day lifetime, renewed on rotation; only their SHA-256 hashes are stored in the database.
5. Call `POST /api/auth/logout` with the cookie to delete that session and clear the cookie. Existing access tokens remain valid until they expire.

Browser clients should use `credentials: 'include'` for login, refresh, and logout. Refresh cookies use `SameSite=Lax`, are scoped to `/api/auth`, and are marked `Secure` in production; the frontend and API deployment must account for these cookie settings.

Registration requires a name of 2–100 characters and a password of 8–64 characters.

## API endpoints

All paths below are relative to `/api`.

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | None | Server health response |
| `POST` | `/auth/register` | None | Create an account |
| `POST` | `/auth/login` | None | Log in and issue tokens |
| `POST` | `/auth/refresh` | Refresh cookie | Rotate tokens |
| `POST` | `/auth/logout` | Cookie, if present | End the current session |
| `GET` | `/profile` | Bearer token | Retrieve the current user's profile |
| `PATCH` | `/profile` | Bearer token | Update `name` |
| `GET` | `/applications` | Bearer token | List the current user's applications |
| `POST` | `/applications` | Bearer token | Create an application |
| `GET` | `/applications/:id` | Bearer token | Retrieve an application |
| `PATCH` | `/applications/:id` | Bearer token | Update an application |
| `DELETE` | `/applications/:id` | Bearer token | Delete an application |
| `GET` | `/dashboard` | Bearer token | Retrieve `summary` and `recentApplications` |

Application IDs must be UUIDs.

### Create an application

Send this JSON body to `POST /api/applications` with a bearer token and `Content-Type: application/json`:

```json
{
  "company": "Example Company",
  "position": "Backend Developer",
  "status": "APPLIED",
  "appliedAt": "2026-09-26T00:00:00.000Z",
  "jobUrl": "https://example.com/jobs/backend-developer",
  "location": "Jakarta",
  "employmentType": "FULL_TIME",
  "workArrangement": "HYBRID",
  "notes": "Applied through the company website."
}
```

Only `company` and `position` are required; each accepts 1–100 characters. `status` defaults to `APPLIED`. Optional `salaryMin` and `salaryMax` must be nonnegative integers, with the minimum no greater than the maximum. Notes allow up to 2,000 characters. A `PATCH` request can use `null` to clear optional fields.

| Field | Allowed values |
| --- | --- |
| `status` | `WISHLIST`, `APPLIED`, `SCREENING`, `INTERVIEW`, `TECHNICAL_TEST`, `OFFER`, `REJECTED`, `WITHDRAWN` |
| `employmentType` | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `FREELANCE` |
| `workArrangement` | `ONSITE`, `HYBRID`, `REMOTE` |

### List applications

Example request:

```http
GET /api/applications?page=1&limit=10&search=developer&status=APPLIED&sortBy=createdAt&order=desc
Authorization: Bearer <accessToken>
```

| Query parameter | Description | Default |
| --- | --- | --- |
| `page` | Positive page number | `1` |
| `limit` | Page size, from 1 to 100 | `10` |
| `search` | Case-insensitive match on company or position | None |
| `status` | Filter by application status | None |
| `employmentType` | Filter by employment type | None |
| `workArrangement` | Filter by work arrangement | None |
| `sortBy` | `createdAt`, `updatedAt`, `appliedAt`, `company`, `position`, `salaryMin`, or `salaryMax` | `createdAt` |
| `order` | `asc` or `desc` | `desc` |

### Responses

Successful resource responses generally contain `success`, `message`, and `data`. The application list also includes pagination metadata:

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Errors contain `success: false` and a `message`. Validation errors also include an `errors` array with `field` and `message` entries. Common HTTP statuses are `400` for invalid input, `401` for authentication failures, `404` for missing resources, and `409` for an already registered email.

## Testing

Tests use a real PostgreSQL database. **Use a dedicated test database: test cleanup deletes all users and their related sessions and applications.**

Create that database and a `.env.test` file with the same variables as `.env`, using `NODE_ENV=test`, a separate `DATABASE_URL` such as `postgresql://postgres:password@localhost:5432/jobfolio_test?schema=public`, and a valid JWT secret. Ensure an externally set `DATABASE_URL` does not point the test process at another database; existing environment variables take precedence over dotenv files.

```sh
pnpm db:migrate:test --config prisma7.config.ts
pnpm db:status:test --config prisma7.config.ts
pnpm test:run
```

Vitest selects the test environment, and the application loads `.env.test` when `NODE_ENV=test`. Test files run without file parallelism. Coverage includes health and unknown routes, authentication, applications, dashboard statistics, and profiles.

## Project structure

```text
prisma/
  migrations/       Database migration history
  schema.prisma     Models and enums
src/
  config/           Environment, database, logging, CORS, and cookie settings
  controllers/      HTTP request handlers
  errors/           Application error class
  generated/prisma/ Generated Prisma client (ignored by Git)
  middlewares/      Authentication, validation, and error handling
  routes/           API route definitions
  services/         Business logic and database operations
  types/            Express type extensions
  utils/            Access and refresh token helpers
  validations/      Zod request schemas
  app.ts            Express application
  index.ts          HTTP server entry point
tests/              Integration tests and database helpers
prisma7.config.ts   Prisma CLI configuration
vitest.config.ts    Test configuration
```
