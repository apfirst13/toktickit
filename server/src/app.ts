import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import authRoutes from './routes/auth.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import staffRoutes from './routes/staff.routes.js';
import usersRoutes from './routes/users.routes.js';
import actionsTakenRoutes from './routes/actions-taken.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tickets/:id/actions', actionsTakenRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('TokTickIT API is running!');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'TokTickIT API' });
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/requesters', async (req, res) => {
  try {
    const requesters = await prisma.user.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    res.status(200).json(requesters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch requesters' });
  }
});

app.get('/api/systems', async (req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({ orderBy: { id: 'asc' } });
    res.status(200).json(systems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch systems' });
  }
});

export { app };
export default app;
