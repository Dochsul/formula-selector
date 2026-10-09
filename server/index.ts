import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

// In-memory storage (replace with Supabase in production)
const USERS: Array<{
  id: string;
  email: string;
  password: string;
  createdAt: string;
}> = [];

const LICENSES: Array<{
  id: string;
  userId: string;
  email: string;
  key: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'inactive' | 'expired';
  startedAt: string;
  expiresAt: string;
  createdAt: string;
}> = [];

const PAYMENTS: Array<{
  id: string;
  userId: string;
  email: string;
  amount: number;
  currency: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  status: 'pending' | 'paid' | 'rejected';
  createdAt: string;
  confirmedAt?: string;
}> = [];

const PLAN_PRICE = {
  monthly: 499,
  quarterly: 1499,
  yearly: 3999
};

const addDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'formula-selector-license-backend' });
});

app.post('/api/register', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existing = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
    password,
    createdAt: new Date().toISOString()
  };

  USERS.push(user);

  return res.status(201).json({
    id: user.id,
    email: user.email,
    message: 'User created successfully'
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = USERS.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === String(password)
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const activeLicense = LICENSES.find(
    (license) => license.userId === user.id && license.status === 'active'
  );

  return res.json({
    user: { id: user.id, email: user.email },
    hasActiveLicense: !!activeLicense,
    activeLicense: activeLicense ?? null
  });
});

app.get('/api/licenses/me', (req, res) => {
  const email = String(req.query.email ?? '').toLowerCase();

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = USERS.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const licenses = LICENSES.filter((license) => license.userId === user.id);

  return res.json({ user: { id: user.id, email: user.email }, licenses });
});

app.post('/api/payment/manual-confirm', (req, res) => {
  const { email, plan } = req.body ?? {};

  if (!email || !plan) {
    return res.status(400).json({ error: 'Email and plan are required' });
  }

  const normalizedPlan = String(plan).toLowerCase();
  const validPlans = ['monthly', 'quarterly', 'yearly'];

  if (!validPlans.includes(normalizedPlan)) {
    return res.status(400).json({ error: 'Unsupported plan' });
  }

  const user = USERS.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found. Please register first.' });
  }

  const record = {
    id: randomUUID(),
    userId: user.id,
    email: user.email,
    amount: PLAN_PRICE[normalizedPlan as keyof typeof PLAN_PRICE],
    currency: 'RUB',
    plan: normalizedPlan as 'monthly' | 'quarterly' | 'yearly',
    status: 'paid' as const,
    createdAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString()
  };

  PAYMENTS.push(record);

  const existingActive = LICENSES.find(
    (l) => l.userId === user.id && l.status === 'active'
  );

  const now = new Date();
  const durationDays = normalizedPlan === 'monthly' ? 30 : normalizedPlan === 'quarterly' ? 90 : 365;

  const license = {
    id: randomUUID(),
    userId: user.id,
    email: user.email,
    key: `FS-${randomUUID().slice(0, 12).toUpperCase()}`,
    plan: normalizedPlan as 'monthly' | 'quarterly' | 'yearly',
    status: 'active' as const,
    startedAt: now.toISOString(),
    expiresAt: addDays(durationDays),
    createdAt: now.toISOString()
  };

  if (existingActive) {
    existingActive.status = 'expired';
  }

  LICENSES.push(license);

  return res.status(201).json({
    payment: record,
    license,
    message: 'Payment confirmed and license activated successfully.'
  });
});

app.post('/api/license/request', (req, res) => {
  const { email, plan } = req.body ?? {};

  if (!email || !plan) {
    return res.status(400).json({ error: 'Email and plan are required' });
  }

  const user = USERS.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found. Please register first.' });
  }

  const validPlans = ['monthly', 'quarterly', 'yearly'];
  const normalizedPlan = String(plan).toLowerCase();

  if (!validPlans.includes(normalizedPlan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const amount = PLAN_PRICE[normalizedPlan as keyof typeof PLAN_PRICE];

  return res.json({
    email: user.email,
    plan: normalizedPlan,
    amount,
    currency: 'RUB',
    billingInstruction: 'Please pay the amount to the provided personal account and then confirm payment via /api/payment/manual-confirm',
    status: 'waiting_for_payment'
  });
});

app.get('/api/license/check', (req, res) => {
  const email = String(req.query.email ?? '').toLowerCase();
  const key = String(req.query.key ?? '');

  if (!email || !key) {
    return res.status(400).json({ error: 'Email and key are required' });
  }

  const license = LICENSES.find(
    (l) => l.email === email.toLowerCase() && l.key === key && l.status === 'active'
  );

  if (!license) {
    return res.status(403).json({ valid: false, message: 'License is not active or key is invalid' });
  }

  const expiresAt = new Date(license.expiresAt);
  const now = new Date();

  if (expiresAt < now) {
    license.status = 'expired';
    return res.status(403).json({ valid: false, message: 'License expired' });
  }

  return res.json({
    valid: true,
    email: license.email,
    plan: license.plan,
    key: license.key,
    expiresAt: license.expiresAt
  });
});

// Admin endpoints
app.get('/api/admin/payments', (_req, res) => {
  return res.json({ payments: PAYMENTS });
});

app.get('/api/admin/licenses', (_req, res) => {
  return res.json({ licenses: LICENSES });
});

app.get('/api/admin/users', (_req, res) => {
  return res.json({ users: USERS.map(u => ({ id: u.id, email: u.email, createdAt: u.createdAt })) });
});

app.listen(port, () => {
  console.log(`License backend running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
