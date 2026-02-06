const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const translateRouter = require('./routes/translate');
const dictionaryRouter = require('./routes/dictionary');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/translate', translateRouter);
app.use('/api/dictionary', dictionaryRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🤟 LST Interpreter API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
