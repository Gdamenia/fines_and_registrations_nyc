// Server-side language support: which languages exist, and the texts the server itself
// writes (notification titles/bodies) in each of them.
// Keep SUPPORTED_LANGUAGES in sync with mobile/src/strings.ts (APP_LANGUAGES) and the
// CHECK constraint in migrations/0005_user_language.sql.

const SUPPORTED_LANGUAGES = ['en', 'ru', 'ka', 'es'];

/** Returns a supported language code, or null for anything else (incl. empty). */
function normalizeLanguage(value) {
  const code = String(value || '').trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : null;
}

// Raw NYC DOF violation descriptions -> translated labels. Copied from
// mobile/src/i18n.ts (VIOLATION_NAMES) so alerts name a violation the same way the app
// does; anything not listed falls back to the original English text.
const VIOLATION_NAMES = {
  'NO PARKING-STREET CLEANING': {
    ru: 'Стоянка запрещена — уборка улицы',
    ka: 'პარკინგი აკრძალულია — ქუჩის დასუფთავება',
    es: 'Prohibido estacionar — limpieza de calles',
  },
  'NO PARKING-DAY/TIME LIMITS': {
    ru: 'Стоянка запрещена — ограничение по дням/времени',
    ka: 'პარკინგი აკრძალულია — დღის/დროის შეზღუდვა',
    es: 'Prohibido estacionar — límite de día/hora',
  },
  'NO STANDING-DAY/TIME LIMITS': {
    ru: 'Остановка запрещена — ограничение по дням/времени',
    ka: 'გაჩერება აკრძალულია — დღის/დროის შეზღუდვა',
    es: 'Prohibido detenerse — límite de día/hora',
  },
  'NO STANDING-BUS STOP': {
    ru: 'Остановка запрещена — автобусная остановка',
    ka: 'გაჩერება აკრძალულია — ავტობუსის გაჩერება',
    es: 'Prohibido detenerse — parada de autobús',
  },
  'NO STANDING-EXC. TRUCK LOADING': {
    ru: 'Остановка запрещена, кроме погрузки грузовиков',
    ka: 'გაჩერება აკრძალულია, გარდა სატვირთოს დატვირთვისა',
    es: 'Prohibido detenerse, excepto carga de camiones',
  },
  'OBSTRUCTING DRIVEWAY': {
    ru: 'Блокирование въезда',
    ka: 'შესასვლელის გადაკეტვა',
    es: 'Obstrucción de entrada de vehículos',
  },
  'EXPIRED MUNI METER': {
    ru: 'Истёк срок оплаты паркомата',
    ka: 'ვადაგასული საპარკინგო მრიცხველი',
    es: 'Parquímetro municipal vencido',
  },
  'FAIL TO DSPLY MUNI METER RECPT': {
    ru: 'Не выставлен чек паркомата',
    ka: 'საპარკინგო მრიცხველის ქვითარი არ არის გამოტანილი',
    es: 'No exhibió el recibo del parquímetro',
  },
  'FAILURE TO STOP AT RED LIGHT': {
    ru: 'Проезд на красный свет',
    ka: 'წითელ შუქზე გავლა',
    es: 'No detenerse en luz roja',
  },
  'PHTO SCHOOL ZN SPEED VIOLATION': {
    ru: 'Превышение скорости у школы (камера)',
    ka: 'სიჩქარის გადაჭარბება სკოლის ზონაში (კამერა)',
    es: 'Exceso de velocidad en zona escolar (cámara)',
  },
  'VIN OBSCURED': {
    ru: 'VIN-номер скрыт/не читается',
    ka: 'VIN-კოდი დაფარულია/არ იკითხება',
    es: 'VIN oculto/ilegible',
  },
};

function translateViolation(lang, name) {
  if (!name) return null;
  if (lang === 'en') return name;
  const entry = VIOLATION_NAMES[name.trim().toUpperCase()];
  return (entry && entry[lang]) || name;
}

const TEXTS = {
  en: {
    newFineTitle: 'New fine on {name}',
    amountDue: '${amount} due',
    newFineFallback: 'A new NYC violation was recorded.',
    weeklyTitle: 'Weekly fine reminder',
    weeklyBodyOne: '{name} has 1 open fine totaling ${amount}.',
    weeklyBodyMany: '{name} has {count} open fines totaling ${amount}.',
  },
  ru: {
    newFineTitle: 'Новый штраф: {name}',
    amountDue: '${amount} к оплате',
    newFineFallback: 'Зарегистрирован новый штраф NYC.',
    weeklyTitle: 'Еженедельное напоминание о штрафах',
    weeklyBodyOne: 'У «{name}» 1 неоплаченный штраф на ${amount}.',
    weeklyBodyMany: 'У «{name}» неоплаченных штрафов: {count}, на сумму ${amount}.',
  },
  ka: {
    newFineTitle: 'ახალი ჯარიმა: {name}',
    amountDue: '${amount} გადასახდელი',
    newFineFallback: 'დაფიქსირდა ახალი NYC ჯარიმა.',
    weeklyTitle: 'ყოველკვირეული შეხსენება ჯარიმებზე',
    weeklyBodyOne: '„{name}“-ს აქვს 1 გადაუხდელი ჯარიმა ${amount}-ის ოდენობით.',
    weeklyBodyMany: '„{name}“-ს აქვს {count} გადაუხდელი ჯარიმა ჯამში ${amount}.',
  },
  es: {
    newFineTitle: 'Nueva multa: {name}',
    amountDue: '${amount} pendiente',
    newFineFallback: 'Se registró una nueva infracción de NYC.',
    weeklyTitle: 'Recordatorio semanal de multas',
    weeklyBodyOne: '{name} tiene 1 multa pendiente por ${amount}.',
    weeklyBodyMany: '{name} tiene {count} multas pendientes por un total de ${amount}.',
  },
};

function text(lang, key, vars = {}) {
  const template = (TEXTS[normalizeLanguage(lang) || 'en'] || TEXTS.en)[key] || TEXTS.en[key];
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** Title + body for a newly detected fine, in the car owner's language. */
function newFineNotification(lang, { nickname, amountDue, violation }) {
  const code = normalizeLanguage(lang) || 'en';
  const amount = Number(amountDue || 0);
  const description = translateViolation(code, violation) || text(code, 'newFineFallback');
  return {
    title: text(code, 'newFineTitle', { name: nickname }),
    body: `${amount > 0 ? `${text(code, 'amountDue', { amount: amount.toFixed(2) })} · ` : ''}${description}`,
  };
}

/** Title + body for the weekly unpaid-fines reminder, in the car owner's language. */
function weeklyReminderNotification(lang, { nickname, openCount, totalDue }) {
  const code = normalizeLanguage(lang) || 'en';
  const vars = { name: nickname, count: openCount, amount: Number(totalDue || 0).toFixed(2) };
  return {
    title: text(code, 'weeklyTitle'),
    body: text(code, openCount === 1 ? 'weeklyBodyOne' : 'weeklyBodyMany', vars),
  };
}

module.exports = {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  translateViolation,
  newFineNotification,
  weeklyReminderNotification,
};
