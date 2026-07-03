import { defaultWeights, teams } from "./data";
import type {
  ChampionProbability,
  Forecast,
  GroupResult,
  MatchPrediction,
  Team,
  Weights,
} from "./types";

const weightKeys = Object.keys(defaultWeights) as (keyof Weights)[];

export function weightedScore(team: Team, weights: Weights): number {
  const total = weightKeys.reduce((sum, key) => sum + weights[key], 0);
  return weightKeys.reduce((sum, key) => sum + team[key] * (weights[key] / total), 0);
}

function winProbability(home: Team, away: Team, weights: Weights): number {
  const delta = weightedScore(home, weights) - weightedScore(away, weights);
  const attackDelta = home.attack - away.defense;
  const defenseDelta = home.defense - away.attack;
  const adjusted = delta * 0.16 + attackDelta * 0.055 + defenseDelta * 0.035;
  return 1 / (1 + Math.exp(-adjusted));
}

function expectedGoals(team: Team, opponent: Team, probability: number): number {
  const attack = (team.attack - opponent.defense) / 22;
  const baseline = 1.12 + attack + (probability - 0.5) * 1.25;
  return clamp(baseline, 0.45, 3.4);
}

function scoreline(home: Team, away: Team, probability: number): [number, number] {
  const homeExpected = expectedGoals(home, away, probability);
  const awayExpected = expectedGoals(away, home, 1 - probability);
  let homeGoals = Math.max(0, Math.round(homeExpected));
  let awayGoals = Math.max(0, Math.round(awayExpected));

  if (homeGoals === awayGoals) {
    if (probability >= 0.5) homeGoals += 1;
    else awayGoals += 1;
  }

  return [Math.min(homeGoals, 4), Math.min(awayGoals, 4)];
}

function makeMatch(
  id: string,
  round: MatchPrediction["round"],
  slot: string,
  home: Team,
  away: Team,
  weights: Weights,
): MatchPrediction {
  const homeWin = winProbability(home, away, weights);
  const winner = homeWin >= 0.5 ? home : away;
  const [homeGoals, awayGoals] = scoreline(home, away, homeWin);
  const leader = winner === home ? home : away;
  const rival = winner === home ? away : home;
  const leaderScore = weightedScore(leader, weights);
  const rivalScore = weightedScore(rival, weights);
  const explanation = [
    `${leader.name} 综合评分 ${leaderScore.toFixed(1)}，高于 ${rival.name} 的 ${rivalScore.toFixed(1)}。`,
    leader.depth > rival.depth
      ? `${leader.name} 阵容深度优势明显，适合连续淘汰赛。`
      : `${leader.name} 胜出主要来自效率和防守稳定性，而不是板凳厚度。`,
    leader.knockout > rival.knockout
      ? `${leader.name} 杯赛经验权重领先，点球或低比分场景更稳。`
      : `${leader.name} 依靠近期状态抵消杯赛经验劣势。`,
  ];

  return {
    id,
    round,
    slot,
    home,
    away,
    winner,
    homeWin,
    awayWin: 1 - homeWin,
    homeGoals,
    awayGoals,
    explanation,
  };
}

function groupSchedule(groupTeams: Team[]): [Team, Team][] {
  return [
    [groupTeams[0], groupTeams[1]],
    [groupTeams[2], groupTeams[3]],
    [groupTeams[0], groupTeams[2]],
    [groupTeams[1], groupTeams[3]],
    [groupTeams[0], groupTeams[3]],
    [groupTeams[1], groupTeams[2]],
  ];
}

function projectGroups(weights: Weights): GroupResult[] {
  const groups = Array.from(new Set(teams.map((team) => team.group)));
  return groups.map((group) => {
    const groupTeams = teams.filter((team) => team.group === group);
    const table = groupTeams.map((team) => ({
      team,
      score: weightedScore(team, weights),
      expectedPoints: 0,
      expectedGoalsFor: 0,
      expectedGoalsAgainst: 0,
    }));

    for (const [home, away] of groupSchedule(groupTeams)) {
      const probability = winProbability(home, away, weights);
      const [homeGoals, awayGoals] = scoreline(home, away, probability);
      const homeRow = table.find((row) => row.team.code === home.code);
      const awayRow = table.find((row) => row.team.code === away.code);
      if (!homeRow || !awayRow) continue;

      homeRow.expectedGoalsFor += homeGoals;
      homeRow.expectedGoalsAgainst += awayGoals;
      awayRow.expectedGoalsFor += awayGoals;
      awayRow.expectedGoalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        homeRow.expectedPoints += 3;
      } else if (homeGoals < awayGoals) {
        awayRow.expectedPoints += 3;
      } else {
        homeRow.expectedPoints += 1;
        awayRow.expectedPoints += 1;
      }
    }

    table.sort((a, b) => {
      if (b.expectedPoints !== a.expectedPoints) return b.expectedPoints - a.expectedPoints;
      const goalDiffA = a.expectedGoalsFor - a.expectedGoalsAgainst;
      const goalDiffB = b.expectedGoalsFor - b.expectedGoalsAgainst;
      if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
      return b.score - a.score;
    });

    return {
      group,
      standings: table,
    };
  });
}

