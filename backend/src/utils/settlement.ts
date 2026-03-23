import { Player } from '../types/session';

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementResult {
  playerResults: { displayName: string; netResult: number }[];
  transactions: Transaction[];
}

/**
 * Calculates the settlement plan for a game session using a greedy minimum cash-flow approach.
 * netResult = cashOut - (buyIn + rebuyTotal)
 */
export function calculateSettlement(players: Player[]): SettlementResult {
  const initialResults = players.map(p => ({
    displayName: p.displayName,
    netResult: p.cashOut - (p.buyIn + p.rebuyTotal)
  }));

  const totalNet = initialResults.reduce((sum, p) => sum + p.netResult, 0);
  if (Math.abs(totalNet) > 0.01) {
    throw new Error(`The sum of all net results must be zero. Current sum: ${totalNet}`);
  }

  // Use a separate array for the calculation to avoid mutating the initial results
  const creditors = initialResults
    .filter(p => p.netResult > 0)
    .map(p => ({ ...p })) // Clone
    .sort((a, b) => b.netResult - a.netResult);

  const debtors = initialResults
    .filter(p => p.netResult < 0)
    .map(p => ({ ...p, netResult: -p.netResult })) // Clone and make positive
    .sort((a, b) => b.netResult - a.netResult);

  const transactions: Transaction[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.netResult, debtor.netResult);
    
    if (amount > 0) {
      transactions.push({
        from: debtor.displayName,
        to: creditor.displayName,
        amount: Number(amount.toFixed(2))
      });
    }

    creditor.netResult -= amount;
    debtor.netResult -= amount;

    if (creditor.netResult <= 0.01) i++;
    if (debtor.netResult <= 0.01) j++;
  }

  return {
    playerResults: initialResults,
    transactions
  };
}
