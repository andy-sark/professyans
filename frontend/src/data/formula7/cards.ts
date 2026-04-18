/**
 * Formula-7 card data — thin wrapper over canonical JSON.
 *
 * Source of truth: `shared-data/formula7/cards.json`, read by both
 * frontend (here) and Python core. Do not edit card content in this
 * file — edit the JSON.
 */

import cardsJson from '@shared-data/formula7/cards.json';
import type { Card, GroupMeta } from '../../types/card';

const data = cardsJson as {
  meta: {
    method: string;
    formulaSize: number;
    mainGroups: string[];
    rankingOrder: string[];
    groups: GroupMeta[];
  };
  cards: Card[];
};

export const F7_GROUPS: GroupMeta[] = data.meta.groups;
export const F7_CARDS: Card[] = data.cards;
export const F7_FORMULA_SIZE: number = data.meta.formulaSize;
export const F7_MAIN_GROUPS = data.meta.mainGroups as readonly string[];
export const F7_RANKING_ORDER: string[] = data.meta.rankingOrder;

/** Index cards by code for O(1) lookup */
export const F7_CARDS_BY_CODE: Record<string, Card> = Object.fromEntries(
  F7_CARDS.map((c) => [c.code, c])
);

/** Cards of a given group */
export function cardsOfGroup(g: string): Card[] {
  return F7_CARDS.filter((c) => c.group === g);
}
