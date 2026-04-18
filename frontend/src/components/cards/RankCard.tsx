import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { Card, CardState } from '../../types/card';

interface Props {
  card: Card;
  state: CardState;
  onStateChange: (newState: CardState) => void;
  onFlip: () => void;
  /** Provocation text to reveal on hover/focus — optional */
  provocation?: string;
}

/**
 * Per spec §10.1, the card has a 4-state ring:
 *   unset → like → neutral → reject → unset
 * Plus a special `flipped` state accessible only from `like`:
 *   like → flipped  (want, but not available now)
 *   flipped → like  (return to the list)
 *
 * UX note: clicking the card body cycles the ring. The "flip" is a
 * separate, smaller control to avoid accidental state change.
 */
export function RankCard({ card, state, onStateChange, onFlip, provocation }: Props) {
  const next: Record<CardState, CardState> = {
    unset: 'like',
    like: 'neutral',
    neutral: 'reject',
    reject: 'unset',
    flipped: 'like',
  };

  const handleClick = () => {
    if (state === 'flipped') {
      // From flipped, cycling isn't natural — treat click as "return to like"
      onStateChange('like');
    } else {
      onStateChange(next[state]);
    }
  };

  const stateStyles: Record<CardState, string> = {
    unset:
      'bg-paper-50 border-paper-300 text-ink-800 hover:border-ink-400',
    like:
      'bg-sage-100 border-sage-400 text-ink-900 shadow-card-raised',
    neutral:
      'bg-paper-50 border-paper-300 text-ink-500 opacity-70',
    reject:
      'bg-paper-100 border-terra-300 text-ink-700 line-through decoration-terra-500 decoration-[1.5px]',
    flipped:
      'bg-paper-200 border-ink-500 text-ink-600 italic',
  };

  const stateLabel: Record<CardState, string> = {
    unset: '',
    like: 'нравится',
    neutral: 'нейтрально',
    reject: 'отвергаю',
    flipped: 'недоступно сейчас',
  };

  return (
    <motion.article
      layout
      className={clsx(
        'paper-card group relative p-5 cursor-pointer',
        'border-2',
        stateStyles[state],
        'transition-all duration-300 ease-paper'
      )}
      whileHover={{ y: state === 'reject' ? 0 : -2 }}
      whileTap={{ scale: 0.985 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Карточка ${card.code}. Текущее состояние: ${stateLabel[state] || 'не выбрано'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Code pill */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="meta-label">{card.code}</div>
        {stateLabel[state] && (
          <div
            className={clsx(
              'meta-label !tracking-[0.2em] !normal-case !text-[0.65rem]',
              state === 'like' && 'text-sage-700',
              state === 'reject' && 'text-terra-700',
              state === 'flipped' && 'text-ink-600'
            )}
          >
            {stateLabel[state]}
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className={clsx(
          'font-display text-[1.18rem] leading-snug mb-1.5',
          state === 'reject' ? 'no-underline' : ''
        )}
      >
        {card.title}
      </h3>

      {/* Description */}
      {card.description && (
        <p className="text-sm text-ink-700 leading-relaxed text-pretty">
          {card.description}
        </p>
      )}

      {/* Provocation — shown inline when state is "like", subtle */}
      {provocation && state === 'like' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-3 border-t border-sage-300/60 text-sm italic text-ink-600 text-pretty"
        >
          <span className="meta-label !text-[0.6rem] mr-2">подумай</span>
          {provocation}
        </motion.div>
      )}

      {/* Flip control — only available from "like" */}
      <div className="mt-4 flex items-center justify-end gap-1.5">
        {(state === 'like' || state === 'flipped') && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlip();
            }}
            className={clsx(
              'meta-label !tracking-wider px-2 py-1 rounded',
              'hover:bg-paper-200 hover:text-ink-800 transition-colors'
            )}
            aria-label={
              state === 'flipped'
                ? 'Вернуть в «нравится»'
                : 'Пометить как «хочу, но недоступно сейчас»'
            }
          >
            {state === 'flipped' ? '↺ вернуть' : '⇄ перевернуть'}
          </button>
        )}
      </div>
    </motion.article>
  );
}
