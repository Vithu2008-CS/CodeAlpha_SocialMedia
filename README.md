# Mini Social Media Platform — CodeAlpha Task 2

A full-stack mini social network: register/login, user profiles, posts with images,
comments, likes, and follow/unfollow with a personalized feed.

Built with **Node.js + Express**, **Prisma ORM over SQLite**, **JWT auth + bcrypt**,
and a dependency-free **vanilla HTML/CSS/JS** frontend served by the same Express server.

---

## ✨ Features

- **Authentication** — register & login with hashed passwords (bcrypt) and JWT bearer tokens.
- **User profiles** — avatar, display name, bio; editable for your own profile (modal).
- **Posts** — create text posts with an optional image URL; delete your own posts.
- **Feed** — newest-first, paginated feed of posts from people you follow **plus your own**.
- **Comments** — full comment threads on any post; delete your own comments.
- **Likes** — like/unlike posts with an **optimistic** UI toggle and live counts.
- **Follow system** — follow/unfollow users; view followers & following lists; follower/following counts.
- **Robust API** — JWT-protected write routes, input validation, and a consistent JSON error shape.

---

## 🧱 Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Backend   | Node.js, Express.js (ES modules)                  |
| Database  | SQLite via Prisma ORM                             |
| Auth      | JWT (Authorization: Bearer) + bcryptjs            |
| Frontend  | Vanilla HTML + CSS + JavaScript, Fetch API        |
| Hosting   | Express serves the API **and** the static frontend on one port |

---

## 🚀 Setup & Run

> Requires Node.js 18+ (developed on Node 24).

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env        # Windows: copy .env.example .env

# 3. Create the database & tables (also generates the Prisma client)
npm run migrate             # prisma migrate dev

# 4. Seed demo users, posts, comments, likes & follows
npm run seed

