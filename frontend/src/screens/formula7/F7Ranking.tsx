import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RankCard } from '../../components/cards/RankCard';
import { useSession } from '../../store/sessionStore';
import {
  F7_GROUPS,
  F7_RANKING_ORDER,
  cardsOfGroup,
} from '../../data/formula7/cards';
import { F7_CARD_PROVOCATIONS, F7_GROUP_PROVOCATIONS } from '../../data/formula7/provocations';
import type { CardState } from '../../types/card';

/**
 * Ranking screen — the heart of the Formula-7 flow.
 *
 * Shows one group at a time (8 groups total). Within a group, user
 * cycles each card through the 4-state ring (plus the special `flipped`).
 *
 * Between groups, a brief reflection pause (per spec §4.1 phase 3):
 * a group-level provocation and the option to review before moving on.
 */
export function F7Ranking() {
  const navigate = useNavigate();
  const session = useSession((s) => s.session);
  const setCardState = useSession((s) => s.setCardState);
  const markCardShown = useSession((s) => s.markCardShown);
  const setStage = useSession((s) => s.setStage);
  const markProvocationShown = useSession((s) => s.markProvocationShown);

  // If no session (e.g. user landed here directly), send them back home.
  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  // Figure out current group index from stage name
  const currentGroupIdx = useMemo(() => {
    if (!session) return 0;
    const match = session.currentStage.match(/^f7\.ranking:(.+)$/);
    const key = match?.[1];
    const idx = F7_RANKING_ORDER.indexOf(key ?? 'СЧЖ');
    return idx >= 0 ? idx : 0;
  }, [session]);

  const [showGroupPrompt, setShowGroupPrompt] = useState(false);

  // Mark all visible cards as shown on group enter (for decision-time tracking)
  useEffect(() => {
    if (!session) return;
    const groupKey = F7_RANKING_ORDER[currentGroupIdx];
    const cards = cardsOfGroup(groupKey);
    for (const c of cards) markCardShown(c.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupIdx]);

  if (!session) return null;

  const groupKey = F7_RANKING_ORDER[currentGroupIdx];
  const groupMeta = F7_GROUPS.find((g) => g.key === groupKey)!;
  const cards = cardsOfGroup(groupKey);
  const rankedInGroup = cards.filter(
    (c) => (session.cardStates?.[c.code] ?? 'unset') !== 'unset'
  ).length;
  const allRanked = rankedInGroup === cards.length;

  // Total progress — how many of the 75 cards have any state
  const totalRanked = Object.values(session.cardStates ?? {}).filter(
    (s) => s !== 'unset'
  ).length;

  const goToNextGroup = () => {
    if (currentGroupIdx + 1 >= F7_RANKING_ORDER.length) {
      setStage('f7.formula');
      navigate('/f7/formula');
      return;
    }
    const next = F7_RANKING_ORDER[currentGroupIdx + 1];
    setStage(`f7.ranking:${next}`);
    setShowGroupPrompt(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevGroup = () => {
    if (currentGroupIdx === 0) {
      navigate('/f7/intro');
      return;
    }
    const prev = F7_RANKING_ORDER[currentGroupIdx - 1];
    setStage(`f7.ranking:${prev}`);
    setShowGroupPrompt(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStateChange = (code: string, newState: CardState) => {
    setCardState(code, newState);
  };

  const handleFlip = (code: string) => {
    const cur = (session.cardStates?.[code] ?? 'unset') as CardState;
    // like → flipped, flipped → like
    if (cur === 'like') setCardState(code, 'flipped');
    else if (cur === 'flipped') setCardState(code, 'like');
  };

  const openGroupPrompt = () => {
    const p = F7_GROUP_PROVOCATIONS[groupKey];
    if (p) markProvocationShown(p.id, { group: groupKey });
    setShowGroupPrompt(true);
  };

  // Only auxiliary / final groups (СЧЖ, ВК) have a simpler feel;
  // the 6 main groups have the full post-group prompt.
  const isMainGroup = groupMeta.role === 'main';

  return (
    <Shell
      maxWidth="wide"
      headerRight={
        <ProgressBar current={totalRanked} total={75} label={`${totalRanked} из 75 карточек`} />
      }
    >
      {/* Group header */}
      <div className="mb-10 md:mb-14">
        <div className="flex items-center gap-3 mb-4">
          <span className="meta-label">
            Группа {currentGroupIdx + 1} из {F7_RANKING_ORDER.length}
          </span>
          <span className="text-ink-400">·</span>
          <span className="meta-label">
            {groupMeta.role === 'auxiliary'
              ? 'вспомогательная'
              : groupMeta.role === 'final'
                ? 'финальная'
                : 'основная'}
          </span>
        </div>

        <div className="flex items-baseline gap-4 flex-wrap mb-4">
          <span className="font-display text-5xl text-sage-600 font-medium">{groupMeta.label}</span>
          <h1 className="mb-0">{groupMeta.name}</h1>
        </div>

        <p className="text-ink-700 text-lg leading-relaxed max-w-3xl text-pretty">
          {groupMeta.intro}
        </p>

        {/* State legend */}
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

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {cards.map((card) => {
          const state = (session.cardStates?.[card.code] ?? 'unset') as CardState;
          const prov = F7_CARD_PROVOCATIONS[card.code];
          return (
            <RankCard
              key={card.code}
              card={card}
              state={state}
              onStateChange={(ns) => handleStateChange(card.code, ns)}
              onFlip={() => handleFlip(card.code)}
              provocation={prov?.text}
            />
          );
        })}
      </div>

      {/* Group-end toolbar */}
      <div className="mt-14 pt-8 border-t border-paper-300 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <div className="meta-label mb-1">
            {rankedInGroup} из {cards.length} карточек в этой группе размечено
          </div>
          {!allRanked && (
            <div className="text-sm text-ink-600">
              можно пойти дальше и без разметки всех — они не пропадут
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={goToPrevGroup}>
            ← назад
          </Button>
          {isMainGroup && F7_GROUP_PROVOCATIONS[groupKey] && !showGroupPrompt && (
            <Button variant="secondary" onClick={openGroupPrompt}>
              подумать
            </Button>
          )}
          <Button onClick={goToNextGroup}>
            {currentGroupIdx + 1 < F7_RANKING_ORDER.length ? 'дальше →' : 'к формуле →'}
          </Button>
        </div>
      </div>

      {/* Group-level provocation */}
      <AnimatePresence>
        {showGroupPrompt && F7_GROUP_PROVOCATIONS[groupKey] && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-6 paper-card p-6 bg-sage-100/50 border-sage-400"
          >
            <div className="meta-label mb-2 text-sage-700">провокация</div>
            <p className="font-display italic text-xl text-ink-900 leading-snug text-pretty">
              {F7_GROUP_PROVOCATIONS[groupKey].text}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowGroupPrompt(false)}>
                закрыть
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}

function LegendChip({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded border-2 ${color} shrink-0`} />
      <div>
        <div className="font-ui font-medium text-ink-900 text-[13px]">{label}</div>
        <div className="text-xs text-ink-600">{desc}</div>
      </div>
    </div>
  );
}
