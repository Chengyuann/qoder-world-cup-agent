import { defaultWeights, groupTables, knockoutFixtures, teams } from "./data";
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
  options: {
    status?: MatchPrediction["status"];
    homeGoals?: number;
    awayGoals?: number;
    winner?: Team;
    scoreNote?: string;
  } = {},
): MatchPrediction {
  const homeWin = winProbability(home, away, weights);
  const winner = options.winner ?? (homeWin >= 0.5 ? home : away);
  const predictedScore = scoreline(home, away, homeWin);
  const homeGoals = options.homeGoals ?? predictedScore[0];
  const awayGoals = options.awayGoals ?? predictedScore[1];
  const leader = winner === home ? home : away;
  const rival = winner === home ? away : home;
  const leaderScore = weightedScore(leader, weights);
  const rivalScore = weightedScore(rival, weights);
  const status = options.status ?? "forecast";
  const modelBacksWinner = winner === home ? homeWin >= 0.5 : homeWin < 0.5;
  const explanation =
    status === "actual"
      ? [
          `真实赛果已锁定：${home.name} ${homeGoals}-${awayGoals} ${away.name}${options.scoreNote ? `（${options.scoreNote}）` : ""}。`,
          modelBacksWinner
            ? `模型赛前也倾向 ${leader.name}，综合评分 ${leaderScore.toFixed(1)} 对 ${rivalScore.toFixed(1)}。`
            : `${leader.name} 以真实赛果推进，模型仍记录其相对评分 ${leaderScore.toFixed(1)} 对 ${rivalScore.toFixed(1)}，用于后续风险解释。`,
          `${leader.name} 进入下一轮后，后续胜率继续由实力、状态、深度、杯赛经验和场地适应重新计算。`,
        ]
      : [
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
    status,
    scoreNote: options.scoreNote,
    explanation,
  };
}

function projectGroups(weights: Weights): GroupResult[] {
  const groups = Object.keys(groupTables);
  return groups.map((group) => {
    const rows = groupTables[group];
    const table = rows.map((row) => {
      const team = findTeam(row.code);
      return {
      team,
      score: weightedScore(team, weights),
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      expectedPoints: row.points,
      expectedGoalsFor: row.goalsFor,
      expectedGoalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      status: row.status,
    };
    });

    return {
      group,
      standings: table,
    };
  });
}

function findTeam(code: string): Team {
  const team = teams.find((item) => item.code === code);
  if (!team) throw new Error(`Missing team ${code}`);
  return team;
}

function projectKnockout(weights: Weights): MatchPrediction[] {
  const r32 = knockoutFixtures.map((fixture) => {
    const home = findTeam(fixture.home);
    const away = findTeam(fixture.away);
    const winner = fixture.winner ? findTeam(fixture.winner) : undefined;
    return makeMatch(fixture.id, fixture.round, fixture.slot, home, away, weights, {
      status: fixture.status,
      homeGoals: fixture.homeGoals,
      awayGoals: fixture.awayGoals,
      winner,
      scoreNote: fixture.scoreNote,
    });
  });

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
      `16 强 · ${r32[a].winner.name} vs ${r32[b].winner.name}`,
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

function championProbabilities(weights: Weights, knockout: MatchPrediction[]): ChampionProbability[] {
  const activeCodes = new Set(
    knockout
      .filter((match) => match.round === "R16")
      .flatMap((match) => [match.home.code, match.away.code]),
  );
  const scores = teams.filter((team) => activeCodes.has(team.code)).map((team) => {
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
  const knockout = projectKnockout(weights);
  const final = knockout.find((match) => match.round === "F");
  if (!final) throw new Error("Final not generated");
  return {
    groups,
    knockout,
    champion: final.winner,
    probabilities: championProbabilities(weights, knockout),
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
