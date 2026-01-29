# Investmate

A minimal platform connecting startups with investors.

## Features

- **For Startups**: Register, create profile, showcase your idea, and receive investor interest
- **For Investors**: Browse startups, filter by industry/stage, and express interest
- **Connection System**: Investors request → Startups accept/reject → Contact info revealed

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (HTTP-only cookies)
- **Styling**: Tailwind CSS

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── api/           # API routes (auth, startups, connections)
├── startup/       # Startup pages (login, register, dashboard)
├── investor/      # Investor pages (login, register, dashboard)
└── page.js        # Home page

models/            # Mongoose schemas (User, Startup, Investor, Connection)
lib/               # Database connection
```
