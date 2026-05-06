/**
 * Luvly Economy Engine — "luv" universal currency
 *
 * Real-world mechanics:
 *  - Inflation ticks every 24h based on total money supply growth
 *  - Bank savings earn compound interest (0.5%/day)
 *  - Loans compound daily at (base rate + inflation premium)
 *  - Market mood shifts every 6h (bull/bear/stable) affecting yields
 *  - Wealth tax on very large bank balances (funds the tax pool)
 *  - Wallet is vulnerable to robbery; bank is safe
 */

import { getTable, markDirty } from './store.js';

// ── Economy state defaults ─────────────────────────────────────────────────────
function defaultEconomy() {
  return {
    inflation:          1.00,  // price multiplier (1.0 = normal)
    prevSupply:         0,     // total luv in circulation last tick
    totalSupply:        0,     // current total luv in circulation
    baseInterestRate:   0.05,  // 5% annual base lending rate  
    savingsRate:        0.005, // 0.5% daily savings interest
    marketTrend:        'stable', // 'bull' | 'bear' | 'stable'
    marketMood:         1.00,  // yield multiplier for hunt/fish/work
    taxPool:            0,     // accumulated wealth tax (redistributed via events)
    totalTransactions:  0,
    lastInflationTick:  null,
    lastMarketShift:    null,
    lastSupplySnapshot: null,
  };
}

// ── User economy defaults ──────────────────────────────────────────────────────
export function defaultEconomyUser() {
  return {
    wallet:      150,   // starting luv
    bank:        0,
    loan:        0,
    loanRate:    0.08,  // 8% annual (adjusts with inflation)
    loanTaken:   null,
    lastInterest: null, // last time bank interest was applied
    lastWork:    null,
    lastHunt:    null,
    lastFish:    null,
    lastRob:     null,
    lastRobbed:  null,
    netEarned:   150,
    netSpent:    0,
  };
}

// ── Store helpers ──────────────────────────────────────────────────────────────
function eco() {
  const t = getTable('economy');
  if (!t.__global) {
    t.__global = defaultEconomy();
    markDirty('economy');
  }
  return t.__global;
}

function saveEco(patch) {
  const t = getTable('economy');
  t.__global = { ...t.__global, ...patch };
  markDirty('economy');
  return t.__global;
}

function userEco(userId) {
  const t = getTable('economy');
  if (!t[userId]) {
    t[userId] = defaultEconomyUser();
    markDirty('economy');
  }
  // back-fill any missing keys
  for (const [k, v] of Object.entries(defaultEconomyUser())) {
    if (t[userId][k] === undefined) t[userId][k] = v;
  }
  return t[userId];
}

function saveUserEco(userId, patch) {
  const t = getTable('economy');
  const cur = userEco(userId);
  t[userId] = { ...cur, ...patch };
  markDirty('economy');
  return t[userId];
}

// ── Recalculate total supply ───────────────────────────────────────────────────
function recalcSupply() {
  const t = getTable('economy');
  let total = 0;
  for (const [key, val] of Object.entries(t)) {
    if (key === '__global') continue;
    total += (val.wallet ?? 0) + (val.bank ?? 0);
  }
  return total;
}

// ── Inflation tick ─────────────────────────────────────────────────────────────
export function tickInflation() {
  const state = eco();
  const now   = Date.now();
  const MS_24H = 86_400_000;

  if (state.lastInflationTick && (now - state.lastInflationTick) < MS_24H) return state;

  const current  = recalcSupply();
  const prev     = state.prevSupply || current;
  const growthRate = prev > 0 ? (current - prev) / prev : 0;

  // Phillips-curve-inspired: supply growth → price inflation
  const rawAdj = growthRate * 0.6;
  const adj    = Math.max(-0.02, Math.min(0.05, rawAdj));

  // Inflation drifts but mean-reverts toward 1.0 (natural rate)
  const meanReversion = (1.0 - state.inflation) * 0.05;
  const newInflation  = Math.max(0.80, Math.min(2.50,
    state.inflation * (1 + adj + meanReversion)
  ));

  // Lending rate = base + inflation premium
  const newRate = Math.max(0.03, Math.min(0.30,
    state.baseInterestRate + (newInflation - 1) * 0.15
  ));

  return saveEco({
    inflation:          parseFloat(newInflation.toFixed(4)),
    prevSupply:         current,
    totalSupply:        current,
    baseInterestRate:   parseFloat(newRate.toFixed(4)),
    lastInflationTick:  now,
    lastSupplySnapshot: now,
  });
}

