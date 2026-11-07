console.log('Start');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    return res.status(200).json({ status: 'OK' })
    } catch (error) {
    res.status(500).json({ status: 'Error', error: error.message });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});