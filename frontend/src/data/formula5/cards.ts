/**
 * Formula-5 card data — thin wrapper over canonical JSON.
 *
 * Source of truth: `shared-data/formula5/cards.json`, read by both
 * frontend (here) and Python core. Do not edit card content in this
 * file — edit the JSON.
 */

import cardsJson from '@shared-data/formula5/cards.json';
import type { Card, GroupMeta } from '../../types/card';

const data = cardsJson as {
  meta: {
    method: string;
    formulaSize: number;
    bonusSize?: number;
    mainGroups: string[];
    rankingOrder: string[];
    groups: GroupMeta[];
  };
  cards: Card[];
};

export const F5_GROUPS: GroupMeta[] = data.meta.groups;
export const F5_CARDS: Card[] = data.cards;
export const F5_FORMULA_SIZE: number = data.meta.formulaSize;
export const F5_BONUS_SIZE: number = data.meta.bonusSize ?? 0;
export const F5_MAIN_GROUPS = data.meta.mainGroups as readonly string[];
export const F5_RANKING_ORDER: string[] = data.meta.rankingOrder;

/** Index cards by code for O(1) lookup */
export const F5_CARDS_BY_CODE: Record<string, Card> = Object.fromEntries(
  F5_CARDS.map((c) => [c.code, c])
);

/** Cards of a given group */
export function cardsOfGroup(g: string): Card[] {
  return F5_CARDS.filter((c) => c.group === g);
}