// ── Market shift (every 6h) ────────────────────────────────────────────────────
export function tickMarket() {
  const state = eco();
  const now   = Date.now();
  const MS_6H = 21_600_000;

  if (state.lastMarketShift && (now - state.lastMarketShift) < MS_6H) return state;

  const roll = Math.random();
  let trend, mood;

  // Higher inflation → more likely bear market
  const bearBias = Math.max(0, (state.inflation - 1.1) * 0.5);
  if (roll < 0.25 + bearBias)     { trend = 'bear'; mood = 0.70 + Math.random() * 0.20; }
  else if (roll < 0.55)           { trend = 'stable'; mood = 0.90 + Math.random() * 0.20; }
  else                            { trend = 'bull'; mood = 1.10 + Math.random() * 0.40; }

  return saveEco({
    marketTrend:     trend,
    marketMood:      parseFloat(mood.toFixed(3)),
    lastMarketShift: now,
  });
}

// ── Accrue bank interest and loan interest ─────────────────────────────────────
export function accrueInterest(userId) {
  const u   = userEco(userId);
  const now = Date.now();
  const last = u.lastInterest ?? u.loanTaken ?? now;
  const daysSince = Math.max(0, (now - last) / 86_400_000);

  if (daysSince < 0.01) return u; // less than ~15 min, skip

  let { wallet, bank, loan, loanRate } = u;

  // Savings: compound daily at savingsRate
  if (bank > 0) {
    const rate = eco().savingsRate;
    bank = Math.floor(bank * Math.pow(1 + rate, daysSince));
  }

  // Loan: compound daily at loanRate (real-world compounding)
  if (loan > 0) {
    loan = Math.ceil(loan * Math.pow(1 + (loanRate / 365), daysSince * 365 / 365));
    // Debt spiral protection: cap at 3× original principal (stored in loanRate metadata)
    const originalPrincipal = u.loanOriginal ?? loan;
    loan = Math.min(loan, originalPrincipal * 3);
  }

  // Wealth tax: if bank > 50,000 → 0.1%/day tax
  let taxed = 0;
  if (bank > 50_000) {
    taxed = Math.floor(bank * 0.001 * daysSince);
    bank  = bank - taxed;
    saveEco({ taxPool: (eco().taxPool ?? 0) + taxed });
  }

  saveUserEco(userId, { bank, loan, lastInterest: now });
  return userEco(userId);
}

// ── Read operations ────────────────────────────────────────────────────────────
export function getEconomy()               { return eco(); }
export function getWallet(userId)          { return userEco(userId).wallet  ?? 0; }
export function getBank(userId)            { return userEco(userId).bank    ?? 0; }
export function getLoan(userId)            { return userEco(userId).loan    ?? 0; }
export function getLoanRate(userId)        { return userEco(userId).loanRate ?? eco().baseInterestRate; }
export function getNetWorth(userId)        { const u = userEco(userId); return (u.wallet ?? 0) + (u.bank ?? 0) - (u.loan ?? 0); }
export function getTotalLuv(userId)        { return getWallet(userId) + getBank(userId); }
export function getEcoUser(userId)         { return userEco(userId); }

// Current inflation multiplier for prices
export function priceOf(basePrice)         { return Math.ceil(basePrice * eco().inflation); }
// Yield multiplier for earning commands
export function yieldMult()                { return eco().marketMood * (2 - eco().inflation); }

// ── Wallet operations ──────────────────────────────────────────────────────────
export function addToWallet(userId, amount) {
  const u = userEco(userId);
  const newBal = (u.wallet ?? 0) + Math.floor(amount);
  saveUserEco(userId, { wallet: newBal, netEarned: (u.netEarned ?? 0) + Math.floor(amount) });
  saveEco({ totalSupply: recalcSupply() });
  return newBal;
}

export function removeFromWallet(userId, amount) {
  const u = userEco(userId);
  const bal = u.wallet ?? 0;
  if (bal < amount) return { success: false, balance: bal };
  const newBal = bal - Math.floor(amount);
  saveUserEco(userId, { wallet: newBal, netSpent: (u.netSpent ?? 0) + Math.floor(amount) });
  saveEco({ totalSupply: recalcSupply() });
  return { success: true, balance: newBal };
}

export function setWallet(userId, amount) {
  saveUserEco(userId, { wallet: Math.max(0, Math.floor(amount)) });
  saveEco({ totalSupply: recalcSupply() });
}

// ── Bank operations ────────────────────────────────────────────────────────────
export function deposit(userId, amount) {
  const u      = userEco(userId);
  const wallet = u.wallet ?? 0;
  const amt    = Math.floor(amount);
  if (wallet < amt) return { success: false, reason: 'insufficient_wallet', balance: wallet };
  saveUserEco(userId, { wallet: wallet - amt, bank: (u.bank ?? 0) + amt });
  return { success: true, wallet: wallet - amt, bank: (u.bank ?? 0) + amt };
}

