import { useState } from 'react';
import { PLAN_PRICES } from '../types/license';

interface LicenseFormProps {
  email: string;
  onPaymentRequested: (plan: string, amount: number) => void;
  onPaymentConfirmed: (plan: string) => void;
  loading?: boolean;
}

export function LicenseForm({ email, onPaymentRequested, onPaymentConfirmed, loading }: LicenseFormProps) {
  const [plan, setPlan] = useState<keyof typeof PLAN_PRICES>('monthly');

  const amount = PLAN_PRICES[plan];

  return (
    <div style={{
      background: '#f9fbff',
      border: '1px solid #dfe7f3',
      borderRadius: 16,
      padding: 24,
      maxWidth: 540,
      margin: '0 auto'
    }}>
      <h3 style={{ marginTop: 0 }}>Выберите тариф</h3>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
          <input
            type="radio"
            value="monthly"
            checked={plan === 'monthly'}
            onChange={(e) => setPlan(e.target.value as any)}
          />
          {' '}Месяц — {PLAN_PRICES.monthly} ₽
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
          <input
            type="radio"
            value="quarterly"
            checked={plan === 'quarterly'}
            onChange={(e) => setPlan(e.target.value as any)}
          />
          {' '}Квартал — {PLAN_PRICES.quarterly} ₽
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
          <input
            type="radio"
            value="yearly"
            checked={plan === 'yearly'}
            onChange={(e) => setPlan(e.target.value as any)}
          />
          {' '}Год — {PLAN_PRICES.yearly} ₽
        </label>
      </div>

      <div style={{
        background: '#edf3ff',
        border: '1px solid #dfe7f3',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20
      }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#5a6476' }}>СУММА К ОПЛАТЕ</p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1e6ef2' }}>{amount} ₽</p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#5a6476' }}>на счёт {email}</p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <button
          onClick={() => onPaymentRequested(plan, amount)}
          disabled={loading}
          style={{
            background: '#1e6ef2',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: 14,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Получить инструкцию оплаты
        </button>
        <button
          onClick={() => onPaymentConfirmed(plan)}
          disabled={loading}
          style={{
            background: '#1ea97d',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: 14,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Я оплатил(а). Активировать лицензию
        </button>
      </div>
    </div>
  );
}
