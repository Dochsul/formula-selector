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

type AppMode = 'auth' | 'dashboard' | 'admin';

export default function App() {
  const [mode, setMode] = useState<AppMode>('auth');
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
      const response = await fetch(`${API_URL}/api/licenses/me?email=${encodeURIComponent(targetEmail)}`);
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
        throw new Error(data.error || 'Не удалось зарегистрироваться');
      }

      setMessage(`Пользователь ${data.email} создан. Теперь войдите в систему.`);
      setMode('auth');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
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
        throw new Error(data.error || 'Ошибка входа');
      }

      if (data.activeLicense) {
        setLicense(data.activeLicense);
        setMode('dashboard');
        setMessage('Лицензия активна. Добро пожаловать.');
      } else {
        setLicense(null);
        setMode('dashboard');
        setMessage('Лицензия не активна. Выберите тариф и оплатите доступ.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
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
        throw new Error(data.error || 'Не удалось получить инструкцию оплаты');
      }

      setMessage(
        `Сумма к оплате: ${data.amount} ₽.\n\nСчёт: ${data.account}\nИнструкция: ${data.instructions}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка получения инструкции');
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
        throw new Error(data.error || 'Не удалось подтвердить оплату');
      }

      setLicense(data.license);
      setMessage(`✅ Оплата подтверждена. Ваш ключ: ${data.license.key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подтверждения оплаты');
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
      const response = await fetch(`${API_URL}/api/license/check?email=${encodeURIComponent(email)}&key=${encodeURIComponent(license.key)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Лицензия не действительна');
      }

      setMessage(`✅ Лицензия активна до ${data.expiresAt}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки лицензии');
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
    if (mode === 'dashboard' && email) {
      fetchLicense(email);
    }
  }, [mode, email]);

  useEffect(() => {
    if (mode === 'admin') {
      loadAdminData();
    }
  }, [mode]);

  const authCard = (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">F</div>
          <div>
            <h1>Formula Selector</h1>
            <p>Личный доступ к сервису</p>
          </div>
        </div>

        <div className="switcher">
          <button className={mode === 'auth' ? 'switch active' : 'switch'} onClick={() => setMode('auth')}>
            Вход
          </button>
          <button className="switch" onClick={() => setMode('auth')}>
            Регистрация
          </button>
        </div>

        <div className="form-grid single">
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </div>

        {error && <div className="alert danger"><strong>Ошибка:</strong> {error}</div>}
        {message && <div className="alert success"><strong>Уведомление:</strong> {message}</div>}

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
  );

  const dashboardCard = (
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
          <button className="tab active" onClick={() => setMode('dashboard')}>Лицензия</button>
          <button className="tab" onClick={() => setMode('admin')}>Админ</button>
          <button className="tab" onClick={() => { setMode('auth'); setLicense(null); setMessage(''); setError(''); }}>
            Выход
          </button>
        </div>
      </header>

      <div className="content">
        <section className="panel">
          <div className="panel-header">
            <h2>Доступ и лицензия</h2>
            <span className="tag">{email}</span>
          </div>

          {error && <div className="alert danger"><strong>Ошибка:</strong> {error}</div>}
          {message && <div className="alert success"><strong>Уведомление:</strong> {message}</div>}

          {!license ? (
            <div className="form-grid">
              <label>
                Тариф
                <select value={plan} onChange={(e) => setPlan(e.target.value as 'monthly' | 'quarterly' | 'yearly')}>
                  <option value="monthly">Месяц — 499 ₽</option>
                  <option value="quarterly">Квартал — 1499 ₽</option>
                  <option value="yearly">Год — 3999 ₽</option>
                </select>
              </label>
              <div className="summary-grid">
                <div>
                  <span>Сумма</span>
                  <strong>{plan === 'monthly' ? '499 ₽' : plan === 'quarterly' ? '1499 ₽' : '3999 ₽'}</strong>
                </div>
                <div>
                  <span>Срок</span>
                  <strong>{plan === 'monthly' ? '30 дней' : plan === 'quarterly' ? '90 дней' : '365 дней'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="success-box">
              <div className="recommendation-name">Ключ лицензии</div>
              <div className="barcode-inline">
                <span>{license.key}</span>
                <button className="ghost" onClick={() => navigator.clipboard.writeText(license.key)}>Копировать</button>
              </div>
              <div className="summary-grid" style={{ marginTop: 16 }}>
                <div>
                  <span>Тариф</span>
                  <strong>{license.plan}</strong>
                </div>
                <div>
                  <span>Активна до</span>
                  <strong>{new Date(license.expiresAt).toLocaleDateString('ru-RU')}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="button-row" style={{ marginTop: 18 }}>
            {!license && (
              <>
                <button className="primary" onClick={requestPayment} disabled={loading}>Получить инструкцию оплаты</button>
                <button className="secondary" onClick={confirmPayment} disabled={loading}>Подтвердить оплату</button>
              </>
            )}
            {license && <button className="primary" onClick={checkLicense}>Проверить лицензию</button>}
          </div>
        </section>
      </div>
    </div>
  );

  const adminCard = (
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
          <button className="tab" onClick={() => setMode('dashboard')}>Личный кабинет</button>
          <button className="tab active" onClick={() => setMode('admin')}>Админ</button>
          <button className="tab" onClick={() => { setMode('auth'); setLicense(null); setMessage(''); setError(''); }}>Выход</button>
        </div>
      </header>

      <div className="content admin-content">
        <section className="panel">
          <div className="panel-header">
            <h2>Пользователи</h2>
            <button className="secondary" onClick={loadAdminData}>Обновить</button>
          </div>

          {!adminData ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <div>
              <div className="stat-grid">
                <div className="stat-card">
                  <span>Пользователи</span>
                  <strong>{adminData.users.length}</strong>
                </div>
                <div className="stat-card">
                  <span>Платежи</span>
                  <strong>{adminData.payments.length}</strong>
                </div>
                <div className="stat-card">
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
                      <th>Дата</th>
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
            </div>
          )}
        </section>
      </div>
    </div>
  );

  return mode === 'auth' ? authCard : mode === 'dashboard' ? dashboardCard : adminCard;
}
