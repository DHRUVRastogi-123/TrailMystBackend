// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db.js');
const authRoutes = require('./routes/authRoutes.js');
const riddleRoutes = require('./routes/riddleRoutes.js');
const playRoutes = require('./routes/playRoutes.js');
const taskRoutes = require('./routes/taskRoutes.js');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/riddles', riddleRoutes);
app.use('/api/play', playRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.send("🎉 LocaLoot++ Backend Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
