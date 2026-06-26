# DevForge — Backend

> A RESTful API for a developer networking platform — think Tinder, but for finding dev collaborators, co-founders, and project buddies.

Built with **Node.js, Express 5, MongoDB (Mongoose 9), and JWT authentication.**

## Features

- **JWT auth via httpOnly cookies** — login, signup, logout with secure cookie management (supports `sameSite: none` + `secure` in production for cross-origin deployment).
- **Rich developer profiles** — skills, social links, specialization, experience, location, "looking for" bio, and more.
- **Connection request system** — send "interested" or "ignored" signals, accept/reject incoming requests, remove existing connections, and even re-send to users who previously rejected you.
- **Paginated feed** — discover developers you haven't interacted with, with configurable page size (max 50).
- **Profile editing** — whitelist-based field updates (16 allowed fields) so no rogue data sneaks in.
- **Password change** — secure in-place password updates with validation.

## Tech Stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Runtime    | Node.js                                      |
| Framework  | Express 5                                    |
| Database   | MongoDB + Mongoose 9                         |
| Auth       | JSON Web Tokens (via `jsonwebtoken`), bcrypt |
| Validation | `validator` package                          |
| Middleware | `cookie-parser`, `cors`                      |

## Getting Started

```bash
# Clone
git clone https://github.com/your-username/devtinder-backend.git
cd devtinder-backend

# Install
npm install

# Configure
cp .env.example .env
```

Your `.env` file needs:

```env
PORT=
MONGODB_URI=
JWT_SECRET=
FRONTEND_URL=
```

```bash
# Development (auto-restart with nodemon)
npm run dev

# Production
npm start
```

## API Reference

All protected routes expect a `token` cookie set by `/login` or `/signup`.

### Auth Routes — `POST /`

| Endpoint       | Auth | Description                                                                                         |
| -------------- | ---- | --------------------------------------------------------------------------------------------------- |
| `POST /signup` | ❌   | Create account. Body: `firstName`, `lastName`, `email`, `password`. Returns user + sets JWT cookie. |
| `POST /login`  | ❌   | Sign in. Body: `email`, `password`. Returns user + sets JWT cookie.                                 |
| `POST /logout` | ❌   | Clears the JWT cookie.                                                                              |

### Profile Routes — `PATCH /profile`

| Endpoint                  | Auth | Description                                                                                                            |
| ------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `GET /profile/view`       | ✅   | Return the logged-in user's profile.                                                                                   |
| `PATCH /profile/edit`     | ✅   | Update allowed fields (whitelist of 16 fields). Empty/null values clear the field. Body: any subset of allowed fields. |
| `PATCH /profile/password` | ✅   | Change password. Body: `currentPassword`, `newPassword`.                                                               |

### Connection Request Routes — `POST /request`

| Endpoint                                  | Auth | Description                                                                                                          |
| ----------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------- |
| `POST /request/send/:status/:toUserId`    | ✅   | Send `interested` or `ignored` to another user. Duplicates allowed if previous request was rejected (overwrites it). |
| `POST /request/review/:status/:requestId` | ✅   | `accept` or `reject` an incoming `interested` request. Only the recipient can review.                                |
| `POST /request/remove/user/:userId`       | ✅   | Remove a connection in either direction. Deletes the ConnectionRequest document.                                     |

### User Data Routes — `GET /user`

| Endpoint                     | Auth | Description                                                                                         |
| ---------------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| `GET /feed`                  | ✅   | Paginated feed. Query: `?page=1&limit=10` (max 50). Returns users with no prior connection request. |
| `GET /user/connections`      | ✅   | All accepted connections (both directions).                                                         |
| `GET /user/request/recieved` | ✅   | All pending `interested` requests sent to you. Populates sender profile.                            |
| `GET /user/ignored-users`    | ✅   | Users you have ignored.                                                                             |
| `GET /user/:userId`          | ✅   | Public profile for a specific user + connection status between you and them.                        |

## Project Structure

```
src/
├── app.js                  # Express app setup, middleware, route mounting
├── config/
│   └── database.js         # MongoDB connection via Mongoose
├── models/
│   ├── user.js             # User schema (firstName, skills, socialLinks, etc.)
│   └── connectionRequest.js # ConnectionRequest schema (fromUserId, toUserId, status)
├── routes/
│   ├── auth.js             # /signup, /login, /logout
│   ├── profile.js          # /profile/view, /profile/edit, /profile/password
│   ├── request.js          # /request/send, /request/review, /request/remove
│   └── user.js             # /feed, /connections, /requests, /user/:userId
├── middlewares/
│   └── auth.js             # JWT cookie verification, attaches req.user
└── utils/
    └── validation.js       # Signup & password validation helpers
```

## Key Design Decisions

- **Cookie-based auth** — no token headers on the frontend. The JWT is stored in an httpOnly cookie, handled transparently by the browser.
- **Whitelist editing** — `/profile/edit` only accepts an explicit set of fields. Sending anything else returns `"Invalid edit request!"`.
- **Request overwrite** — If you were rejected by a user, you can send another `interested` request — it overwrites the old rejected record rather than erroring.
- **Compound indexes** — `ConnectionRequest` has a compound index on `(fromUserId, toUserId)` for efficient lookups.
- **Self-request guard** — A `pre('save')` hook on ConnectionRequest prevents users from sending requests to themselves.
- **Safe user projection** — All user-listing endpoints use a centralized `SAFE_USER_DATA` field whitelist to never expose sensitive fields like email or password hash.
