import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shell } from '../components/layout/Shell';
import { Button } from '../components/ui/Button';
import { useSession } from '../store/sessionStore';
import { api } from '../lib/api';
import { useEffect, useState } from 'react';

interface MethodDef {
  id: 'F7' | 'F5' | 'KCHG' | 'PEREKRESTOK';
  title: string;
  subtitle: string;
  cards: string;
  duration: string;
  available: boolean;
  path: string;
  description: string;
}

const METHODS: MethodDef[] = [
  {
    id: 'F7',
    title: 'Формула-7',
    subtitle: 'Семь сторон привлекательной профессии',
    cards: '75 карточек',
    duration: '≈ 60–90 мин',
    available: true,
    path: '/f7/intro',
    description:
      'Самая развёрнутая из карточных методик. Собираешь формулу своей идеальной профессии из семи групп характеристик: цели, предмет, средства, условия, особенности, коммуникации и образ жизни.',
  },
  {
    id: 'F5',
    title: 'Формула-5',
    subtitle: 'Упрощённая версия, для более молодого возраста',
    cards: '45 карточек',
    duration: '≈ 30–40 мин',
    available: true,
    path: '/f5/intro',
    description:
      'Классический вариант Пряжникова 2005 года. Пять групп вместо семи — быстрее, но без блока коммуникаций и без привязки к вузу.',
  },
  {
    id: 'KCHG',
    title: 'Кто? Что? Где?',
    subtitle: 'От образа профессионала — к местам работы',
    cards: '84 карточки',
    duration: '≈ 45 мин',
    available: false,
    path: '/kchg/intro',
    description:
      'Альтернативный угол: сначала выбираешь, каким профессионалом хочешь быть (качества), потом — какие действия привлекают, потом — где это делается. Программа автоматически строит матрицу совпадений. Будет добавлено в следующей итерации.',
  },
  {
    id: 'PEREKRESTOK',
    title: 'Перекрёсток',
    subtitle: 'Опросник — «игра в тесты»',
    cards: '222 вопроса',
    duration: '≈ 2 ч 15 мин',
    available: false,
    path: '/perekrestok/intro',
    description:
      'Классический опросник на 222 утверждения. Не диагноз — «игра в тесты», как прямо определяет сам автор. Сводит 20 сфер труда, 5 средств, 5 уровней образования и 7 уровней самостоятельности в рекомендации. Будет добавлено в следующей итерации.',
  },
];

