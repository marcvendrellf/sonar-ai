import type {
  InstrumentQuote,
  PaperOrder,
  PortfolioSnapshot,
  ProposedAction,
  MarketSnapshot,
} from "@sonar-ai/core";

export interface ApplyPaperActionsInput {
  portfolio: PortfolioSnapshot;
  actions: readonly ProposedAction[];
  marketSnapshot: MarketSnapshot;
  appliedAt: string;
  orderIds?: ReadonlyMap<string, string>;
}

/**
 * Deterministic internal paper ledger. It never calls a broker and never
 * decides whether an action is allowed; the orchestrator owns those gates.
 */
export function applyPaperActions(input: ApplyPaperActionsInput): {
  orders: PaperOrder[];
  portfolio: PortfolioSnapshot;
} {
  const quotes = new Map(input.marketSnapshot.quotes.map((quote) => [quote.instrumentId, quote]));
  const positions = new Map(
    input.portfolio.positions.map((position) => [position.instrumentId, { ...position }]),
  );
  let cash = input.portfolio.cash.amount;
  const orders: PaperOrder[] = [];

  for (const action of input.actions) {
    const quote = quotes.get(action.instrumentId);
    if (!quote || quote.price <= 0) {
      throw new Error(`Paper ledger cannot price action "${action.id}".`);
    }

    const notional = roundMoney(Math.abs(action.amount.amount));
    const quantity = roundQuantity(notional / quote.price);
    if (quantity <= 0) throw new Error(`Paper ledger action "${action.id}" has zero quantity.`);

    const current = positions.get(action.instrumentId);
    const currentQuantity = current?.quantity ?? 0;
    const nextQuantity = action.side === "buy" ? currentQuantity + quantity : currentQuantity - quantity;
    if (nextQuantity < -1e-9) {
      throw new Error(`Paper ledger action "${action.id}" sells more than held.`);
    }

    cash += action.side === "buy" ? -notional : notional;
    if (nextQuantity <= 1e-9) {
      positions.delete(action.instrumentId);
    } else {
      const marketValue = roundMoney(nextQuantity * quote.price);
      positions.set(action.instrumentId, {
        instrumentId: action.instrumentId,
        quantity: nextQuantity,
        avgPrice: { amount: quote.price, currency: quote.currency },
        marketValue: { amount: marketValue, currency: quote.currency },
        weight: marketValue / input.portfolio.nav.amount,
      });
    }

    orders.push({
      id: input.orderIds?.get(action.id) ?? `ord_${action.id}`,
      actionId: action.id,
      instrumentId: action.instrumentId,
      side: action.side,
      quantity,
      price: { amount: quote.price, currency: quote.currency },
      notional: { amount: notional, currency: quote.currency },
      appliedAt: input.appliedAt,
    });
  }

  const positionsList = [...positions.values()].sort((a, b) => a.instrumentId.localeCompare(b.instrumentId));
  return {
    orders,
    portfolio: {
      ...input.portfolio,
      id: `pf_after_${input.portfolio.id}`,
      asOf: input.appliedAt,
      cash: { amount: roundMoney(cash), currency: input.portfolio.baseCurrency },
      nav: input.portfolio.nav,
      positions: positionsList,
    },
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundQuantity(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function quoteFor(
  marketSnapshot: MarketSnapshot,
  instrumentId: string,
): InstrumentQuote | undefined {
  return marketSnapshot.quotes.find((quote) => quote.instrumentId === instrumentId);
}
