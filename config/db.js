const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return connectionPromise;
  }

  const uri = process.env.MONGO_URI;
  if (!uri && process.env.VERCEL) {
    throw new Error('MONGO_URI must be configured in the Vercel environment.');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri || 'mongodb://127.0.0.1:27017/clubsphere', {
      serverSelectionTimeoutMS: 10000
    })
      .then((conn) => {
        console.log(`[MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name}`);
        return conn.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
};

mongoose.connection.on('disconnected', () => {
  connectionPromise = null;
});

module.exports = connectDB;