const r32Slots: [string, string, string][] = [
  ["R32-1", "A1", "B2"],
  ["R32-2", "C1", "D2"],
  ["R32-3", "E1", "F2"],
  ["R32-4", "G1", "H2"],
  ["R32-5", "I1", "J2"],
  ["R32-6", "K1", "L2"],
  ["R32-7", "B1", "A2"],
  ["R32-8", "D1", "C2"],
  ["R32-9", "F1", "E2"],
  ["R32-10", "H1", "G2"],
  ["R32-11", "J1", "I2"],
  ["R32-12", "L1", "K2"],
  ["R32-13", "A3", "C3"],
  ["R32-14", "D3", "F3"],
  ["R32-15", "G3", "I3"],
  ["R32-16", "J3", "L3"],
];

function resolveSeed(seed: string, groups: GroupResult[]): Team {
  const group = seed[0];
  const place = Number(seed.slice(1)) - 1;
  const result = groups.find((item) => item.group === group);
  if (!result) throw new Error(`Missing group ${group}`);
  const standing = result.standings[place];
  if (!standing) throw new Error(`Missing seed ${seed}`);
  return standing.team;
}

function projectKnockout(groups: GroupResult[], weights: Weights): MatchPrediction[] {
  const r32 = r32Slots.map(([id, homeSeed, awaySeed]) =>
    makeMatch(id, "R32", `${homeSeed} vs ${awaySeed}`, resolveSeed(homeSeed, groups), resolveSeed(awaySeed, groups), weights),
  );

  const r16Pairs = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
    [10, 11],
    [12, 13],
    [14, 15],
  ];
  const r16 = r16Pairs.map(([a, b], index) =>
    makeMatch(
      `R16-${index + 1}`,
      "R16",
      `R32-${a + 1} 胜者 vs R32-${b + 1} 胜者`,
      r32[a].winner,
      r32[b].winner,
      weights,
    ),
  );

  const qfPairs = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ];
  const qf = qfPairs.map(([a, b], index) =>
    makeMatch(
      `QF-${index + 1}`,
      "QF",
      `16强第 ${a + 1} / ${b + 1} 线`,
      r16[a].winner,
      r16[b].winner,
      weights,
    ),
  );

  const sf = [
    makeMatch("SF-1", "SF", "上半区决赛", qf[0].winner, qf[1].winner, weights),
    makeMatch("SF-2", "SF", "下半区决赛", qf[2].winner, qf[3].winner, weights),
  ];

  const final = [makeMatch("F-1", "F", "冠军战", sf[0].winner, sf[1].winner, weights)];

  return [...r32, ...r16, ...qf, ...sf, ...final];
}

function championProbabilities(weights: Weights): ChampionProbability[] {
  const scores = teams.map((team) => {
    const score =
      weightedScore(team, weights) +
      team.attack * 0.06 +
      team.defense * 0.055 +
      (team.confederation === "UEFA" || team.confederation === "CONMEBOL" ? 1.8 : 0);
    return { team, score };
  });
  const maxScore = Math.max(...scores.map((item) => item.score));
  const expScores = scores.map((item) => ({
    ...item,
    exp: Math.exp((item.score - maxScore) / 4.3),
  }));
  const total = expScores.reduce((sum, item) => sum + item.exp, 0);
  return expScores
    .map(({ team, score, exp }) => ({
      team,
      score,
      probability: exp / total,
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function buildForecast(weights: Weights = defaultWeights): Forecast {
  const groups = projectGroups(weights);
  const knockout = projectKnockout(groups, weights);
  const final = knockout.find((match) => match.round === "F");
  if (!final) throw new Error("Final not generated");
  return {
    groups,
    knockout,
    champion: final.winner,
    probabilities: championProbabilities(weights),
  };
}

export function normalizeWeights(weights: Weights): Weights {
  return weightKeys.reduce((acc, key) => {
    acc[key] = clamp(Math.round(weights[key]), 0, 60);
    return acc;
  }, {} as Weights);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
