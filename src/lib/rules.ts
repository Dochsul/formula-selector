export interface SymptomInput {
  hasRedFlags: boolean;
  cmpaSuspicion: boolean;
  severeAllergy: boolean;
  colicAndConstipation: boolean;
  regurgitation: boolean;
  lactoseIntolerance: boolean;
}

export interface RuleMatch {
  ruleId: string;
  priority: number;
  categoryCode?: string;
  categoryName?: string;
  alert?: string;
  explanation: string;
}

export interface RuleResult {
  status: 'EMERGENCY_STOP' | 'RECOMMENDATION';
  categoryCode?: string;
  categoryName?: string;
  alert?: string;
  explanation: string;
  matchedRuleId?: string;
  matchedRules?: RuleMatch[];
}

type Rule = {
  id: string;
  priority: number;
  condition: (input: SymptomInput) => boolean;
  categoryCode?: string;
  categoryName?: string;
  alert?: string;
  explanation: string;
};

const rules: Rule[] = [
  {
    id: 'red_flags',
    priority: 1000,
    condition: (input) => !!input.hasRedFlags,
    alert: 'Обнаружены опасные симптомы. Немедленно вызовите врача / скорую.',
    explanation:
      'Обнаружены красные флаги: кровь в стуле, неукротимая рвота, резкая вялость, выраженная дегидратация. Подбор смеси прекращён.'
  },
  {
    id: 'severe_cmpa',
    priority: 900,
    condition: (input) => !!input.cmpaSuspicion && !!input.severeAllergy,
    categoryCode: 'aaf',
    categoryName: 'Аминокислотная смесь (AAF)',
    alert: '⚠️ Гипоаллергенные (ГА) смеси СТРОГО ПРОТИВОПОКАЗАНЫ при тяжёлой АБКМ!',
    explanation:
      'При тяжёлой АБКМ (включая анафилаксию и выраженное поражение ЖКТ) применяются исключительно лечебные смеси на свободных аминокислотах.'
  },
  {
    id: 'cmpa_suspicion',
    priority: 800,
    condition: (input) => !!input.cmpaSuspicion && !input.severeAllergy,
    categoryCode: 'ehf',
    categoryName: 'Глубокий гидролизат (eHF)',
    alert: '⚠️ ГА-смеси НЕ лечат аллергию — они предназначены только для профилактики!',
    explanation:
      'При подозрении на АБКМ стандартом диетотерапии является глубокий гидролизат белка.'
  },
  {
    id: 'reflux',
    priority: 700,
    condition: (input) => !!input.regurgitation,
    categoryCode: 'ar',
    categoryName: 'Антирефлюксная смесь (AR)',
    explanation:
      'Смесь с загустителем (камедь рожкового дерева или крахмал) снижает частоту срыгиваний.'
  },
  {
    id: 'lactose_intolerance',
    priority: 600,
    condition: (input) => !!input.lactoseIntolerance,
    categoryCode: 'lactose_free',
    categoryName: 'Безлактозная / низколактозная смесь',
    explanation:
      'Исключение лактозы помогает снять спазмы и нормализовать стул при лактазной недостаточности.'
  },
  {
    id: 'comfort',
    priority: 500,
    condition: (input) => !!input.colicAndConstipation,
    categoryCode: 'comfort',
    categoryName: 'Смесь категории «Комфорт»',
    explanation:
      'Частично расщепленный белок, сниженное количество лактозы и пребиотики облегчают пищеварение.'
  },
  {
    id: 'default',
    priority: 1,
    condition: () => true,
    categoryCode: 'standard',
    categoryName: 'Стандартная адаптированная смесь',
    explanation:
      'Для здорового ребёнка без клинических проявлений подходит стандартная адаптированная смесь по возрасту.'
  }
];

export function evaluateSymptomRules(input: SymptomInput): RuleResult {
  const matchedRules: RuleMatch[] = [];

  for (const rule of rules) {
    if (rule.condition(input)) {
      matchedRules.push({
        ruleId: rule.id,
        priority: rule.priority,
        categoryCode: rule.categoryCode,
        categoryName: rule.categoryName,
        alert: rule.alert,
        explanation: rule.explanation
      });
    }
  }

  const selectedRule = matchedRules.slice().sort((a, b) => b.priority - a.priority)[0];

  if (!selectedRule) {
    return {
      status: 'RECOMMENDATION',
      categoryCode: 'standard',
      categoryName: 'Стандартная адаптированная смесь',
      explanation: 'Ни одно правило не совпало. Необходима консультация врача.',
      matchedRules: []
    };
  }

  if (selectedRule.ruleId === 'red_flags') {
    return {
      status: 'EMERGENCY_STOP',
      alert: selectedRule.alert,
      explanation: selectedRule.explanation,
      matchedRuleId: selectedRule.ruleId,
      matchedRules
    };
  }

  return {
    status: 'RECOMMENDATION',
    categoryCode: selectedRule.categoryCode,
    categoryName: selectedRule.categoryName,
    alert: selectedRule.alert,
    explanation: selectedRule.explanation,
    matchedRuleId: selectedRule.ruleId,
    matchedRules
  };
}

export function evaluateSymptomRulesSafe(input: SymptomInput): RuleResult {
  if (input.hasRedFlags) {
    return {
      status: 'EMERGENCY_STOP',
      alert: 'Обнаружены красные флаги. Подбор смеси прекращён.',
      explanation: 'Немедленно обратитесь к врачу / скорой помощи.',
      matchedRuleId: 'red_flags',
      matchedRules: []
    };
  }

  return evaluateSymptomRules(input);
}