export function withdraw(userId, amount) {
  accrueInterest(userId); // apply interest first
  const u    = userEco(userId);
  const bank = u.bank ?? 0;
  const loan = u.loan ?? 0;
  const amt  = Math.floor(amount);

  // Frozen if loan > 2× bank
  if (loan > 0 && loan > bank * 2) {
    return { success: false, reason: 'frozen', loan, bank };
  }
  if (bank < amt) return { success: false, reason: 'insufficient_bank', balance: bank };
  saveUserEco(userId, { bank: bank - amt, wallet: (u.wallet ?? 0) + amt });
  return { success: true, wallet: (u.wallet ?? 0) + amt, bank: bank - amt };
}

// ── Loan operations ────────────────────────────────────────────────────────────
export function takeLoan(userId, amount) {
  accrueInterest(userId);
  const u    = userEco(userId);
  const loan = u.loan ?? 0;

  if (loan > 0) return { success: false, reason: 'existing_loan', loan };

  const state     = eco();
  const rate      = Math.min(0.30, state.baseInterestRate + (state.inflation - 1) * 0.20);
  const dailyRate = parseFloat((rate / 365).toFixed(6));
  const amt       = Math.floor(amount);

  saveUserEco(userId, {
    wallet:       (u.wallet ?? 0) + amt,
    loan:         amt,
    loanOriginal: amt,
    loanRate:     dailyRate,
    loanTaken:    Date.now(),
    lastInterest: Date.now(),
  });
  saveEco({ totalSupply: recalcSupply() });
  return { success: true, amount: amt, rate: parseFloat((rate * 100).toFixed(2)), dailyRate };
}

export function repayLoan(userId, amount) {
  accrueInterest(userId);
  const u    = userEco(userId);
  const loan = u.loan ?? 0;
  if (loan <= 0) return { success: false, reason: 'no_loan' };

  const wallet = u.wallet ?? 0;
  const amt    = Math.min(Math.floor(amount), loan);
  if (wallet < amt) return { success: false, reason: 'insufficient_wallet', balance: wallet };

  const remaining = loan - amt;
  saveUserEco(userId, {
    wallet:      wallet - amt,
    loan:        remaining,
    loanTaken:   remaining > 0 ? u.loanTaken : null,
    loanOriginal: remaining > 0 ? u.loanOriginal : null,
  });
  saveEco({ totalSupply: recalcSupply() });
  return { success: true, paid: amt, remaining };
}

// ── Transfer (wallet → wallet) ─────────────────────────────────────────────────
export function transfer(fromId, toId, amount) {
  const from = userEco(fromId);
  const amt  = Math.floor(amount);
  if ((from.wallet ?? 0) < amt) return { success: false, reason: 'insufficient', balance: from.wallet ?? 0 };

  removeFromWallet(fromId, amt);
  addToWallet(toId, amt);
  saveEco({ totalTransactions: (eco().totalTransactions ?? 0) + 1 });
  return { success: true, amount: amt };
}

// ── Robbery ────────────────────────────────────────────────────────────────────
export function rob(robberId, victimId) {
  const victim   = userEco(victimId);
  const robber   = userEco(robberId);
  const wallet   = victim.wallet ?? 0;

  if (wallet < 50) return { success: false, reason: 'too_poor', wallet };

  // Success chance: 35% base, –5% per 100 luv robber already has (rich cowards)
  const richPenalty = Math.floor((robber.wallet ?? 0) / 100) * 0.01;
  const chance      = Math.max(0.10, 0.35 - richPenalty);
  const roll        = Math.random();

  if (roll < chance) {
    // Success: steal 10–40% of victim's wallet
    const pct    = 0.10 + Math.random() * 0.30;
    const stolen = Math.max(1, Math.floor(wallet * pct));
    removeFromWallet(victimId, stolen);
    addToWallet(robberId, stolen);
    saveUserEco(robberId, { lastRob: Date.now() });
    saveUserEco(victimId, { lastRobbed: Date.now() });
    return { success: true, stolen, victimWallet: wallet - stolen };
  } else {
    // Caught: pay 15–25% of YOUR wallet as fine
    const fine = Math.floor((robber.wallet ?? 0) * (0.15 + Math.random() * 0.10));
    if (fine > 0) removeFromWallet(robberId, fine);
    saveUserEco(robberId, { lastRob: Date.now() });
    return { success: false, reason: 'caught', fine };
  }
}

// ── Format helpers ─────────────────────────────────────────────────────────────
export function fmt(n) {
  if (n === null || n === undefined) return '0 luv';
  n = Math.floor(n);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M luv`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}k luv`;
  return `${n} luv`;
}

export function trendEmoji(trend) {
  return trend === 'bull' ? '' : trend === 'bear' ? '' : '';
}

export function inflationLabel(rate) {
  if (rate > 1.50) return ' hyperinflation';
  if (rate > 1.20) return ' high inflation';
  if (rate > 1.05) return ' moderate inflation';
  if (rate > 0.98) return ' stable';
  return ' deflation';
}

// ── Boot: run ticks on startup ─────────────────────────────────────────────────
tickInflation();
tickMarket();
