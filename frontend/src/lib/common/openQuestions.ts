/**
 * Open questions for results screens (spec §4.5).
 * Conversation openers, not conclusions — behavior matches prior F7Results inline helper.
 */

export function buildOpenQuestions(params: {
  conflictCount: number;
  flippedCount: number;
}): string[] {
  const { conflictCount, flippedCount } = params;
  const base = [
    'Что бы ты сказал себе через три года, если бы сегодняшние выборы оказались точными?',
    'Какие из этих карточек ты бы показал родителям? Каких точно не показал бы? Почему?',
  ];
  if (flippedCount > 0) {
    base.push(
      'Есть ли профессия, где твои «зоны роста» (перевёрнутые карточки) — не слабость, а обязательное требование?'
    );
  }
  if (conflictCount > 0) {
    base.push(
      'Напряжения, которые ты видишь — это то, с чем придётся жить, или то, что можно разрешить одним решением?'
    );
  }
  base.push(
    'Если бы кто-то описал «идеальную работу» этими же карточками — где ты не согласен с ним? Это важно: именно там твоя индивидуальность.'
  );
  return base;
}
