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
    penaltySoonTitle: 'Late penalty in {days} days',
    penaltySoonParking: '{name}: your NYC parking ticket will receive a ${amount} late penalty in {days} days. Pay by {date} to avoid it.',
    penaltySoonCamera: '{name}: your NYC camera violation may receive a ${amount} late penalty in {days} days. Pay by {date} to avoid it.',
    penaltyAddedTitle: 'Late penalty added',
    penaltyAddedParking: '{name}: your NYC parking ticket received a ${amount} late penalty. Amount due: ${due}.',
    penaltyAddedCamera: '{name}: your NYC camera violation received a ${amount} late penalty. Amount due: ${due}.',
    judgmentSoonTitle: 'Approaching judgment',
    judgmentSoonBody: '{name}: your unpaid violation is approaching judgment. Pay ${due} by {date} to avoid it.',
    judgmentEnteredTitle: 'In judgment',
    judgmentEnteredBody: '{name}: your unpaid violation has entered judgment. Interest may be accruing.',
    enforcementTitle: 'Warning: enforcement risk',
    enforcementBody: 'Your NYC judgment debt has exceeded $350 (now ${amount}). Your vehicle may be at risk of booting or towing.',
    enforcementNearTitle: 'Judgment debt is growing',
    enforcementNearBody: 'You have ${amount} in NYC judgment debt. Above $350, vehicles registered to you may be booted or towed.',
    newFineTitle: 'New fine on {name}',
    amountDue: '${amount} due',
    newFineFallback: 'A new NYC violation was recorded.',
    weeklyTitle: 'Weekly fine reminder',
    weeklyBodyOne: '{name} has 1 open fine totaling ${amount}.',
    weeklyBodyMany: '{name} has {count} open fines totaling ${amount}.',
  },
  ru: {
    penaltySoonTitle: 'Штраф за просрочку через {days} дн.',
    penaltySoonParking: '{name}: к вашему штрафу за парковку NYC через {days} дн. добавят ${amount} за просрочку. Оплатите не позднее {date}, чтобы избежать этого.',
    penaltySoonCamera: '{name}: к вашему штрафу с камеры NYC через {days} дн. могут добавить ${amount} за просрочку. Оплатите не позднее {date}, чтобы избежать этого.',
    penaltyAddedTitle: 'Добавлен штраф за просрочку',
    penaltyAddedParking: '{name}: к вашему штрафу за парковку NYC добавили ${amount} за просрочку. К оплате: ${due}.',
    penaltyAddedCamera: '{name}: к вашему штрафу с камеры NYC добавили ${amount} за просрочку. К оплате: ${due}.',
    judgmentSoonTitle: 'Приближается судебное решение',
    judgmentSoonBody: '{name}: по неоплаченному штрафу скоро будет вынесено судебное решение. Оплатите ${due} не позднее {date}, чтобы избежать этого.',
    judgmentEnteredTitle: 'Судебное решение',
    judgmentEnteredBody: '{name}: по неоплаченному штрафу вынесено судебное решение. Могут начисляться проценты.',
    enforcementTitle: 'Внимание: риск принудительных мер',
    enforcementBody: 'Ваш долг NYC по судебным решениям превысил $350 (сейчас ${amount}). Ваш автомобиль могут заблокировать блокиратором или эвакуировать.',
    enforcementNearTitle: 'Долг по судебным решениям растёт',
    enforcementNearBody: 'Ваш долг NYC по судебным решениям: ${amount}. При долге свыше $350 ваши автомобили могут заблокировать или эвакуировать.',
    newFineTitle: 'Новый штраф: {name}',
    amountDue: '${amount} к оплате',
    newFineFallback: 'Зарегистрирован новый штраф NYC.',
    weeklyTitle: 'Еженедельное напоминание о штрафах',
    weeklyBodyOne: 'У «{name}» 1 неоплаченный штраф на ${amount}.',
    weeklyBodyMany: 'У «{name}» неоплаченных штрафов: {count}, на сумму ${amount}.',
  },
  ka: {
    penaltySoonTitle: 'დაგვიანების ჯარიმა {days} დღეში',
    penaltySoonParking: '{name}: თქვენს NYC პარკირების ჯარიმას {days} დღეში დაემატება ${amount} დაგვიანებისთვის. გადაიხადეთ {date}-მდე, რომ ეს თავიდან აიცილოთ.',
    penaltySoonCamera: '{name}: თქვენს NYC კამერის ჯარიმას {days} დღეში შეიძლება დაემატოს ${amount} დაგვიანებისთვის. გადაიხადეთ {date}-მდე, რომ ეს თავიდან აიცილოთ.',
    penaltyAddedTitle: 'დაემატა დაგვიანების ჯარიმა',
    penaltyAddedParking: '{name}: თქვენს NYC პარკირების ჯარიმას დაემატა ${amount} დაგვიანებისთვის. გადასახდელი: ${due}.',
    penaltyAddedCamera: '{name}: თქვენს NYC კამერის ჯარიმას დაემატა ${amount} დაგვიანებისთვის. გადასახდელი: ${due}.',
    judgmentSoonTitle: 'უახლოვდება სასამართლო გადაწყვეტილება',
    judgmentSoonBody: '{name}: გადაუხდელ ჯარიმაზე მალე სასამართლო გადაწყვეტილება გამოვა. გადაიხადეთ ${due} {date}-მდე, რომ ეს თავიდან აიცილოთ.',
    judgmentEnteredTitle: 'სასამართლო გადაწყვეტილება',
    judgmentEnteredBody: '{name}: გადაუხდელ ჯარიმაზე გამოტანილია სასამართლო გადაწყვეტილება. შეიძლება ერიცხებოდეს პროცენტი.',
    enforcementTitle: 'გაფრთხილება: იძულებითი ზომების რისკი',
    enforcementBody: 'თქვენი NYC სასამართლო დავალიანება $350-ს აღემატება (ახლა ${amount}). თქვენს მანქანას შეიძლება დაედოს ბლოკი ან გადაიყვანონ ევაკუატორით.',
    enforcementNearTitle: 'სასამართლო დავალიანება იზრდება',
    enforcementNearBody: 'თქვენი NYC სასამართლო დავალიანებაა ${amount}. $350-ზე მეტი დავალიანებისას თქვენს მანქანებს შეიძლება დაედოს ბლოკი ან გადაიყვანონ ევაკუატორით.',
    newFineTitle: 'ახალი ჯარიმა: {name}',
    amountDue: '${amount} გადასახდელი',
    newFineFallback: 'დაფიქსირდა ახალი NYC ჯარიმა.',
    weeklyTitle: 'ყოველკვირეული შეხსენება ჯარიმებზე',
    weeklyBodyOne: '„{name}“-ს აქვს 1 გადაუხდელი ჯარიმა ${amount}-ის ოდენობით.',
    weeklyBodyMany: '„{name}“-ს აქვს {count} გადაუხდელი ჯარიმა ჯამში ${amount}.',
  },
  es: {
    penaltySoonTitle: 'Recargo por mora en {days} días',
    penaltySoonParking: '{name}: tu multa de estacionamiento de NYC recibirá un recargo de ${amount} en {days} días. Paga a más tardar el {date} para evitarlo.',
    penaltySoonCamera: '{name}: tu infracción de cámara de NYC puede recibir un recargo de ${amount} en {days} días. Paga a más tardar el {date} para evitarlo.',
    penaltyAddedTitle: 'Recargo por mora agregado',
    penaltyAddedParking: '{name}: tu multa de estacionamiento de NYC recibió un recargo de ${amount}. Monto a pagar: ${due}.',
    penaltyAddedCamera: '{name}: tu infracción de cámara de NYC recibió un recargo de ${amount}. Monto a pagar: ${due}.',
    judgmentSoonTitle: 'Se acerca el fallo judicial',
    judgmentSoonBody: '{name}: tu infracción sin pagar se acerca a un fallo judicial. Paga ${due} a más tardar el {date} para evitarlo.',
    judgmentEnteredTitle: 'En fallo judicial',
    judgmentEnteredBody: '{name}: tu infracción sin pagar entró en fallo judicial. Pueden estar acumulándose intereses.',
    enforcementTitle: 'Advertencia: riesgo de sanción',
    enforcementBody: 'Tu deuda de NYC en fallo judicial superó los $350 (ahora ${amount}). Tu vehículo podría ser inmovilizado o remolcado.',
    enforcementNearTitle: 'Tu deuda en fallo judicial está creciendo',
    enforcementNearBody: 'Tienes ${amount} de deuda de NYC en fallo judicial. Por encima de $350, tus vehículos podrían ser inmovilizados o remolcados.',
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

const LOCALES = { en: 'en-US', ru: 'ru-RU', ka: 'ka-GE', es: 'es-US' };

/** "2026-10-14" -> a short date in the user's language, e.g. "Oct 14" / "14 окт." */
function formatDate(lang, isoDate) {
  const code = normalizeLanguage(lang) || 'en';
  const date = new Date(`${isoDate}T12:00:00Z`);
  return date.toLocaleDateString(LOCALES[code], { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// "$10" for whole dollars (as NYC prints fines), "$4.42" otherwise.
const money = (value) => { const n = Number(value || 0); return Number.isInteger(n) ? String(n) : n.toFixed(2); };

/** Upcoming late penalty (parking or camera) - sent 14, 7, 4 and 1 days before the due date. */
function penaltySoonNotification(lang, { nickname, ticketType, amount, daysUntilPenalty, dueDate }) {
  const code = normalizeLanguage(lang) || 'en';
  const vars = { name: nickname, amount: money(amount), days: daysUntilPenalty, date: formatDate(code, dueDate) };
  return {
    title: text(code, 'penaltySoonTitle', vars),
    body: text(code, ticketType === 'camera' ? 'penaltySoonCamera' : 'penaltySoonParking', vars),
  };
}

/** NYC's data now shows a late penalty that wasn't there before. */
function penaltyAddedNotification(lang, { nickname, ticketType, added, amountDue }) {
  const code = normalizeLanguage(lang) || 'en';
  const vars = { name: nickname, amount: money(added), due: money(amountDue) };
  return {
    title: text(code, 'penaltyAddedTitle'),
    body: text(code, ticketType === 'camera' ? 'penaltyAddedCamera' : 'penaltyAddedParking', vars),
  };
}

function judgmentSoonNotification(lang, { nickname, amountDue, judgmentDate }) {
  const code = normalizeLanguage(lang) || 'en';
  return {
    title: text(code, 'judgmentSoonTitle'),
    body: text(code, 'judgmentSoonBody', { name: nickname, due: money(amountDue), date: formatDate(code, judgmentDate) }),
  };
}

function judgmentEnteredNotification(lang, { nickname }) {
  const code = normalizeLanguage(lang) || 'en';
  return { title: text(code, 'judgmentEnteredTitle'), body: text(code, 'judgmentEnteredBody', { name: nickname }) };
}

/** Owner-level boot/tow warning: `exceeded` = judgment debt above $350, else approaching it. */
function enforcementNotification(lang, { judgmentDebt, exceeded }) {
  const code = normalizeLanguage(lang) || 'en';
  const vars = { amount: money(judgmentDebt) };
  return exceeded
    ? { title: text(code, 'enforcementTitle'), body: text(code, 'enforcementBody', vars) }
    : { title: text(code, 'enforcementNearTitle'), body: text(code, 'enforcementNearBody', vars) };
}

module.exports = {
  SUPPORTED_LANGUAGES,
  penaltySoonNotification,
  penaltyAddedNotification,
  judgmentSoonNotification,
  judgmentEnteredNotification,
  enforcementNotification,
  normalizeLanguage,
  translateViolation,
  newFineNotification,
  weeklyReminderNotification,
};
