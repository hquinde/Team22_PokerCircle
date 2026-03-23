import { calculateSettlement } from '../utils/settlement';
import { Player } from '../types/session';

describe('Settlement Algorithm', () => {
  const createPlayer = (displayName: string, buyIn: number, rebuyTotal: number, cashOut: number): Player => ({
    playerId: 'test-id',
    displayName,
    joinedAt: new Date().toISOString(),
    isReady: true,
    buyIn,
    rebuyTotal,
    cashOut
  });

  it('should calculate correct net results and transactions for a simple 3-player game', () => {
    const players = [
      createPlayer('Alice', 100, 0, 150), // +50
      createPlayer('Bob', 100, 0, 50),   // -50
      createPlayer('Charlie', 100, 0, 100) // 0
    ];

    const result = calculateSettlement(players);

    expect(result.playerResults).toContainEqual({ displayName: 'Alice', netResult: 50 });
    expect(result.playerResults).toContainEqual({ displayName: 'Bob', netResult: -50 });
    expect(result.playerResults).toContainEqual({ displayName: 'Charlie', netResult: 0 });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toEqual({ from: 'Bob', to: 'Alice', amount: 50 });
  });

  it('should minimize transactions for a complex 4-player game', () => {
    const players = [
      createPlayer('Alice', 100, 0, 200), // +100
      createPlayer('Bob', 100, 0, 150),   // +50
      createPlayer('Charlie', 100, 0, 20), // -80
      createPlayer('David', 100, 0, 30)   // -70
    ];

    const result = calculateSettlement(players);

    // Total net: 100 + 50 - 80 - 70 = 0
    expect(result.transactions.length).toBeLessThan(4);
    
    // Check if total amount moved is 150
    const totalMoved = result.transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(totalMoved).toBe(150);

    // Verify all balances are settled by the transactions
    const balances: { [key: string]: number } = {};
    players.forEach(p => balances[p.displayName] = p.cashOut - (p.buyIn + p.rebuyTotal));
    
    result.transactions.forEach(t => {
      balances[t.from] += t.amount;
      balances[t.to] -= t.amount;
    });

    Object.values(balances).forEach(b => expect(Math.abs(b)).toBeLessThan(0.01));
  });

  it('should throw an error if sum of net results is not zero', () => {
    const players = [
      createPlayer('Alice', 100, 0, 150), // +50
      createPlayer('Bob', 100, 0, 60)    // -40
    ];

    expect(() => calculateSettlement(players)).toThrow('The sum of all net results must be zero');
  });

  it('should handle zero transactions if everyone is even', () => {
    const players = [
      createPlayer('Alice', 100, 0, 100),
      createPlayer('Bob', 100, 0, 100)
    ];

    const result = calculateSettlement(players);
    expect(result.transactions).toHaveLength(0);
  });
});
