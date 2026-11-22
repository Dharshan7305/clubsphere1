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

### Demo logins

These accounts are created by `npm run seed`. Use the email address as the username.

| Role | Username | Password |
|---|---|---|
| Student | `student@college.ac.in` | `password123` |
| Core Member | `core@college.ac.in` | `password123` |
| Faculty Advisor | `faculty@college.ac.in` | `password123` |
| Admin | `admin@college.ac.in` | `password123` |

Each club has its own secretary account. The secretary username is `secretary.<club-code>@college.ac.in`, where `<club-code>` is lowercase; all secretary passwords are `password123`.

| Club | Username | Password |
|---|---|---|
| Tech Music (TM) | `secretary.tm@college.ac.in` | `password123` |
| Tamil Mandram (TMN) | `secretary.tmn@college.ac.in` | `password123` |
| Dramatics Club (DC) | `secretary.dc@college.ac.in` | `password123` |
| Fine Arts Club (FAC) | `secretary.fac@college.ac.in` | `password123` |
| CAP & Nature Club (CNC) | `secretary.cnc@college.ac.in` | `password123` |
| English Literary Society (ELS) | `secretary.els@college.ac.in` | `password123` |
| Youth Red Cross Society (YRC) | `secretary.yrc@college.ac.in` | `password123` |
| Martial Arts Club (MAC) | `secretary.mac@college.ac.in` | `password123` |
| Rotaract Club (RC) | `secretary.rc@college.ac.in` | `password123` |
| Entrepreneurs Club (EC) | `secretary.ec@college.ac.in` | `password123` |
| Astronomy Club (AC) | `secretary.ac@college.ac.in` | `password123` |
| Pathshala Club (PC) | `secretary.pc@college.ac.in` | `password123` |
| Global Leaders Forum (GLF) | `secretary.glf@college.ac.in` | `password123` |
| International Education Cell (IEC) | `secretary.iec@college.ac.in` | `password123` |
| Animal Welfare Club (AWC) | `secretary.awc@college.ac.in` | `password123` |
| Women in Development Cell (WDC) | `secretary.wdc@college.ac.in` | `password123` |
| Association of Serious Quizzers (ASQ) | `secretary.asq@college.ac.in` | `password123` |
| Student Research Council (SRC) | `secretary.src@college.ac.in` | `password123` |
| Industry (Alumni) Interaction Forum (IIF) | `secretary.iif@college.ac.in` | `password123` |
| Radio Hub (RH) | `secretary.rh@college.ac.in` | `password123` |
| Book Readers Club (BRC) | `secretary.brc@college.ac.in` | `password123` |
| PSG Tech Chronicle Club (PTC) | `secretary.ptc@college.ac.in` | `password123` |
| Youth Outreach Club (YOC) | `secretary.yoc@college.ac.in` | `password123` |
| Artificial Intelligence & Robotics Club (AIR) | `secretary.air@college.ac.in` | `password123` |
| Aeromodelling Club (AMC) | `secretary.amc@college.ac.in` | `password123` |
| Finverse Club (FC) | `secretary.fc@college.ac.in` | `password123` |
| SPIC-MACAY Heritage Club (SMHC) | `secretary.smhc@college.ac.in` | `password123` |
| Anti Drug Club (ADC) | `secretary.adc@college.ac.in` | `password123` |
| Yuva Tourism Club (YTC) | `secretary.ytc@college.ac.in` | `password123` |
| Cyber Security Club (CSC) | `secretary.csc@college.ac.in` | `password123` |

These are development/demo credentials only. Do not use them in production. **Seeding deletes existing application data** in the configured database, so only run it against a disposable development database.

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
