# MIVA FixIt — Backend API

REST API and WebSocket server for the MIVA FixIt university maintenance management system. Built with Node.js, Express, Prisma, and PostgreSQL.

## Features

- **Role-based access control** — Requester, Officer, and Admin roles with enforced route-level authorization
- **Request lifecycle management** — Full status workflow: Submitted → Assigned → In Progress → On Hold → Completed → Closed
- **Assignments** — Admin assigns requests to maintenance officers; officers can be reassigned
- **Real-time updates** — Socket.IO emits live events on status changes, new requests, and notifications
- **File uploads** — Evidence and completion proof images uploaded to Cloudinary
- **Notifications** — In-app notification system with unread count tracking
- **Audit logging** — Every significant action is logged with actor, entity, and metadata
- **Reports** — CSV and PDF export of request data for admin analysis
- **SLA tracking** — Due dates calculated per category SLA; overdue detection built in
- **Email notifications** — Nodemailer integration for request submission, assignment, and status updates
- **API documentation** — Swagger UI available at `/api/docs`

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access token 15m + refresh token 7d via httpOnly cookie) |
| Real-time | Socket.IO |
| File storage | Cloudinary |
| Email | Nodemailer |
| Validation | Zod |
| Testing | Jest + Supertest |

## Project Structure

```
src/
├── config/          # DB, Cloudinary, Swagger, mailer setup
├── middleware/       # Auth, RBAC, validation, upload, audit logger
├── modules/
│   ├── auth/        # Register, login, logout, refresh, password reset
│   ├── users/       # User management (admin CRUD, role changes)
│   ├── requests/    # Service request CRUD and status transitions
│   ├── assignments/ # Officer assignment and reassignment
│   ├── comments/    # Per-request comments
│   ├── categories/  # Maintenance categories with SLA hours
│   ├── notifications/ # In-app notifications
│   ├── reports/     # CSV/PDF report generation
│   ├── audit/       # Audit log queries
│   └── setup/       # One-time admin bootstrap endpoint
├── sockets/         # Socket.IO event emitters
└── utils/           # Response helpers, error class, pagination
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Cloudinary account (for file uploads)

### Installation

```bash
npm install
npx prisma generate
```

### Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5001

DATABASE_URL=postgresql://user:password@localhost:5432/fixit_db

JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=MIVA Facilities <no-reply@miva.university>

# Optional: seed an admin user on startup
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword1!
ADMIN_NAME=System Admin
```

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Or for production
npx prisma migrate deploy
```

Roles and categories are seeded automatically on server startup. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars to auto-create the first admin user.

### Running

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

### API Documentation

Swagger UI is served at `http://localhost:5001/api/docs` when the server is running.

### Health Check

```
GET /api/v1/health
```

Returns server uptime and database connectivity status.

## API Overview

| Resource | Prefix |
|---|---|
| Auth | `/api/v1/auth` |
| Users | `/api/v1/users` |
| Requests | `/api/v1/requests` |
| Comments | `/api/v1/requests/:id/comments` |
| Assignments | `/api/v1/assignments` |
| Categories | `/api/v1/categories` |
| Notifications | `/api/v1/notifications` |
| Reports | `/api/v1/reports` |
| Audit logs | `/api/v1/audit` |
| First-run setup | `/api/v1/setup/admin` |

## Testing

```bash
npm test
```

Runs 132 integration tests across auth, RBAC, requests, assignments, status transitions, and reports using an in-memory SQLite database.

## Deployment

The backend is deployed on [Render](https://render.com). Key deployment notes:

- Set `DATABASE_URL` to your PostgreSQL public URL
- Set `CLIENT_URL` to your frontend domain (comma-separated for multiple origins)
- The Prisma schema includes `debian-openssl-3.0.x` binary target for Render compatibility
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars trigger first-admin creation on startup
