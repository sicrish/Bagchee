# Bagchee — Developer Setup

## Prerequisites
- Node.js v18+
- npm v9+
- Git

---

## 1. Clone the repo

```bash
git clone https://github.com/sicrish/Bagchee.git
cd Bagchee
```

---

## 2. Set up the API (Backend)

```bash
cd api
npm install
```

Create a file called `.env` inside the `api/` folder — ask the team lead for the values:

```env
NODE_ENV=development
PORT=3001

DATABASE_URL=
DIRECT_URL=

JWT_SECRET_KEY=
ENCRYPTION_SECRET=

CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

EMAIL_USER=
EMAIL_PASS=

FRONTEND_URL=http://localhost:3000
```

Generate the Prisma client then start the API:

```bash
npx prisma generate
npm run dev
```

API runs at `http://localhost:3001`

---

## 3. Set up the UI (Frontend)

Open a new terminal:

```bash
cd ui
npm install
```

Create a file called `.env` inside the `ui/` folder — ask the team lead for the values:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENCRYPTION_SECRET=
REACT_APP_EXCHANGE_RATE_API_KEY=
REACT_APP_RAZORPAY_KEY_ID=
```

Start the frontend:

```bash
npm start
```

Frontend runs at `http://localhost:3000`

---

## 4. Admin panel

- URL: `http://localhost:3000/admin`
- Credentials: ask the team lead

---

## 5. Deploy changes

Push to GitHub — Railway auto-deploys on every push to `main`:

```bash
git add .
git commit -m "your message"
git push origin main
```

---

## Live URLs

| | URL |
|---|---|
| Website | https://ui-production-cf27.up.railway.app |
| Admin | https://ui-production-cf27.up.railway.app/admin |
| API | https://api-production-b9cb.up.railway.app |

---

## Key notes

- **Database is shared** — everyone connects to the same live Neon PostgreSQL. Coordinate before running any migrations.
- **Never commit `.env` files** — they are gitignored.
- **All API fields are camelCase** (Prisma). If you see old `snake_case` fields, always add both as fallback: `data.firstName || data.firstname`.
- **All POST/PUT/PATCH requests are AES-encrypted** automatically by the Axios interceptor — do not add manual encryption.
- **Images** go to Cloudinary — upload via the admin panel, not by adding files to the repo.
