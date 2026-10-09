import { useMemo, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

import { isValidBarcode } from './lib/barcode';
import { calculateNutrition, NutritionInput } from './lib/nutrition';
import { evaluateSymptomRulesSafe, SymptomInput } from './lib/rules';
import { mockProducts } from './data/products';

export type Tab = 'scanner' | 'nutrition' | 'rules' | 'catalog';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scanner');
  const [barcode, setBarcode] = useState('5901234123457');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const initialNutrition: NutritionInput = {
    ageMonths: 6,
    sex: 'm',
    weightKg: 7,
    heightCm: 67,
    activity: 'moderate',
    norms: 'ru'
  };

  const [nutritionState, setNutritionState] = useState<NutritionInput>(initialNutrition);
  const [nutritionResult, setNutritionResult] = useState<ReturnType<typeof calculateNutrition> | null>(
    calculateNutrition(initialNutrition)
  );

  const [symptoms, setSymptoms] = useState<SymptomInput>({
    hasRedFlags: false,
    cmpaSuspicion: false,
    severeAllergy: false,
    colicAndConstipation: false,
    regurgitation: false,
    lactoseIntolerance: false
  });

  const [ruleResult, setRuleResult] = useState<ReturnType<typeof evaluateSymptomRulesSafe> | null>(
    evaluateSymptomRulesSafe({
      hasRedFlags: false,
      cmpaSuspicion: false,
      severeAllergy: false,
      colicAndConstipation: false,
      regurgitation: false,
      lactoseIntolerance: false
    })
  );

  const filteredProducts = useMemo(() => {
    const lower = search.toLowerCase();

    return mockProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(lower) ||
        product.brand.toLowerCase().includes(lower) ||
        product.category.toLowerCase().includes(lower);

      const matchesCategory = categoryFilter === 'all' || product.categoryCode === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const handleValidateBarcode = () => {
    const validation = isValidBarcode(barcode);

    if (!validation.valid) {
      setScanError(validation.error || 'Ошибка проверки штрихкода');
      setScanResult(null);
      return;
    }

    setScanError('');
    setScanResult(`Штрихкод корректен: ${validation.format}`);
  };

  const handleScanLibrary = async () => {
    if (!videoRef.current) return;

    setIsScanning(true);
    setScanError('');

    const codeReader = new BrowserMultiFormatReader();

    try {
      await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
        if (result) {
          const text = result.getText();
          const validation = isValidBarcode(text);

          if (validation.valid) {
            setBarcode(text);
            setScanResult(`Сканировано: ${text} (${validation.format})`);
            setScanError('');
            setIsScanning(false);
            codeReader.reset();
          } else {
            setScanError(validation.error || 'Не удалось распознать штрихкод');
          }
        }

        if (error && !result) {
          // normal decode loop, ignore non-fatal errors
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось активировать камеру';
      setScanError(`Не удалось активировать камеру: ${message}`);
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  const calculateNutritionForForm = () => {
    const result = calculateNutrition(nutritionState);
    setNutritionResult(result);
  };

  const handleRuleCheck = () => {
    const result = evaluateSymptomRulesSafe(symptoms);
    setRuleResult(result);
  };

  const toggleSymptom = (key: keyof SymptomInput) => {
    setSymptoms((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'scanner', label: 'Сканер' },
    { key: 'nutrition', label: 'КБЖУ' },
    { key: 'rules', label: 'Правила' },
    { key: 'catalog', label: 'Каталог' }
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>Formula Selector</strong>
            <small>Детские смеси и питание</small>
          </div>
        </div>

        <nav className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {activeTab === 'scanner' && (
          <section className="panel">
            <div className="panel-header">
              <h2>Сканер штрихкода</h2>
              <span className="tag">EAN-8 / EAN-13</span>
            </div>

            <div className="scanner-grid">
              <div className="scanner-box">
                <video ref={videoRef} className="video" muted playsInline />
              </div>

              <div className="scanner-controls">
                <label className="label">Штрихкод</label>
                <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Введите штрихкод"
                />

                <div className="button-row">
                  <button type="button" className="primary" onClick={handleValidateBarcode}>
                    Проверить
                  </button>
                  <button type="button" className="secondary" onClick={handleScanLibrary}>
                    {isScanning ? 'Камера активна' : 'Сканировать камерой'}
                  </button>
                  <button type="button" className="ghost" onClick={handleStopScan}>
                    Стоп
                  </button>
                </div>

                {scanResult && <div className="success-box">{scanResult}</div>}
                {scanError && <div className="error-box">{scanError}</div>}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'nutrition' && (
          <section className="panel">
            <div className="panel-header">
              <h2>Калькулятор КБЖУ</h2>
              <span className="tag">IOM / Schofield / РФ</span>
            </div>

            <div className="nutrition-grid">
              <div className="form-grid">
                <label>
                  Возраст, мес
                  <input
                    type="number"
                    value={nutritionState.ageMonths}
                    onChange={(e) =>
                      setNutritionState((prev) => ({
                        ...prev,
                        ageMonths: Number(e.target.value)
                      }))
                    }
                  />
                </label>

                <label>
                  Пол
                  <select
                    value={nutritionState.sex}
                    onChange={(e) =>
                      setNutritionState((prev) => ({
                        ...prev,
                        sex: e.target.value as 'm' | 'f'
                      }))
                    }
                  >
                    <option value="m">Мальчик</option>
                    <option value="f">Девочка</option>
                  </select>
                </label>

                <label>
                  Вес, кг
                  <input
                    type="number"
                    step="0.1"
                    value={nutritionState.weightKg}
                    onChange={(e) =>
                      setNutritionState((prev) => ({
                        ...prev,
                        weightKg: Number(e.target.value)
                      }))
                    }
                  />
                </label>

                <label>
                  Рост, см
                  <input
                    type="number"
                    step="0.1"
                    value={nutritionState.heightCm}
                    onChange={(e) =>
                      setNutritionState((prev) => ({
                        ...prev,
                        heightCm: Number(e.target.value)
                      }))
                    }
                  />
                </label>

                <label>
                  Активность
                  <select
                    value={nutritionState.activity}
                    onChange={(e) =>
                      setNutritionState((prev) => ({
                        ...prev,
                        activity: e.target.value as 'low' | 'moderate' | 'high'
                      }))
                    }
                  >
                    <option value="low">Низкая</option>
                    <option value="moderate">Средняя</option>
                    <option value="high">Высокая</option>
                  </select>
                </label>

                <label>
                  Нормы
                  <select
                    value={nutritionState.norms}
                    onChange={(e) =>
                      setNutritionState((prev) => ({
                        ...prev,
                        norms: e.target.value as 'ru' | 'efsa'
                      }))
                    }
                  >
                    <option value="ru">РФ</option>
                    <option value="efsa">EFSA</option>
                  </select>
                </label>
              </div>

              <div className="result-box">
                <button type="button" className="primary" onClick={calculateNutritionForForm}>
                  Рассчитать
                </button>

                {nutritionResult && (
                  <>
                    <div className="summary-grid">
                      <div>
                        <span>Ккал</span>
                        <strong>{nutritionResult.kcal}</strong>
                      </div>
                      <div>
                        <span>Белок</span>
                        <strong>{nutritionResult.proteinG} г</strong>
                      </div>
                      <div>
                        <span>Жиры</span>
                        <strong>{nutritionResult.fatG} г</strong>
                      </div>
                      <div>
                        <span>Углеводы</span>
                        <strong>{nutritionResult.carbsG} г</strong>
                      </div>
                      <div>
                        <span>BMI</span>
                        <strong>{nutritionResult.bmi}</strong>
                      </div>
                    </div>

                    <div className="micro-list">
                      {nutritionResult.micro.map((item) => (
                        <div key={item.key} className="micro-item">
                          <span>{item.label}</span>
                          <strong>
                            {item.value} {item.unit}
                          </strong>
                        </div>
                      ))}
                    </div>

                    {nutritionResult.warnings.length > 0 && (
                      <div className="warning-box">
                        {nutritionResult.warnings.map((warning, index) => (
                          <div key={index}>⚠️ {warning}</div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'rules' && (
          <section className="panel">
            <div className="panel-header">
              <h2>Клинические правила подбора смеси</h2>
              <span className="tag">Детерминированный алгоритм</span>
            </div>

            <div className="rules-grid">
              <div className="checkbox-list">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={symptoms.hasRedFlags}
                    onChange={() => toggleSymptom('hasRedFlags')}
                  />
                  Красные флаги
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={symptoms.cmpaSuspicion}
                    onChange={() => toggleSymptom('cmpaSuspicion')}
                  />
                  Подозрение на АБКМ
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={symptoms.severeAllergy}
                    onChange={() => toggleSymptom('severeAllergy')}
                  />
                  Тяжёлая аллергия
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={symptoms.colicAndConstipation}
                    onChange={() => toggleSymptom('colicAndConstipation')}
                  />
                  Колики и запоры
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={symptoms.regurgitation}
                    onChange={() => toggleSymptom('regurgitation')}
                  />
                  Частые срыгивания
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={symptoms.lactoseIntolerance}
                    onChange={() => toggleSymptom('lactoseIntolerance')}
                  />
                  Лактозная непереносимость
                </label>
              </div>

              <div className="result-box">
                <button type="button" className="primary" onClick={handleRuleCheck}>
                  Оценить
                </button>

                {ruleResult && (
                  <div
                    className={ruleResult.status === 'EMERGENCY_STOP' ? 'alert danger' : 'alert success'}
                  >
                    <h3>
                      {ruleResult.status === 'EMERGENCY_STOP' ? 'ЭКСТРЕННЫЙ СТОП' : 'Рекомендация'}
                    </h3>

                    {ruleResult.categoryName && (
                      <div className="recommendation-name">{ruleResult.categoryName}</div>
                    )}

                    {ruleResult.alert && <p>{ruleResult.alert}</p>}
                    <p>{ruleResult.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'catalog' && (
          <section className="panel">
            <div className="panel-header">
              <h2>Каталог смесей</h2>
              <span className="tag">{filteredProducts.length} продуктов</span>
            </div>

            <div className="catalog-toolbar">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию, бренду или категории"
              />

              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">Все категории</option>
                <option value="standard">Стандартная</option>
                <option value="comfort">Комфорт</option>
                <option value="ha_phf">Гипоаллергенная</option>
                <option value="ehf">Глубокий гидролизат</option>
                <option value="aaf">Аминокислотная</option>
                <option value="ar">Антирефлюксная</option>
                <option value="lactose_free">Безлактозная</option>
              </select>
            </div>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-top">
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.brand}</small>
                    </div>
                    <span className={`badge ${product.categoryCode}`}>{product.category}</span>
                  </div>

                  <ul className="product-specs">
                    <li>Стадия: {product.stage}</li>
                    <li>Калорийность: {product.kcal} ккал/100мл</li>
                    <li>Белок: {product.protein} г</li>
                    <li>Жиры: {product.fat} г</li>
                    <li>Углеводы: {product.carbs} г</li>
                    <li>Кальций: {product.calcium} мг</li>
                    <li>Железо: {product.iron} мг</li>
                    <li>Витамин D: {product.vitaminD} мкг</li>
                  </ul>

                  {product.barcode && (
                    <div className="barcode-inline">
                      <span>ШК</span>
                      <strong>{product.barcode}</strong>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
