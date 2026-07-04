import type { Team } from "./types";

export type TeamVisual = {
  flag: string;
  primary: string;
  secondary: string;
  accent: string;
};

export const teamVisuals: Record<string, TeamVisual> = {
  MEX: { flag: "mx", primary: "#006847", secondary: "#ffffff", accent: "#ce1126" },
  RSA: { flag: "za", primary: "#007a4d", secondary: "#ffb81c", accent: "#de3831" },
  CZE: { flag: "cz", primary: "#11457e", secondary: "#ffffff", accent: "#d7141a" },
  KOR: { flag: "kr", primary: "#003478", secondary: "#ffffff", accent: "#c60c30" },
  CAN: { flag: "ca", primary: "#d52b1e", secondary: "#ffffff", accent: "#8b1e16" },
  BIH: { flag: "ba", primary: "#002f6c", secondary: "#ffcd00", accent: "#ffffff" },
  QAT: { flag: "qa", primary: "#8d1b3d", secondary: "#ffffff", accent: "#5b1128" },
  SUI: { flag: "ch", primary: "#d52b1e", secondary: "#ffffff", accent: "#8c1a12" },
  BRA: { flag: "br", primary: "#009739", secondary: "#ffdf00", accent: "#002776" },
  HAI: { flag: "ht", primary: "#00209f", secondary: "#ffffff", accent: "#d21034" },
  MAR: { flag: "ma", primary: "#c1272d", secondary: "#006233", accent: "#f3d36a" },
  SCO: { flag: "gb-sct", primary: "#005eb8", secondary: "#ffffff", accent: "#0b3f7a" },
  USA: { flag: "us", primary: "#3c3b6e", secondary: "#ffffff", accent: "#b22234" },
  PAR: { flag: "py", primary: "#0038a8", secondary: "#ffffff", accent: "#d52b1e" },
  AUS: { flag: "au", primary: "#012169", secondary: "#ffffff", accent: "#e4002b" },
  TUR: { flag: "tr", primary: "#e30a17", secondary: "#ffffff", accent: "#9c0710" },
  GER: { flag: "de", primary: "#111111", secondary: "#ffcc00", accent: "#dd0000" },
  CUW: { flag: "cw", primary: "#002b7f", secondary: "#f9e814", accent: "#ffffff" },
  CIV: { flag: "ci", primary: "#f77f00", secondary: "#ffffff", accent: "#009e60" },
  ECU: { flag: "ec", primary: "#ffdd00", secondary: "#003893", accent: "#ce1126" },
  NED: { flag: "nl", primary: "#ae1c28", secondary: "#ffffff", accent: "#21468b" },
  JPN: { flag: "jp", primary: "#bc002d", secondary: "#ffffff", accent: "#7b001d" },
  SWE: { flag: "se", primary: "#005293", secondary: "#fecb00", accent: "#003c71" },
  TUN: { flag: "tn", primary: "#e70013", secondary: "#ffffff", accent: "#a0000c" },
  BEL: { flag: "be", primary: "#111111", secondary: "#fae042", accent: "#ed2939" },
  EGY: { flag: "eg", primary: "#ce1126", secondary: "#ffffff", accent: "#111111" },
  IRN: { flag: "ir", primary: "#239f40", secondary: "#ffffff", accent: "#da0000" },
  NZL: { flag: "nz", primary: "#00247d", secondary: "#ffffff", accent: "#cc142b" },
  ESP: { flag: "es", primary: "#aa151b", secondary: "#f1bf00", accent: "#7a1014" },
  CPV: { flag: "cv", primary: "#003893", secondary: "#ffffff", accent: "#cf2027" },
  KSA: { flag: "sa", primary: "#006c35", secondary: "#ffffff", accent: "#004b25" },
  URU: { flag: "uy", primary: "#0038a8", secondary: "#ffffff", accent: "#fcd116" },
  FRA: { flag: "fr", primary: "#0055a4", secondary: "#ffffff", accent: "#ef4135" },
  SEN: { flag: "sn", primary: "#00853f", secondary: "#fdef42", accent: "#e31b23" },
  IRQ: { flag: "iq", primary: "#ce1126", secondary: "#ffffff", accent: "#007a3d" },
  NOR: { flag: "no", primary: "#ba0c2f", secondary: "#ffffff", accent: "#00205b" },
  ARG: { flag: "ar", primary: "#75aadb", secondary: "#ffffff", accent: "#f6b40e" },
  ALG: { flag: "dz", primary: "#006233", secondary: "#ffffff", accent: "#d21034" },
  AUT: { flag: "at", primary: "#ed2939", secondary: "#ffffff", accent: "#9a1b25" },
  JOR: { flag: "jo", primary: "#007a3d", secondary: "#ffffff", accent: "#ce1126" },
  POR: { flag: "pt", primary: "#006600", secondary: "#ffcc00", accent: "#ff0000" },
  COD: { flag: "cd", primary: "#007fff", secondary: "#f7d618", accent: "#ce1021" },
  UZB: { flag: "uz", primary: "#1eb5e5", secondary: "#ffffff", accent: "#009b3a" },
  COL: { flag: "co", primary: "#fcd116", secondary: "#003893", accent: "#ce1126" },
  ENG: { flag: "gb-eng", primary: "#ffffff", secondary: "#cf142b", accent: "#1b3f8b" },
  CRO: { flag: "hr", primary: "#ff0000", secondary: "#ffffff", accent: "#171796" },
  GHA: { flag: "gh", primary: "#ce1126", secondary: "#fcd116", accent: "#006b3f" },
  PAN: { flag: "pa", primary: "#005293", secondary: "#ffffff", accent: "#d21034" },
};

export function visualForTeam(team: Pick<Team, "code">): TeamVisual {
  return teamVisuals[team.code] ?? { flag: "un", primary: "#7fb069", secondary: "#f4f1e8", accent: "#d0b46f" };
}

export function flagUrl(team: Pick<Team, "code">): string {
  return `https://flagcdn.com/${visualForTeam(team).flag}.svg`;
}
