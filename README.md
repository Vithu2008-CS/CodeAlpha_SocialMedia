# NexusConnect — Social Media Platform

<div align="center">

**A full-stack social network with premium dark glassmorphism UI, real-time interactions, and full SEO optimization.**

*Built for the CodeAlpha Internship — Task 2*

[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## ✨ Features

### Core Social Features
- **Authentication** — Register & login with hashed passwords (bcrypt) and JWT bearer tokens
- **User Profiles** — Avatar, display name, bio; editable via modal with live preview
- **Posts** — Create text posts with optional image URLs; delete your own posts
- **Feed** — Newest-first, paginated feed of posts from people you follow **plus your own**
- **Comments** — Full comment threads on any post; delete your own comments
- **Likes** — Like/unlike posts with **optimistic** UI toggle, bounce animation, and live counts
- **Follow System** — Follow/unfollow users; view followers & following lists; follower/following counts
- **Search** — Real-time user search from the navbar with instant dropdown results
- **Robust API** — JWT-protected write routes, input validation, and consistent JSON error shape

### v2.0 Premium Enhancements
- 🎨 **Dark Glassmorphism UI** — Frosted glass cards, gradient accents, animated mesh background
- ✨ **Micro-Animations** — Like burst, skeleton loading shimmer, smooth transitions, count-up stats
- 🔍 **SEO Optimized** — Full meta tags, Open Graph, Twitter Cards, semantic HTML5 on every page
- 🔎 **User Search** — Live navbar search with debounced API calls and dropdown results
- 💜 **Animated Like Button** — Bouncing heart with burst CSS animation
- 🔗 **Share Posts** — Copy permalink to clipboard with toast confirmation
- 🖼️ **Image Lightbox** — Click post images to view full-size in a dark overlay
- ♾️ **Infinite Scroll** — Auto-loads next page when scrolling near bottom of feed
- 💀 **Skeleton Loading** — Shimmer placeholder cards instead of plain "Loading…" text
- 👤 **Cover Banner** — Auto-generated gradient from username hash on profiles
- 📊 **Animated Stats** — Profile stat numbers count up from zero with eased animation
- 🗂️ **Tab Navigation** — Posts / Followers / Following tabs on profile pages
- 🔒 **Password Toggle** — Eye icon to show/hide password on auth pages
- 💪 **Password Strength** — Live color bar indicator (weak → strong) on registration
- 📝 **Character Counter** — Live counter with color change as post limit approaches
- ⏰ **Timestamp Tooltips** — Hover on relative time to see exact date
- 🦶 **Global Footer** — Clean footer with tech stack badges on every page
- 🌐 **Google Fonts (Inter)** — Premium modern typography throughout
- ♿ **Accessibility** — ARIA labels, semantic HTML, keyboard navigation

---

## 🧱 Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Backend    | Node.js, Express.js (ES modules)                     |
| Database   | SQLite via Prisma ORM                                |
| Auth       | JWT (Authorization: Bearer) + bcryptjs               |
| Frontend   | Vanilla HTML + CSS + JavaScript, Fetch API           |
| Design     | Glassmorphism, CSS animations, Inter (Google Fonts)  |
| SEO        | Meta tags, Open Graph, Twitter Cards, semantic HTML5 |
| Hosting    | Express serves the API **and** the static frontend on one port |

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

### Search *(New in v2.0)*
| Method | Endpoint          | Description                                |
| ------ | ----------------- | ------------------------------------------ |
| GET    | `/search?q=...`   | Search users by username or display name   |

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
│       ├── comments.js       # delete comment
│       └── search.js         # user search (NEW)
├── public/                   # Premium dark glassmorphism frontend
│   ├── index.html            # Feed + compose (SEO optimized)
│   ├── login.html            # Login with password toggle (SEO)
│   ├── register.html         # Register with strength meter (SEO)
│   ├── profile.html          # Profile + tabs + cover banner (SEO)
│   ├── post.html             # Single post + full thread (SEO)
│   ├── css/style.css         # Dark glassmorphism design system
│   └── js/
│       ├── api.js            # Fetch client + auth storage
│       ├── ui.js             # Navbar, search, toast, lightbox, skeletons
│       ├── postcard.js       # Post card: likes, comments, share, lightbox
│       ├── feed.js           # Infinite scroll feed + skeleton loading
│       ├── profile.js        # Cover banner, animated stats, tabs
│       ├── post.js           # Single post page
│       ├── login.js          # Login + password toggle
│       └── register.js       # Register + strength meter
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

## 🎨 Design System

The frontend uses a custom **dark glassmorphism** design system:

| Element           | Implementation                                        |
| ----------------- | ---------------------------------------------------- |
| Color Palette     | Deep navy (`#0a0e1a`) base with cyan/violet/rose accents |
| Cards             | Frosted glass with `backdrop-filter: blur(16px)`     |
| Typography        | Inter (Google Fonts) — 400/500/600/700/800 weights   |
| Buttons           | Gradient backgrounds with hover lift + glow shadow   |
| Animations        | Like burst, skeleton shimmer, modal slide-in, mesh float |
| Scrollbar         | Custom thin scrollbar matching dark theme            |
| Responsive        | Mobile-first with breakpoints at 380px and 600px     |

---

## 🔍 SEO Implementation

Every page includes:

| SEO Element        | Implementation                              |
| ------------------ | ------------------------------------------- |
| Title Tags         | Unique, descriptive per page                |
| Meta Description   | Compelling summary of page content          |
| Meta Keywords      | Relevant search terms                       |
| Open Graph         | `og:title`, `og:description`, `og:type`, `og:url` |
| Twitter Cards      | `twitter:card`, `twitter:title`, `twitter:description` |
| Canonical URL      | `<link rel="canonical">`                    |
| Semantic HTML      | `<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<footer>` |
| Heading Hierarchy  | Single `<h1>` per page with proper nesting  |
| Favicon            | SVG emoji-based data URI                    |
| Theme Color        | `<meta name="theme-color">` for mobile      |
| ARIA Labels        | All interactive elements have accessibility labels |
| Font Preconnect    | `<link rel="preconnect">` for Google Fonts  |

---

## ✅ Requirements Mapping — CodeAlpha Task 2

This project implements the **Social Media Platform** task. The spec calls for
*user profiles, posts & comments, like/follow features, and a database for users,
posts, comments and followers.* Here is how each requirement is met:

| CodeAlpha Task 2 Requirement | Where it's implemented |
| ---------------------------- | ---------------------- |
| **User profiles** (create account, profile with avatar/name/bio) | `POST /auth/register`, `GET /auth/me`, `GET /users/:username`, `PUT /users/me`; `register.html`, `profile.html` (with edit modal, cover banner, animated stats) |
| **Posts** (users can post content) | `Post` model; `POST /posts`, `GET /posts` (feed), `GET /posts/:id`, `DELETE /posts/:id`; compose box in `index.html` with character counter |
| **Comments** (comment on posts) | `Comment` model; `GET/POST /posts/:id/comments`, `DELETE /comments/:id`; inline comments in `postcard.js`, full thread in `post.html` |
| **Like feature** | `Like` model with `@@unique([postId,userId])`; `POST/DELETE /posts/:id/like`; optimistic toggle with bounce animation in `postcard.js` |
| **Follow feature** | `Follow` model with `@@unique([followerId,followingId])`; `POST/DELETE /users/:username/follow`, followers/following tabs; feed = followed users + self |
| **Database** for users, posts, comments & followers | Prisma + SQLite schema in `prisma/schema.prisma` (User, Post, Comment, Like, Follow) |
| **Authentication & security** | JWT bearer tokens (`tokens.js`, `middleware/auth.js`), bcrypt password hashing, input validation on every route, password strength meter |

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
