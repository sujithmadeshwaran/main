import dotenv from 'dotenv';
// Configure dotenv first
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SERVER] SkillForge LMS Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
