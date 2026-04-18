import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../store/sessionStore';
import type { Track } from '../../types/session';

/**
 * Formula-7 intro + track selection.
 *
 * Per spec §4.7, the track-select screen is itself an activating element:
 * it honestly names the trade-off and makes the user co-responsible.
 */
export function F7Intro() {
  const navigate = useNavigate();
  const startSession = useSession((s) => s.startSession);
  const [track, setTrack] = useState<Track | null>(null);

  const begin = () => {
    if (!track) return;
    startSession({ method: 'F7', track });
    useSession.getState().setStage('f7.ranking:СЧЖ');
    navigate('/f7/ranking');
  };

  return (
    <Shell maxWidth="narrow">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="meta-label mb-5">Формула-7 · введение</div>
        <h1 className="mb-6 text-balance">
          Сейчас ты разложишь 75 карточек и{' '}
          <span className="display-italic text-sage-600">соберёшь из них формулу</span>{' '}
          своей привлекательной профессии.
        </h1>

        <div className="prose prose-lg max-w-none text-ink-800 space-y-5 leading-relaxed">
          <p>
            Это не тест. <strong>Правильного ответа нет.</strong> Ты будешь ранжировать карточки
            по семи группам характеристик труда — цели, предмет, средства, условия, особенности,
            коммуникации — и по образу жизни, который хочется построить. Потом выберешь семь
            главных и соберёшь их в «молекулу» — свою формулу.
          </p>
          <p>
            <em>Работа занимает около часа.</em> Можно в любой момент прерваться — прогресс
            сохраняется автоматически. Можно возвращаться и менять решения сколько угодно раз.
            Это поощряется: <strong>колебания — норма, а не дефект</strong>.
          </p>
        </div>

        {/* Track selection */}
        <div className="mt-12">
          <h2 className="font-display mb-2">Как проходить?</h2>
          <p className="text-ink-700 mb-6">
            Автор методики — против упрощённого теста. Но мы понимаем: иногда нужно быстро.
            Выбор за тобой.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <TrackOption
              label="Активизирующий"
              tag="основной"
              selected={track === 'activating'}
              onSelect={() => setTrack('activating')}
            >
              Процесс важнее результата. Программа будет задавать встречные вопросы, подсвечивать
              противоречия, предлагать пересмотреть выборы. В конце — не «диагноз», а открытые
              вопросы, с которыми ты уйдёшь думать дальше.
            </TrackOption>

            <TrackOption
              label="Закрытый ответ"
              tag="упрощённый"
              selected={track === 'closed'}
              onSelect={() => setTrack('closed')}
            >
              Быстро получить предварительный список направлений — с оговоркой: это упрощение,
              не полная картина. Никаких промежуточных разборов, меньше провокаций. Пятая фаза
              работы (осмысление результата) остаётся за тобой.
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

function TrackOption({
  label,
  tag,
  selected,
  onSelect,
  children,
}: {
  label: string;
  tag: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      className={`text-left paper-card p-6 border-2 transition-all duration-200 ease-paper
                  ${selected ? 'border-sage-500 bg-sage-100 shadow-card-raised' : 'border-paper-300 hover:border-ink-400'}`}
      aria-pressed={selected}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <span className="font-display text-xl">{label}</span>
        <span className="meta-label">{tag}</span>
      </div>
      <p className="text-[14.5px] text-ink-700 leading-relaxed text-pretty">
        {children}
      </p>
    </button>
  );
}
