# 🚀 ClubSphere - Project Review Demo (Standalone Express + Original UI)

This folder (`review-demo/`) contains the complete demonstration setup for your project review / viva.
It is **100% self-contained** inside this directory and does not touch or modify any of your original project files.

---

## 📁 File Structure

```text
review-demo/
├── server.js              # Express.js server (Static file serving, GET/POST routes)
├── public/
│   ├── index.html         # Exact original ClubSphere home page UI + live Express inspector
│   ├── style.css          # Exact original project stylesheet & design tokens
│   └── app.js             # Client-side JavaScript (Theme toggle, live ping, fetch GET/POST)
└── README.md              # Presentation instructions
```

---

## ⚡ How to Run

Open your terminal in the project directory and run:

```bash
node review-demo/server.js
```

Then open your browser at:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🎯 What You Can Show the Reviewer

1. **Exact Original Page UI**:
   - Header & navigation with live Express connection status pill.
   - Hero section with live CSS animated orbit preview and floating card.
   - Proof statistics section (`6 communities`, `3 open opportunities`, `3 upcoming events`).
   - Interest categories cards (Technical, Cultural, Sports, Social).
   - Featured club cards and upcoming events list.
   - Original footer design.

2. **Connecting HTML & CSS to Express.js Server**:
   - Show how Express serves the static assets:
     ```javascript
     app.use(express.static(path.join(__dirname, 'public')));
     ```
   - In `index.html`, `<link rel="stylesheet" href="/style.css">` loads the styling directly through Express.

3. **Dynamic Client <-> Server Communication**:
   - **Live Server Health Check**: Click **"⚡ Ping Express"** to see instant round-trip latency.
   - **GET Request**: Click **"🔄 Fetch Data from Express"** to pull live records via `GET /api/clubs` and see the live JSON in the inspector terminal.
   - **POST Request**: Fill in the **"Quick Register Club"** form and click Submit to send data via `POST /api/clubs`. Express parses the body and returns the newly added record in real time without refreshing the page!
