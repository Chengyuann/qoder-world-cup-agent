export type Team = {
  code: string;
  name: string;
  group: string;
  confederation: string;
  rank: number;
  strength: number;
  form: number;
  depth: number;
  knockout: number;
  travel: number;
  attack: number;
  defense: number;
  note: string;
};

export type WeightKey = "strength" | "form" | "depth" | "knockout" | "travel";

export type Weights = Record<WeightKey, number>;

export type GroupStanding = {
  team: Team;
  score: number;
  expectedPoints: number;
  expectedGoalsFor: number;
  expectedGoalsAgainst: number;
};

export type GroupResult = {
  group: string;
  standings: GroupStanding[];
};

export type MatchPrediction = {
  id: string;
  round: "R32" | "R16" | "QF" | "SF" | "F";
  slot: string;
  home: Team;
  away: Team;
  winner: Team;
  homeWin: number;
  awayWin: number;
  homeGoals: number;
  awayGoals: number;
  explanation: string[];
};

export type ChampionProbability = {
  team: Team;
  probability: number;
  score: number;
};

export type Forecast = {
  groups: GroupResult[];
  knockout: MatchPrediction[];
  champion: Team;
  probabilities: ChampionProbability[];
};
