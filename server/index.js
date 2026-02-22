require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.use('/api', routes);
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html')));

app.listen(PORT, () => console.log(`🤝 SkillBank server running on http://localhost:${PORT}`));
