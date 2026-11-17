# ClubSphere

ClubSphere is a student club discovery and campus activities platform. Students can browse clubs, apply for recruitment drives, register for events, and track their activity. Club teams and college staff manage clubs, applications, events, and approvals through role-based portals.

## Features

- Browse, search, and filter campus clubs.
- Publish and manage recruitment drives with faculty approval.
- Submit and review student applications.
- Create campus events and manage registrations and attendance.
- Send targeted and campus-wide notifications.
- Provide separate dashboards for students, club secretaries, core members, faculty, principals, and administrators.

## Technology

- Node.js and Express
- MongoDB with Mongoose
- EJS templates
- HTML, CSS, and vanilla JavaScript
- Express sessions and bcrypt password hashing

## Requirements

- Node.js and npm
- MongoDB running locally, or a reachable hosted MongoDB database

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local environment file from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `MONGO_URI` to your MongoDB connection string and replace `SESSION_SECRET` with a long, random value. Keep `.env` private; it is excluded from Git.

3. Start the server:

   ```sh
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Sample data

`npm run seed` creates sample clubs, events, recruitments, notifications, and role-based accounts. **Seeding deletes existing application data in the configured database before creating the samples.** Only run it against a disposable development database.

## Main routes

| Route | Purpose |
|---|---|
| `/` | Home page |
| `/auth` | Registration, login, and logout |
| `/clubs` | Club discovery and club details |
| `/events` | Campus event listings and details |
| `/student` | Student dashboard and applications |
| `/secretary` | Club management and recruitment workflows |
| `/core` | Core team dashboard and event participants |
| `/faculty` | Faculty review and approval tools |
| `/principal` | Principal dashboard and approvals |
| `/admin` | Administrative management and reports |
| `/notifications` | Notification center |

## Deploy to Vercel

Configure `MONGO_URI` to use a hosted MongoDB database that Vercel can reach, and set a strong `SESSION_SECRET` in the Vercel project's Environment Variables. Ensure the database provider allows connections from the deployment and redeploy after changing environment variables. Do not commit credentials or environment files.

## Project layout

```text
config/       Database connection and club data
middleware/   Authentication and authorization
models/       Mongoose schemas
public/       Stylesheets, browser JavaScript, and static assets
routes/       Express route handlers
services/     Shared application services
views/        EJS page templates and partials
server.js     Express application entry point
seed.js       Development sample-data script
```

The `navigation/` and `review-demo/` folders are standalone previews and are separate from the main application.
