export interface NutritionInput {
  ageMonths: number;
  sex: 'm' | 'f';
  weightKg: number;
  heightCm: number;
  activity: 'low' | 'moderate' | 'high';
  hasCondition?: boolean;
  norms?: 'ru' | 'efsa';
}

export interface MicronutrientNorm {
  key: string;
  label: string;
  unit: string;
  value: number;
}

export interface NutritionResult {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  bmi: number;
  micro: MicronutrientNorm[];
  warnings: string[];
}

export function calculateNutrition(input: NutritionInput): NutritionResult {
  const { ageMonths, sex, weightKg, heightCm, activity, norms = 'ru' } = input;
  const warnings: string[] = [];

  if (ageMonths < 6) {
    warnings.push(
      'До 6 месяцев основное питание — грудное молоко или смесь. Количество смеси определяет педиатр.'
    );
  }

  if (input.hasCondition) {
    warnings.push(
      'При хронических заболеваниях и аллергии индивидуальный рацион подбирает только врач.'
    );
  }

  let kcal = 0;

  if (ageMonths < 36) {
    const growthKcal =
      ageMonths <= 3 ? 175 : ageMonths <= 6 ? 56 : ageMonths <= 12 ? 22 : 20;

    kcal = Math.round(89 * weightKg - 100 + growthKcal);
  } else {
    let bmr = 0;
    const ageYears = ageMonths / 12;

    if (ageYears <= 10) {
      bmr = sex === 'm' ? 22.706 * weightKg + 504.3 : 20.315 * weightKg + 485.9;
    } else {
      bmr = sex === 'm' ? 17.686 * weightKg + 658.2 : 13.384 * weightKg + 692.6;
    }

    const pal = activity === 'low' ? 1.4 : activity === 'high' ? 1.8 : 1.6;
    kcal = Math.round(bmr * pal);
  }

  let proteinG = 0;

  if (ageMonths <= 12) {
    proteinG = Math.round(weightKg * 1.5 * 10) / 10;
  } else if (ageMonths <= 36) {
    proteinG = 36;
  } else if (ageMonths <= 84) {
    proteinG = 54;
  } else {
    proteinG = Math.round(weightKg * 1.2 * 10) / 10;
  }

  const fatPercent = ageMonths < 12 ? 0.4 : 0.3;
  const fatG = Math.round((kcal * fatPercent) / 9);
  const carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);

  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Math.round((weightKg / (heightM * heightM)) * 10) / 10 : 0;

  const micro: MicronutrientNorm[] = [
    {
      key: 'calcium',
      label: 'Кальций',
      unit: 'мг',
      value:
        ageMonths <= 3
          ? 400
          : ageMonths <= 6
          ? 500
          : ageMonths <= 12
          ? 600
          : ageMonths <= 36
          ? 800
          : ageMonths <= 84
          ? 900
          : 1100
    },
    {
      key: 'iron',
      label: 'Железо',
      unit: 'мг',
      value: ageMonths <= 3 ? 4 : ageMonths <= 12 ? 7 : ageMonths <= 84 ? 10 : 12
    },
    {
      key: 'iodine',
      label: 'Йод',
      unit: 'мкг',
      value: ageMonths <= 12 ? 60 : ageMonths <= 36 ? 70 : ageMonths <= 84 ? 100 : 120
    },
    {
      key: 'vitamin_d',
      label: 'Витамин D',
      unit: 'мкг',
      value: norms === 'ru' ? 10 : 15
    },
    {
      key: 'vitamin_c',
      label: 'Витамин C',
      unit: 'мг',
      value: ageMonths <= 6 ? 30 : ageMonths <= 12 ? 35 : ageMonths <= 36 ? 45 : 50
    }
  ];

  return {
    kcal,
    proteinG,
    fatG,
    carbsG,
    bmi,
    micro,
    warnings
  };
}
