import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrackOption } from '../../components/common/TrackOption';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../store/sessionStore';
import { F5_RANKING_ORDER } from '../../data/formula5/cards';
import type { Track } from '../../types/session';

/**
 * Formula-5 intro + track selection.
 *
 * Per spec §4.7 / §6, the track-select screen names the trade-off;
 * F-5 flow starts ranking at the first main group (no pre-ranking block).
 */
export function F5Intro() {
  const navigate = useNavigate();
  const startSession = useSession((s) => s.startSession);
  const [track, setTrack] = useState<Track | null>(null);

  const begin = () => {
    if (!track) return;
    startSession({ method: 'F5', track });
    const firstGroup = F5_RANKING_ORDER[0] ?? 'Ц';
    useSession.getState().setStage(`f5.ranking:${firstGroup}`);
    navigate('/f5/ranking');
  };

  return (
    <Shell maxWidth="narrow">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="meta-label mb-5">Формула-5 · введение</div>
        <h1 className="mb-6 text-balance">
          Сейчас ты разложишь 45 карточек и{' '}
          <span className="display-italic text-sage-600">соберёшь из них формулу</span>{' '}
          своей привлекательной профессии.
        </h1>

        <div className="prose prose-lg max-w-none text-ink-800 space-y-5 leading-relaxed">
          <p>
            Это не тест. <strong>Правильного ответа нет.</strong> Ты будешь ранжировать карточки по пяти группам
            характеристик труда — цели, предмет, средства, условия, особенности. Потом выберешь восемь главных и
            соберёшь их в «молекулу» — свою формулу.
          </p>
          <p>
            <em>Работа занимает около 30–40 минут.</em> Можно в любой момент прерваться — прогресс сохраняется
            автоматически. Можно возвращаться и менять решения сколько угодно раз. Это поощряется:{' '}
            <strong>колебания — норма, а не дефект</strong>.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="font-display mb-2">Как проходить?</h2>
          <p className="text-ink-700 mb-6">
            Автор методики — против упрощённого теста. Но мы понимаем: иногда нужно быстро. Выбор за тобой.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <TrackOption
              label="Активизирующий"
              tag="основной"
              selected={track === 'activating'}
              onSelect={() => setTrack('activating')}
            >
              Процесс важнее результата. Программа будет задавать встречные вопросы, подсвечивать противоречия,
              предлагать пересмотреть выборы. В конце — не «диагноз», а открытые вопросы, с которыми ты уйдёшь
              думать дальше.
            </TrackOption>

            <TrackOption
              label="Закрытый ответ"
              tag="упрощённый"
              selected={track === 'closed'}
              onSelect={() => setTrack('closed')}
            >
              Быстро получить предварительный список направлений — с оговоркой: это упрощение, не полная картина.
              Никаких промежуточных разборов между группами. Пятая фаза работы (осмысление результата) остаётся за
              тобой.
            </TrackOption>
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← назад
          </Button>
          <Button size="lg" disabled={!track} onClick={begin}>
            Начать работу →
          </Button>
        </div>

        <div className="mt-10 pt-8 border-t border-paper-300 meta-label text-center">
          методика заявлена автором как активизирующая · не психодиагностика
        </div>
      </motion.div>
    </Shell>
  );
}
