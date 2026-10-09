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

type View = 'auth' | 'dashboard' | 'admin';

export default function App() {
  const [view, setView] = useState<View>('auth');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('123456');
  const [plan, setPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [license, setLicense] = useState<License | null>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchLicense = async (targetEmail: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/licenses/me?email=${encodeURIComponent(targetEmail)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setLicense(null);
        return;
      }

      if (data.licenses && data.licenses.length > 0) {
        const active = data.licenses.find((item: License) => item.status === 'active');
        setLicense(active ?? null);
      } else {
        setLicense(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const register = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setMessage(`Пользователь ${data.email} создан. Теперь войдите.`);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.activeLicense) {
        setLicense(data.activeLicense);
        setView('dashboard');
        setMessage('Лицензия активна. Добро пожаловать.');
      } else {
        setLicense(null);
        setView('dashboard');
        setMessage('Лицензия отсутствует. Выберите тариф и оплатите доступ.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const requestPayment = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/billing/instruction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Payment instruction failed');
      }

      setMessage(
        `Сумма к оплате: ${data.amount} ₽\n\nСчёт: ${data.account}\nИнструкция: ${data.instructions}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment instruction error');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/payment/manual-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Payment confirmation failed');
      }

      setLicense(data.license);
      setMessage(`✅ Оплата подтверждена. Ваш ключ: ${data.license.key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment confirmation error');
    } finally {
      setLoading(false);
    }
  };

  const checkLicense = async () => {
    if (!license) {
      setError('Нет активной лицензии');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/license/check?email=${encodeURIComponent(email)}&key=${encodeURIComponent(license.key)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'License invalid');
      }

      setMessage(`✅ Лицензия активна до ${data.expiresAt}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License check error');
    }
  };

  const loadAdminData = async () => {
    try {
      const [usersRes, paymentsRes, licensesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`),
        fetch(`${API_URL}/api/admin/payments`),
        fetch(`${API_URL}/api/admin/licenses`)
      ]);

      const users = await usersRes.json();
      const payments = await paymentsRes.json();
      const licenses = await licensesRes.json();

      setAdminData({
        users: users.users || [],
        payments: payments.payments || [],
        licenses: licenses.licenses || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (view === 'dashboard' && email) {
      fetchLicense(email);
    }
  }, [view, email]);

  useEffect(() => {
    if (view === 'admin') {
      loadAdminData();
    }
  }, [view]);

  return (
    <div className="page">
      {view === 'auth' && (
        <div className="auth-shell">
          <div className="auth-card">
            <div className="brand-header">
              <div className="brand-mark">F</div>
              <div>
                <h1>Formula Selector</h1>
                <p>Личный доступ к сервису</p>
              </div>
            </div>

            <div className="switcher">
              <button className="switch active">Вход</button>
              <button className="switch" onClick={register}>Регистрация</button>
            </div>

            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="alert danger">{error}</div>}
            {message && <div className="alert success">{message}</div>}

            <div className="button-row">
              <button className="primary" onClick={login} disabled={loading}>
                {loading ? 'Подождите...' : 'Войти'}
              </button>
              <button className="secondary" onClick={register} disabled={loading}>
                Зарегистрироваться
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'dashboard' && (
        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">F</div>
              <div>
                <strong>Formula Selector</strong>
                <small>Личный кабинет</small>
              </div>
            </div>

            <div className="tabs">
              <button className="tab active">Лицензия</button>
              <button className="tab" onClick={() => setView('admin')}>Админ</button>
              <button
                className="tab"
                onClick={() => {
                  setView('auth');
                  setLicense(null);
                  setMessage('');
                  setError('');
                }}
              >
                Выход
              </button>
            </div>
          </header>

          <main className="content">
            <section className="panel">
              <div className="panel-header">
                <h2>Доступ и лицензия</h2>
                <span className="tag">{email}</span>
              </div>

              {error && <div className="alert danger">{error}</div>}
              {message && <div className="alert success">{message}</div>}

              {!license ? (
                <div className="grid">
                  <label className="field">
                    Тариф
                    <select
                      value={plan}
                      onChange={(e) =>
                        setPlan(e.target.value as 'monthly' | 'quarterly' | 'yearly')
                      }
                    >
                      <option value="monthly">Месяц — 499 ₽</option>
                      <option value="quarterly">Квартал — 1499 ₽</option>
                      <option value="yearly">Год — 3999 ₽</option>
                    </select>
                  </label>

                  <div className="stats">
                    <div className="stat">
                      <span>Сумма</span>
                      <strong>
                        {plan === 'monthly'
                          ? '499 ₽'
                          : plan === 'quarterly'
                            ? '1499 ₽'
                            : '3999 ₽'}
                      </strong>
                    </div>
                    <div className="stat">
                      <span>Срок</span>
                      <strong>
                        {plan === 'monthly'
                          ? '30 дней'
                          : plan === 'quarterly'
                            ? '90 дней'
                            : '365 дней'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="license-box">
                  <div className="license-title">Ключ лицензии</div>
                  <div className="license-key-box">
                    <span>{license.key}</span>
                    <button
                      className="ghost"
                      onClick={() => navigator.clipboard.writeText(license.key)}
                    >
                      Копировать
                    </button>
                  </div>

                  <div className="stats" style={{ marginTop: 18 }}>
                    <div className="stat">
                      <span>Тариф</span>
                      <strong>{license.plan}</strong>
                    </div>
                    <div className="stat">
                      <span>Активна до</span>
                      <strong>{new Date(license.expiresAt).toLocaleDateString('ru-RU')}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="button-row" style={{ marginTop: 20 }}>
                {!license && (
                  <>
                    <button className="primary" onClick={requestPayment} disabled={loading}>
                      Получить инструкцию оплаты
                    </button>
                    <button className="secondary" onClick={confirmPayment} disabled={loading}>
                      Подтвердить оплату
                    </button>
                  </>
                )}
                {license && (
                  <button className="primary" onClick={checkLicense}>
                    Проверить лицензию
                  </button>
                )}
              </div>
            </section>
          </main>
        </div>
      )}

      {view === 'admin' && (
        <div className="app-shell admin-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">A</div>
              <div>
                <strong>Админ-панель</strong>
                <small>Управление лицензиями</small>
              </div>
            </div>

            <div className="tabs">
              <button className="tab" onClick={() => setView('dashboard')}>Личный кабинет</button>
              <button className="tab active">Админ</button>
              <button
                className="tab"
                onClick={() => {
                  setView('auth');
                  setLicense(null);
                  setError('');
                  setMessage('');
                }}
              >
                Выход
              </button>
            </div>
          </header>

          <main className="content">
            <section className="panel">
              <div className="panel-header">
                <h2>Пользователи и лицензии</h2>
                <button className="secondary" onClick={loadAdminData}>Обновить</button>
              </div>

              {!adminData ? (
                <div className="loading">Загрузка...</div>
              ) : (
                <>
                  <div className="stats">
                    <div className="stat">
                      <span>Пользователи</span>
                      <strong>{adminData.users.length}</strong>
                    </div>
                    <div className="stat">
                      <span>Платежи</span>
                      <strong>{adminData.payments.length}</strong>
                    </div>
                    <div className="stat">
                      <span>Лицензии</span>
                      <strong>{adminData.licenses.length}</strong>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Статус</th>
                          <th>Ключ</th>
                          <th>Действует до</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.licenses.map((item: any) => (
                          <tr key={item.id}>
                            <td>{item.email}</td>
                            <td>{item.status}</td>
                            <td className="mono">{item.key}</td>
                            <td>{new Date(item.expiresAt).toLocaleDateString('ru-RU')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