# 5. Start the server
npm run dev
```

Then open **http://localhost:3000**.

### Demo accounts

All seeded users share the password **`password123`**:

| Username | Email               |
| -------- | ------------------- |
| `alice`  | alice@example.com   |
| `bob`    | bob@example.com     |
| `carol`  | carol@example.com   |
| `dave`   | dave@example.com    |

### npm scripts

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Express server                 |
| `npm run migrate` | Run Prisma migrations (creates `dev.db`) |
| `npm run seed`    | Populate demo data                       |
| `npm run reset`   | Drop & recreate the database (then seed) |

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. Protected (✚) routes require
`Authorization: Bearer <token>`. Errors always return `{ "error": "message" }`.

### Auth
| Method | Endpoint            | Description                          |
| ------ | ------------------- | ------------------------------------ |
| POST   | `/auth/register`    | Create account → `{ token, user }`   |
| POST   | `/auth/login`       | Log in (username **or** email)       |
| GET ✚  | `/auth/me`          | Current user                         |

### Users
| Method   | Endpoint                      | Description                                        |
| -------- | ----------------------------- | -------------------------------------------------- |
| GET      | `/users/:username`            | Profile + post/follower/following counts + isFollowing |
| PUT ✚    | `/users/me`                   | Update displayName / bio / avatarUrl               |
| GET      | `/users/:username/posts`      | That user's posts (paginated)                      |
| POST ✚   | `/users/:username/follow`     | Follow a user                                      |
| DELETE ✚ | `/users/:username/follow`     | Unfollow a user                                    |
| GET      | `/users/:username/followers`  | List followers                                     |
| GET      | `/users/:username/following`  | List following                                     |

### Posts
| Method   | Endpoint                  | Description                                                   |
| -------- | ------------------------- | ------------------------------------------------------------ |
| GET ✚    | `/posts`                  | Feed (followed + self), paginated, with likeCount/commentCount/likedByMe |
| POST ✚   | `/posts`                  | Create a post                                                |
| GET      | `/posts/:id`              | Single post                                                  |
| DELETE ✚ | `/posts/:id`              | Delete a post (author only)                                  |
| GET      | `/posts/:id/comments`     | List comments                                                |
| POST ✚   | `/posts/:id/comments`     | Add a comment                                                |
| POST ✚   | `/posts/:id/like`         | Like a post                                                  |
| DELETE ✚ | `/posts/:id/like`         | Unlike a post                                                |

### Comments
| Method   | Endpoint          | Description                       |
| -------- | ----------------- | -------------------------------- |
| DELETE ✚ | `/comments/:id`   | Delete a comment (author only)   |

---

## 🗂️ Project Structure

```
CodeAlpha_SocialMedia/
├── prisma/
│   └── schema.prisma         # User, Post, Comment, Like, Follow models
├── src/
│   ├── server.js             # Express app: API + static hosting + error handler
│   ├── lib/
│   │   ├── prisma.js         # Shared PrismaClient
│   │   ├── http.js           # ApiError + asyncHandler
│   │   ├── validate.js       # Input validation helpers
│   │   ├── tokens.js         # JWT sign/verify
│   │   ├── serialize.js      # Safe DB → JSON shaping
│   │   └── posts.js          # Pagination, like lookups, post serializer
│   ├── middleware/
│   │   └── auth.js           # authRequired / authOptional (JWT)
│   └── routes/
│       ├── auth.js           # register / login / me
│       ├── users.js          # profiles / follow / lists
│       ├── posts.js          # feed / CRUD / comments / likes
│       └── comments.js       # delete comment
├── public/                   # Vanilla frontend (served statically)
│   ├── index.html            # Feed + compose
│   ├── login.html / register.html
│   ├── profile.html          # Profile + edit modal + follow
│   ├── post.html             # Single post + full thread
│   ├── css/style.css
│   └── js/                   # api.js, ui.js, postcard.js + per-page scripts
├── seed.js                   # Demo data
├── .env.example
└── package.json
```

---

## 🧠 Data Model (Prisma / SQLite)

- **User** — `id, username (unique), email (unique), passwordHash, displayName, bio, avatarUrl, createdAt`
- **Post** — `id, authorId→User, content, imageUrl?, createdAt`
- **Comment** — `id, postId→Post, authorId→User, content, createdAt`
- **Like** — `id, postId→Post, userId→User, createdAt` · `@@unique([postId, userId])`
- **Follow** — `id, followerId→User, followingId→User, createdAt` · `@@unique([followerId, followingId])`

---

## ✅ Requirements Mapping — CodeAlpha Task 2

This project implements the **Social Media Platform** task. The spec calls for
*user profiles, posts & comments, like/follow features, and a database for users,
posts, comments and followers.* Here is how each requirement is met:

| CodeAlpha Task 2 Requirement | Where it's implemented |
| ---------------------------- | ---------------------- |
| **User profiles** (create account, profile with avatar/name/bio) | `POST /auth/register`, `GET /auth/me`, `GET /users/:username`, `PUT /users/me`; `register.html`, `profile.html` (with edit modal) |
| **Posts** (users can post content) | `Post` model; `POST /posts`, `GET /posts` (feed), `GET /posts/:id`, `DELETE /posts/:id`; compose box in `index.html` |
| **Comments** (comment on posts) | `Comment` model; `GET/POST /posts/:id/comments`, `DELETE /comments/:id`; inline comments in `postcard.js`, full thread in `post.html` |
| **Like feature** | `Like` model with `@@unique([postId,userId])`; `POST/DELETE /posts/:id/like`; optimistic toggle in `postcard.js` |
| **Follow feature** | `Follow` model with `@@unique([followerId,followingId])`; `POST/DELETE /users/:username/follow`, followers/following lists; feed = followed users + self |
| **Database** for users, posts, comments & followers | Prisma + SQLite schema in `prisma/schema.prisma` (User, Post, Comment, Like, Follow) |
| **Authentication & security** | JWT bearer tokens (`tokens.js`, `middleware/auth.js`), bcrypt password hashing, input validation on every route |

---

## 🔐 Notes on Security & Validation

- Passwords are hashed with **bcrypt** (cost 10) and never returned by the API.
- All **write** routes require a valid JWT; missing/invalid tokens return a clean `401`.
- Every route validates and length-limits its input and returns a consistent
  `{ error }` JSON shape. The frontend escapes all user-generated content to
  prevent stored XSS.
- `.env`, `node_modules`, and `*.db` files are git-ignored.

---

## 📜 License

MIT — built for the CodeAlpha internship (Task 2).
