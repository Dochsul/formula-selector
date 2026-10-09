import { License } from '../types/license';

interface LicenseDisplayProps {
  license: License;
}

export function LicenseDisplay({ license }: LicenseDisplayProps) {
  const expiresDate = new Date(license.expires_at);
  const now = new Date();
  const daysLeft = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1ea97d 0%, #0d7a55 100%)',
      color: 'white',
      borderRadius: 16,
      padding: 24,
      maxWidth: 540,
      margin: '0 auto'
    }}>
      <h3 style={{ marginTop: 0 }}>✅ Лицензия активна</h3>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, opacity: 0.9 }}>ВАШ КЛЮ</p>
        <p style={{
          margin: '0 0 16px',
          fontSize: 20,
          fontWeight: 800,
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          {license.key}
        </p>

        <button
          onClick={() => navigator.clipboard.writeText(license.key)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Скопировать ключ
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, opacity: 0.8 }}>Тариф</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{license.plan === 'monthly' ? 'Месяц' : license.plan === 'quarterly' ? 'Квартал' : 'Год'}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, opacity: 0.8 }}>Статус</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{license.status === 'active' ? '🟢 Активна' : 'Неактивна'}</p>
        </div>
      </div>

      <div>
        <p style={{ margin: '0 0 4px', fontSize: 12, opacity: 0.8 }}>Действует до</p>
        <p style={{ margin: 0, fontWeight: 700 }}>{expiresDate.toLocaleDateString('ru-RU')}</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>({daysLeft} дней осталось)</p>
      </div>
    </div>
  );
}
