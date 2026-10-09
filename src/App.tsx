import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:4000';

type License = {
  id: string;
  userId: string;
  email: string;
  key: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'inactive' | 'expired';
  startedAt: string;
  expiresAt: string;
  createdAt: string;
};

function App() {
  const [mode, setMode] = useState<'register' | 'login' | 'payment'>('register');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('123456');
  const [plan, setPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [license, setLicense] = useState<License | null>(null);

  const register = async () => {
    setError('');
    setMessage('');

    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Registration failed');
      return;
    }

    setMessage(`Пользователь создан: ${data.email}`);
    setMode('login');
  };

  const login = async () => {
    setError('');
    setMessage('');

    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Login failed');
      return;
    }

    if (data.activeLicense) {
      setLicense(data.activeLicense);
      setMessage('Лицензия активна');
    } else {
      setLicense(null);
      setMessage('Лицензия отсутствует. Перейдите к оплате.');
      setMode('payment');
    }
  };

  const requestPayment = async () => {
    setError('');
    setMessage('');

    const res = await fetch(`${API_URL}/api/license/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Payment request failed');
      return;
    }

    setMessage(
      `Сумма: ${data.amount} ${data.currency}. Платёж по тарифу ${data.plan}. Подтвердите оплату через /api/payment/manual-confirm.`
    );
  };

  const confirmPayment = async () => {
    setError('');
    setMessage('');

    const res = await fetch(`${API_URL}/api/payment/manual-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, plan })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Payment confirmation failed');
      return;
    }

    setLicense(data.license);
    setMessage(`Оплата подтверждена. Ваш ключ: ${data.license.key}`);
  };

  const checkLicense = async () => {
    if (!license) {
      setError('Нет активной лицензии');
      return;
    }

    const res = await fetch(
      `${API_URL}/api/license/check?email=${encodeURIComponent(email)}&key=${encodeURIComponent(license.key)}`
    );

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'License invalid');
      return;
    }

    setMessage(`Лицензия активна до ${data.expiresAt}`);
  };

  useEffect(() => {
    setMessage('');
    setError('');
  }, [mode]);

  return (
    <div style={{ maxWidth: 840, margin: '40px auto', fontFamily: 'sans-serif', padding: 16 }}>
      <h1>Formula Selector — License Access</h1>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setMode('register')}>Регистрация</button>
        <button onClick={() => setMode('login')}>Вход</button>
        <button onClick={() => setMode('payment')}>Оплата</button>
      </div>

      {error && (
        <div style={{ background: '#ffe6e6', color: '#8f1d1d', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ background: '#eafaf1', color: '#0d6b3f', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {message}
        </div>
      )}

      {(mode === 'register' || mode === 'login' || mode === 'payment') && (
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 10 }} />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: 10 }}
            />
          </label>

          {mode === 'payment' && (
            <label>
              Тариф
              <select value={plan} onChange={(e) => setPlan(e.target.value as any)} style={{ width: '100%', padding: 10 }}>
                <option value="monthly">Месяц — 499 ₽</option>
                <option value="quarterly">Квартал — 1499 ₽</option>
                <option value="yearly">Год — 3999 ₽</option>
              </select>
            </label>
          )}

          {mode === 'register' && (
            <button style={{ padding: 12, fontWeight: 700 }} onClick={register}>Зарегистрироваться</button>
          )}

          {mode === 'login' && (
            <button style={{ padding: 12, fontWeight: 700 }} onClick={login}>Войти</button>
          )}

          {mode === 'payment' && (
            <>
              <button style={{ padding: 12, fontWeight: 700 }} onClick={requestPayment}>Получить инструкцию оплаты</button>
              <button style={{ padding: 12, fontWeight: 700 }} onClick={confirmPayment}>Подтвердить оплату</button>
              <button style={{ padding: 12, fontWeight: 700 }} onClick={checkLicense}>Проверить лицензию</button>
            </>
          )}
        </div>
      )}

      {license && (
        <div style={{ marginTop: 24, border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h3>Активная лицензия</h3>
          <p><strong>Key:</strong> {license.key}</p>
          <p><strong>Тариф:</strong> {license.plan}</p>
          <p><strong>Статус:</strong> {license.status}</p>
          <p><strong>До:</strong> {license.expiresAt}</p>
        </div>
      )}
    </div>
  );
}

export default App;