export function HomeScreen() {
  const navigate = useNavigate();
  const [hasResumable, setHasResumable] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(api.isEnabled());
  const [syncReachable, setSyncReachable] = useState<boolean | null>(null);
  const resumeFromStorage = useSession((s) => s.resumeFromStorage);
  const abandonSession = useSession((s) => s.abandonSession);

  // Check for a resumable session on mount — but don't auto-resume
  useEffect(() => {
    const raw = localStorage.getItem('professyans.currentSession.v1');
    setHasResumable(Boolean(raw));
    if (api.isConfigured()) {
      void api.health().then((ok) => setSyncReachable(ok));
    }
  }, []);

  const toggleSync = () => {
    const next = !syncEnabled;
    api.setEnabled(next);
    setSyncEnabled(next);
  };

  const resumeAndGo = () => {
    if (resumeFromStorage()) {
      const s = useSession.getState().session;
      if (!s) return;
      // Route to the current stage
      if (s.currentStage.startsWith('f7.')) {
        navigate('/f7/' + s.currentStage.replace('f7.', '').split(':')[0]);
      } else if (s.currentStage.startsWith('f5.')) {
        navigate('/f5/' + s.currentStage.replace('f5.', '').split(':')[0]);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <Shell>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-16 md:mb-24"
      >
        <div className="meta-label mb-5">Активизирующие методики профориентации</div>
        <h1 className="text-balance mb-6">
          Не диагноз.{' '}
          <span className="display-italic text-sage-600">Разговор с собой</span>{' '}
          о том, кем ты хочешь быть.
        </h1>
        <p className="text-lg text-ink-700 max-w-2xl leading-relaxed text-pretty">
          Четыре методики профессора Н. С. Пряжникова — карточные профессьянсы и опросник.
          Они устроены так, что <em>процесс размышления важнее результата</em>. Можно возвращаться,
          менять решения, сомневаться. И нужно.
        </p>

        {hasResumable && (
          <div className="mt-8 paper-card p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <div className="meta-label mb-1">Есть незавершённая работа</div>
              <div className="text-ink-800">Можно продолжить с того же места.</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { abandonSession(); setHasResumable(false); }}>
                Начать заново
              </Button>
              <Button size="sm" onClick={resumeAndGo}>Продолжить</Button>
            </div>
          </div>
        )}
      </motion.section>

      {/* Methods grid */}
      <section>
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display">Выбери методику</h2>
          <div className="meta-label hidden md:block">все на одинаковых условиях</div>
        </div>

        <div className="grid gap-5">
          {METHODS.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <MethodCard method={m} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* History + sync */}
      <section className="mt-16 pt-10 border-t border-paper-300 grid md:grid-cols-2 gap-8">
        <div>
          <Link to="/history" className="meta-label hover:text-ink-800 transition-colors">
            → Мои прошлые работы
          </Link>
        </div>
        {api.isConfigured() && (
          <div className="paper-card p-4 flex items-start justify-between gap-4">
            <div>
              <div className="meta-label mb-1">Облачное резервирование</div>
              <div className="text-sm text-ink-700 leading-relaxed">
                {syncReachable === false
                  ? 'сервер недоступен — работаем только локально'
                  : syncEnabled
                    ? 'сессии дублируются на сервер'
                    : 'по умолчанию всё локально, можно включить резерв'}
              </div>
            </div>
            <button
              onClick={toggleSync}
              disabled={syncReachable === false}
              className={`h-7 w-12 shrink-0 rounded-full border transition-all duration-200
                          ${syncEnabled ? 'bg-sage-500 border-sage-600' : 'bg-paper-200 border-paper-300'}
                          ${syncReachable === false ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-label={syncEnabled ? 'Выключить облачный резерв' : 'Включить облачный резерв'}
              aria-pressed={syncEnabled}
            >
              <span className={`block h-5 w-5 rounded-full bg-paper-50 shadow-card transition-transform
                                ${syncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
      </section>
    </Shell>
  );
}

function MethodCard({ method }: { method: MethodDef }) {
  const body = (
    <article
      className={`paper-card p-7 md:p-8 grid md:grid-cols-[auto_1fr_auto] gap-6 items-start
                  ${method.available ? 'hover:border-sage-400 hover:-translate-y-0.5 hover:shadow-card-raised cursor-pointer' : 'opacity-60'}`}
    >
      <div>
        <div className="font-display text-5xl md:text-6xl font-medium text-sage-600 leading-none">
          {method.id === 'F7' ? '7' : method.id === 'F5' ? '5' : method.id === 'KCHG' ? '3' : '·'}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-3 flex-wrap mb-2">
          <h3 className="font-display text-[1.5rem]">{method.title}</h3>
          {!method.available && (
            <span className="meta-label bg-paper-200 px-2 py-0.5 rounded">скоро</span>
          )}
        </div>
        <div className="font-body italic text-ink-600 mb-3">{method.subtitle}</div>
        <p className="text-[15px] text-ink-700 leading-relaxed text-pretty">
          {method.description}
        </p>
        <div className="mt-4 flex gap-6 meta-label">
          <span>{method.cards}</span>
          <span>{method.duration}</span>
        </div>
      </div>
      <div className="hidden md:flex items-center">
        <span
          className={`text-2xl transition-transform duration-300 ease-paper
                      ${method.available ? 'text-sage-500 group-hover:translate-x-1' : 'text-ink-400'}`}
        >
          →
        </span>
      </div>
    </article>
  );

  if (method.available) {
    return <Link to={method.path} className="block group">{body}</Link>;
  }
  return <div>{body}</div>;
}
