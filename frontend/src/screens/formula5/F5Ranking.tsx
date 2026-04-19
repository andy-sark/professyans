import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegendChip } from '../../components/common/LegendChip';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RankCard } from '../../components/cards/RankCard';
import { useSession } from '../../store/sessionStore';
import { F5_GROUPS, F5_RANKING_ORDER, cardsOfGroup } from '../../data/formula5/cards';
import type { CardState } from '../../types/card';

/**
 * Ranking screen — Formula-5 flow.
 *
 * Five main groups (Ц … О). No group-level provocation pause between groups.
 */
export function F5Ranking() {
  const navigate = useNavigate();
  const session = useSession((s) => s.session);
  const setCardState = useSession((s) => s.setCardState);
  const markCardShown = useSession((s) => s.markCardShown);
  const setStage = useSession((s) => s.setStage);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  const currentGroupIdx = useMemo(() => {
    if (!session) return 0;
    const match = session.currentStage.match(/^f5\.ranking:(.+)$/);
    const key = match?.[1];
    const first = F5_RANKING_ORDER[0] ?? 'Ц';
    const idx = F5_RANKING_ORDER.indexOf(key ?? first);
    return idx >= 0 ? idx : 0;
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const groupKey = F5_RANKING_ORDER[currentGroupIdx];
    const cards = cardsOfGroup(groupKey);
    for (const c of cards) markCardShown(c.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupIdx]);

  if (!session) return null;

  const groupKey = F5_RANKING_ORDER[currentGroupIdx];
  const groupMeta = F5_GROUPS.find((g) => g.key === groupKey)!;
  const cards = cardsOfGroup(groupKey);
  const rankedInGroup = cards.filter(
    (c) => (session.cardStates?.[c.code] ?? 'unset') !== 'unset'
  ).length;
  const allRanked = rankedInGroup === cards.length;

  const totalRanked = Object.values(session.cardStates ?? {}).filter((s) => s !== 'unset').length;

  const goToNextGroup = () => {
    if (currentGroupIdx + 1 >= F5_RANKING_ORDER.length) {
      setStage('f5.formula');
      navigate('/f5/formula');
      return;
    }
    const next = F5_RANKING_ORDER[currentGroupIdx + 1];
    setStage(`f5.ranking:${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevGroup = () => {
    if (currentGroupIdx === 0) {
      navigate('/f5/intro');
      return;
    }
    const prev = F5_RANKING_ORDER[currentGroupIdx - 1];
    setStage(`f5.ranking:${prev}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStateChange = (code: string, newState: CardState) => {
    setCardState(code, newState);
  };

  const handleFlip = (code: string) => {
    const cur = (session.cardStates?.[code] ?? 'unset') as CardState;
    if (cur === 'like') setCardState(code, 'flipped');
    else if (cur === 'flipped') setCardState(code, 'like');
  };

  return (
    <Shell
      maxWidth="wide"
      headerRight={
        <ProgressBar current={totalRanked} total={45} label={`${totalRanked} из 45 карточек`} />
      }
    >
      <div className="mb-10 md:mb-14">
        <div className="flex items-center gap-3 mb-4">
          <span className="meta-label">
            Группа {currentGroupIdx + 1} из {F5_RANKING_ORDER.length}
          </span>
          <span className="text-ink-400">·</span>
          <span className="meta-label">основная</span>
        </div>

        <div className="flex items-baseline gap-4 flex-wrap mb-4">
          <span className="font-display text-5xl text-sage-600 font-medium">{groupMeta.label}</span>
          <h1 className="mb-0">{groupMeta.name}</h1>
        </div>

        <p className="text-ink-700 text-lg leading-relaxed max-w-3xl text-pretty">{groupMeta.intro}</p>

        <div className="mt-8 paper-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <LegendChip color="bg-sage-100 border-sage-400" label="нравится" desc="откликается" />
          <LegendChip color="bg-paper-100 border-paper-300 opacity-70" label="нейтрально" desc="без отклика" />
          <LegendChip color="bg-paper-100 border-terra-300" label="отвергаю" desc="стоп-сигнал" />
          <LegendChip color="bg-paper-200 border-ink-500 italic" label="перевёрнуто" desc="хочу, но сейчас недоступно" />
        </div>
        <div className="mt-3 meta-label">
          нажми на карточку, чтобы переключить состояние · отдельная кнопка — «перевернуть»
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {cards.map((card) => {
          const state = (session.cardStates?.[card.code] ?? 'unset') as CardState;
          return (
            <RankCard
              key={card.code}
              card={card}
              state={state}
              onStateChange={(ns) => handleStateChange(card.code, ns)}
              onFlip={() => handleFlip(card.code)}
            />
          );
        })}
      </div>

      <div className="mt-14 pt-8 border-t border-paper-300 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <div className="meta-label mb-1">
            {rankedInGroup} из {cards.length} карточек в этой группе размечено
          </div>
          {!allRanked && (
            <div className="text-sm text-ink-600">можно пойти дальше и без разметки всех — они не пропадут</div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={goToPrevGroup}>
            ← назад
          </Button>
          <Button onClick={goToNextGroup}>
            {currentGroupIdx + 1 < F5_RANKING_ORDER.length ? 'дальше →' : 'к формуле →'}
          </Button>
        </div>
      </div>
    </Shell>
  );
}
