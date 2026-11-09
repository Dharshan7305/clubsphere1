/**
 * ==============================================================================
 * EXPRESS.JS DUMMY SERVER - HTML & CSS CONNECTION DEMO
 * Project: ClubSphere Review Demo
 * Purpose: Connects Frontend (HTML, CSS, JS) with Express.js Backend Server
 * ==============================================================================
 */

const express = require('express');
const path = require('path');

// 1. Initialize Express Application
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middleware to parse incoming request data
// Allows Express to parse JSON bodies from AJAX / fetch() calls
app.use(express.json());
// Allows Express to parse URL-encoded form submissions from HTML forms
app.use(express.urlencoded({ extended: true }));

// 3. Serve Static Files (HTML, CSS, Client JavaScript, Images)
// Any file inside the 'public' directory is accessible directly from the browser
// e.g., http://localhost:5000/style.css or http://localhost:5000/app.js
app.use(express.static(path.join(__dirname, 'public')));

// 4. In-Memory Dummy Data (Simulating a database for the review)
let clubs = [
  { id: 1, name: 'Coding Club', category: 'Technical', members: 120, lead: 'Aarav Sharma' },
  { id: 2, name: 'Robotics & AI', category: 'Technical', members: 85, lead: 'Priya Patel' },
  { id: 3, name: 'Rotaract Club', category: 'Social & Cultural', members: 210, lead: 'Dharshan S' },
  { id: 4, name: 'Music & Fine Arts', category: 'Cultural', members: 95, lead: 'Ananya Rao' }
];

// ==============================================================================
// ROUTES
// ==============================================================================

/**
 * Route: GET /
 * Purpose: Serves the primary HTML file
 * Note: express.static also automatically serves index.html at root,
 * but this explicit route demonstrates how to send an HTML file using res.sendFile().
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Route: GET /api/status
 * Purpose: Health check endpoint to demonstrate Server <-> Client connection
 */
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Express Server is connected and active!',
    timestamp: new Date().toISOString(),
    serverInfo: {
      framework: 'Express.js v4',
      nodeVersion: process.version,
      port: PORT,
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
});

/**
 * Route: GET /api/clubs
 * Purpose: Returns dummy JSON data from the Express server to the HTML page
 */
app.get('/api/clubs', (req, res) => {
  res.status(200).json({
    success: true,
    count: clubs.length,
    data: clubs
  });
});

/**
 * Route: POST /api/clubs
 * Purpose: Receives new data from an HTML form / fetch POST request,
 *          adds it to the server state, and returns the updated record.
 */
app.post('/api/clubs', (req, res) => {
  const { name, category, lead, members } = req.body;

  // Simple validation
  if (!name || !category || !lead) {
    return res.status(400).json({
      success: false,
      message: 'Please provide club name, category, and student lead.'
    });
  }

  const newClub = {
    id: clubs.length + 1,
    name: name.trim(),
    category: category.trim(),
    lead: lead.trim(),
    members: parseInt(members, 10) || 1
  };

  clubs.push(newClub);

  res.status(201).json({
    success: true,
    message: `Club "${newClub.name}" added successfully to Express server memory!`,
    data: newClub,
    totalClubs: clubs.length
  });
});

/**
 * Route: POST /api/contact
 * Purpose: Demonstrates handling standard contact/feedback submissions
 */
app.post('/api/contact', (req, res) => {
  const { studentName, email, message } = req.body;
  console.log(`[Form Submission Received] From: ${studentName} (${email}): "${message}"`);
  
  res.status(200).json({
    success: true,
    message: `Thank you ${studentName || 'Student'}, your message reached the Express server!`
  });
});

// ==============================================================================
// 404 & ERROR HANDLING MIDDLEWARE
// ==============================================================================

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this Express server.`
  });
});

// ==============================================================================
// SERVER START
// ==============================================================================
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Express Server successfully started!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📁 Serving HTML & CSS from: ${path.join(__dirname, 'public')}`);
  console.log(`✅ Ready for Project Review Demonstration`);
  console.log(`======================================================\n`);
});
