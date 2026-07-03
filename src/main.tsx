import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BarChart3,
  Brain,
  CalendarClock,
  ChevronRight,
  CircleGauge,
  Cloud,
  Cpu,
  DatabaseZap,
  GitBranch,
  Globe2,
  LineChart,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { defaultWeights } from "./data";
import { buildForecast, normalizeWeights, weightedScore } from "./forecast";
import type { Forecast, MatchPrediction, Team, WeightKey, Weights } from "./types";
import "./styles.css";

const weightMeta: Record<WeightKey, { label: string; short: string; description: string }> = {
  strength: {
    label: "综合实力",
    short: "实力",
    description: "世界排名、球队身价、攻防基础质量的合成分。",
  },
  form: {
    label: "近期状态",
    short: "状态",
    description: "近期比赛走势、核心球员健康度、教练体系稳定性。",
  },
  depth: {
    label: "阵容深度",
    short: "深度",
    description: "密集赛程中替补质量和多位置覆盖能力。",
  },
  knockout: {
    label: "淘汰赛经验",
    short: "杯赛",
    description: "低比分、点球、逆风局和强强对话中的历史稳定性。",
  },
  travel: {
    label: "场地适应",
    short: "适应",
    description: "主办区域旅行距离、气候、时差和观众环境加成。",
  },
};

function App() {
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const forecast = useMemo(() => buildForecast(weights), [weights]);
  const final = forecast.knockout.find((match) => match.round === "F");
  const semis = forecast.knockout.filter((match) => match.round === "SF");

  const resetWeights = () => setWeights(defaultWeights);
  const updateWeight = (key: WeightKey, value: number) => {
    setWeights((current) => normalizeWeights({ ...current, [key]: value }));
  };

  return (
    <main className="app-shell">
      <AmbientCanvas />
      <Hero forecast={forecast} final={final} />
      <section className="control-band">
        <div className="control-copy">
          <span className="section-kicker">Model Control</span>
          <h2>冠军预测不是黑箱，所有权重都能现场调节。</h2>
          <p>
            Agent 将每支球队的实力、状态、深度、杯赛经验和北美场地适应度转换为可解释分数，
            再逐轮推演小组赛、32 强、16 强、四分之一决赛、半决赛和决赛。
          </p>
        </div>
        <WeightPanel weights={weights} onUpdate={updateWeight} onReset={resetWeights} />
      </section>
      <ProbabilityBoard forecast={forecast} />
      <BracketSection forecast={forecast} semis={semis} final={final} />
      <GroupSection forecast={forecast} weights={weights} />
      <ArchitectureSection />
      <EvidenceSection forecast={forecast} weights={weights} />
    </main>
  );
}

function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = canvas.getContext("2d");
    if (!context || prefersReducedMotion) return;

    const points = Array.from({ length: 56 }, (_, index) => ({
      x: (index * 173) % window.innerWidth,
      y: (index * 97) % window.innerHeight,
      r: 0.7 + (index % 5) * 0.34,
      speed: 0.18 + (index % 7) * 0.018,
      phase: index * 0.47,
    }));

    let frame = 0;
    let animation = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      frame += 0.008;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const gradient = context.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
      gradient.addColorStop(0, "rgba(127, 176, 105, 0.11)");
      gradient.addColorStop(0.52, "rgba(208, 180, 111, 0.055)");
      gradient.addColorStop(1, "rgba(122, 160, 168, 0.08)");
      context.strokeStyle = gradient;
      context.lineWidth = 1;

      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        point.y -= point.speed;
        point.x += Math.sin(frame + point.phase) * 0.16;
        if (point.y < -12) {
          point.y = window.innerHeight + 12;
          point.x = (point.x + 241) % window.innerWidth;
        }

        context.beginPath();
        context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        context.fillStyle = i % 4 === 0 ? "rgba(208, 180, 111, 0.42)" : "rgba(127, 176, 105, 0.34)";
        context.fill();

        const next = points[(i + 9) % points.length];
        const distance = Math.hypot(point.x - next.x, point.y - next.y);
        if (distance < 185) {
          context.globalAlpha = Math.max(0, 1 - distance / 185) * 0.26;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(next.x, next.y);
          context.stroke();
          context.globalAlpha = 1;
        }
      }

      animation = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />;
}

function Hero({ forecast, final }: { forecast: Forecast; final?: MatchPrediction }) {
  const champion = forecast.champion;
  const topThree = forecast.probabilities.slice(0, 3);
  const heroSignals = [
    `${topThree[0].team.name} ${(topThree[0].probability * 100).toFixed(1)}%`,
    `${topThree[1].team.name} ${(topThree[1].probability * 100).toFixed(1)}%`,
    `${topThree[2].team.name} ${(topThree[2].probability * 100).toFixed(1)}%`,
    final ? `决赛 ${final.home.name} ${final.homeGoals}-${final.awayGoals} ${final.away.name}` : "决赛路径生成中",
    `淘汰赛样本 ${forecast.knockout.length} 场`,
  ];

  return (
    <section className="hero-section">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Trophy size={16} />
            Qoder World Cup Forecast Agent
          </div>
          <h1>世界杯冠军预测 Agent：从分组到决赛的可解释推演。</h1>
          <p className="hero-lede">
            当前模型预测冠军为 <strong>{champion.name}</strong>。系统以公开足球强度指标、阵容结构、
            近期状态和淘汰赛经验构建权重模型，并输出比分、赛程树和每轮推理依据。
          </p>
          <div className="hero-actions">
            <a href="#bracket" className="primary-action">
              查看淘汰赛推演
              <ChevronRight size={18} />
            </a>
            <a href="#architecture" className="secondary-action">
              系统架构
            </a>
          </div>
          <div className="metadata-strip">
            <span>预测快照：2026-07-03</span>
            <span>赛题：冠军预测 Agent</span>
            <span>输出：公开页面 + 论坛帖</span>
          </div>
          <SignalTicker items={heroSignals} />
        </div>

        <div className="hero-visual">
          <div className="champion-card">
            <ChampionRadar champion={champion} />
            <div className="card-topline">
              <span>Predicted Champion</span>
              <Sparkles size={18} />
            </div>
            <div className="champion-code">{champion.code}</div>
            <h2>{champion.name}</h2>
            <div className="champion-metrics">
              <Metric label="夺冠概率" value={`${(topThree[0].probability * 100).toFixed(1)}%`} />
              <Metric label="模型评分" value={topThree[0].score.toFixed(1)} />
              <Metric label="决赛比分" value={final ? `${final.homeGoals}-${final.awayGoals}` : "-"} />
            </div>
            <p>{champion.note}</p>
          </div>

          <div className="top-three">
            {topThree.map((item, index) => (
              <div
                className="rank-row"
                key={item.team.code}
                style={{ "--row-delay": `${index * 120}ms` } as React.CSSProperties}
              >
                <span className="rank-index">{index + 1}</span>
                <span className="rank-team">{item.team.name}</span>
                <span className="rank-bar">
                  <span style={{ width: `${Math.max(8, item.probability * 240)}%` }} />
                </span>
                <span className="rank-value">{(item.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalTicker({ items }: { items: string[] }) {
  const track = [...items, ...items];
  return (
    <div className="signal-ticker" aria-label="模型实时信号">
      <div className="signal-track">
        {track.map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function ChampionRadar({ champion }: { champion: Team }) {
  const metrics = [
    champion.strength,
    champion.form,
    champion.depth,
    champion.knockout,
    champion.travel,
  ];
  const center = 60;
  const points = metrics
    .map((metric, index) => {
      const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
      const radius = 18 + (metric / 100) * 34;
      return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
    })
    .join(" ");

  return (
    <svg className="champion-radar" viewBox="0 0 120 120" aria-hidden="true">
      <circle className="radar-ring ring-one" cx="60" cy="60" r="48" />
      <circle className="radar-ring ring-two" cx="60" cy="60" r="34" />
      <polygon className="radar-shape" points={points} />
      <circle className="radar-core" cx="60" cy="60" r="4" />
    </svg>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WeightPanel({
  weights,
  onUpdate,
  onReset,
}: {
  weights: Weights;
  onUpdate: (key: WeightKey, value: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="weight-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Explainable Weights</span>
          <h3>权重实验台</h3>
        </div>
        <button onClick={onReset} type="button" className="icon-button" aria-label="重置权重">
          <RefreshCw size={17} />
        </button>
      </div>
      <div className="weight-status">
        <span className="status-dot" />
        <span>实时重算</span>
        <strong>{Object.values(weights).reduce((sum, value) => sum + value, 0)}</strong>
      </div>
      {(Object.keys(weights) as WeightKey[]).map((key) => (
        <label className="weight-row" key={key}>
          <span className="weight-label">
            <strong>{weightMeta[key].label}</strong>
            <small>{weightMeta[key].description}</small>
          </span>
          <span className="weight-value">{weights[key]}</span>
          <input
            type="range"
            min="0"
            max="60"
            value={weights[key]}
            onChange={(event) => onUpdate(key, Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  );
}

function ProbabilityBoard({ forecast }: { forecast: Forecast }) {
  const contenders = forecast.probabilities.slice(0, 10);

  return (
    <section className="probability-section">
      <div className="section-heading">
        <span className="section-kicker">Champion Distribution</span>
        <h2>冠军候选分布</h2>
        <p>softmax 概率用于排序，不声称等同真实博彩概率；它更适合作为 Agent 的可解释相对信心。</p>
      </div>
      <div className="probability-grid">
        {contenders.map((item, index) => (
          <article
            className="probability-card"
            key={item.team.code}
            style={{ "--card-delay": `${index * 70}ms` } as React.CSSProperties}
          >
            <div className="probability-card-head">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.team.code}</strong>
            </div>
            <h3>{item.team.name}</h3>
            <div className="probability-line">
              <span
                style={
                  {
                    "--target-width": `${Math.max(10, item.probability * 260)}%`,
                    width: `${Math.max(10, item.probability * 260)}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <div className="probability-meta">
              <span>{(item.probability * 100).toFixed(1)}%</span>
              <span>{item.score.toFixed(1)} pts</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BracketSection({
  forecast,
  semis,
  final,
}: {
  forecast: Forecast;
  semis: MatchPrediction[];
  final?: MatchPrediction;
}) {
  const rounds = [
    { key: "R32", label: "32 强", matches: forecast.knockout.filter((match) => match.round === "R32") },
    { key: "R16", label: "16 强", matches: forecast.knockout.filter((match) => match.round === "R16") },
    { key: "QF", label: "8 强", matches: forecast.knockout.filter((match) => match.round === "QF") },
  ] as const;

  return (
    <section className="bracket-section" id="bracket">
      <div className="section-heading wide">
        <span className="section-kicker">Knockout Path</span>
        <h2>淘汰赛逐层推演</h2>
        <p>每场比赛由双方综合评分、攻防错位和杯赛修正共同决定，并生成比分与解释。</p>
      </div>

      <div className="final-strip">
        {semis.map((match) => (
          <MatchCard match={match} key={match.id} compact />
        ))}
        {final && <MatchCard match={final} featured />}
      </div>

      <div className="rounds-grid">
        {rounds.map((round) => (
          <div className="round-column" key={round.key}>
            <div className="round-title">{round.label}</div>
            {round.matches.map((match) => (
              <MatchCard match={match} key={match.id} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function MatchCard({
  match,
  compact = false,
  featured = false,
}: {
  match: MatchPrediction;
  compact?: boolean;
  featured?: boolean;
}) {
  const homeWinner = match.winner.code === match.home.code;
  const confidence = ((homeWinner ? match.homeWin : match.awayWin) * 100).toFixed(0);
  return (
    <article
      className={`match-card ${compact ? "compact" : ""} ${featured ? "featured" : ""}`}
      style={{ "--confidence": `${confidence}%` } as React.CSSProperties}
    >
      <div className="match-slot">{match.slot}</div>
      <div className={`team-line ${homeWinner ? "winner" : ""}`}>
        <span>{match.home.name}</span>
        <strong>{match.homeGoals}</strong>
      </div>
      <div className={`team-line ${!homeWinner ? "winner" : ""}`}>
        <span>{match.away.name}</span>
        <strong>{match.awayGoals}</strong>
      </div>
      <div className="match-confidence">
        <span>{match.winner.name} 胜率</span>
        <strong>{confidence}%</strong>
      </div>
      {featured && (
        <ul className="match-reasons">
          {match.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function GroupSection({ forecast, weights }: { forecast: Forecast; weights: Weights }) {
  return (
    <section className="groups-section">
      <div className="section-heading">
        <span className="section-kicker">Group Simulation</span>
        <h2>小组赛出线预测</h2>
        <p>小组赛采用单循环预期比分，按积分、净胜球、模型评分排序。每组前两名与四个三名进入淘汰赛模板。</p>
      </div>
      <div className="groups-grid">
        {forecast.groups.map((group) => (
          <article className="group-card" key={group.group}>
            <div className="group-title">Group {group.group}</div>
            {group.standings.map((standing, index) => (
              <div className="standing-row" key={standing.team.code}>
                <span className={`standing-index ${index < 2 ? "qualified" : index === 2 ? "third" : ""}`}>
                  {index + 1}
                </span>
                <span className="standing-team">{standing.team.name}</span>
                <span className="standing-points">{standing.expectedPoints} pts</span>
                <span className="standing-score">{weightedScore(standing.team, weights).toFixed(1)}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const items = [
    {
      icon: DatabaseZap,
      title: "Data Collector",
      text: "整理球队分组、公开排名、近期状态、阵容深度、攻防指标与旅行适应度，形成可替换数据表。",
    },
    {
      icon: Brain,
      title: "Reasoning Core",
      text: "将权重转成综合评分，再叠加攻防错位和杯赛经验，逐轮计算胜率、比分和解释语句。",
    },
    {
      icon: BarChart3,
      title: "Visual Layer",
      text: "展示冠军概率、小组积分、淘汰赛树、决赛推理和参数实验，评审可直接交互验证。",
    },
    {
      icon: Cloud,
      title: "Deploy Surface",
      text: "静态构建可部署到阿里云 OSS/ESA/函数计算静态托管，也可先用 GitHub Pages 提供公开访问。",
    },
  ];

  return (
    <section className="architecture-section" id="architecture">
      <div className="section-heading wide">
        <span className="section-kicker">System Design</span>
        <h2>Agent 系统架构</h2>
        <p>作品以可解释性和可演示性为核心：数据采集、预测引擎、可视化输出、部署链路都可在论坛材料中展开。</p>
      </div>
      <div className="architecture-grid">
        {items.map((item, index) => (
          <article
            className="architecture-card"
            key={item.title}
            style={{ "--card-delay": `${index * 100}ms` } as React.CSSProperties}
          >
            <item.icon size={24} />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="pipeline">
        <span>公开数据</span>
        <ChevronRight size={18} />
        <span>权重模型</span>
        <ChevronRight size={18} />
        <span>赛程推演</span>
        <ChevronRight size={18} />
        <span>可视化页面</span>
        <ChevronRight size={18} />
        <span>论坛提交</span>
      </div>
    </section>
  );
}

function EvidenceSection({ forecast, weights }: { forecast: Forecast; weights: Weights }) {
  const champion = forecast.champion;
  const final = forecast.knockout.find((match) => match.round === "F");
  const evidence = [
    {
      icon: CircleGauge,
      label: "核心结论",
      value: `${champion.name} 冠军`,
      text: champion.note,
    },
    {
      icon: LineChart,
      label: "权重快照",
      value: Object.entries(weights)
        .map(([key, value]) => `${weightMeta[key as WeightKey].short}${value}`)
        .join(" / "),
      text: "评审可调节权重观察冠军路径是否稳定，从而检验模型鲁棒性。",
    },
    {
      icon: Medal,
      label: "决赛推演",
      value: final ? `${final.home.name} ${final.homeGoals}-${final.awayGoals} ${final.away.name}` : "-",
      text: final ? final.explanation[0] : "决赛暂未生成。",
    },
    {
      icon: ShieldCheck,
      label: "合规说明",
      value: "公开数据 + 明示假设",
      text: "页面不抓取非公开赛事数据，不绕过天池规则，预测结果保留可解释假设。",
    },
  ];

  return (
    <section className="evidence-section">
      <div className="section-heading">
        <span className="section-kicker">Submission Evidence</span>
        <h2>论坛发帖可直接引用的说明</h2>
        <p>这部分对应赛题要求里的系统架构、可视化呈现、创新与创意、加分项和 Qoder 使用链路。</p>
      </div>
      <div className="evidence-grid">
        {evidence.map((item) => (
          <article className="evidence-card" key={item.label}>
            <item.icon size={22} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="toolchain-panel">
        <div>
          <span className="section-kicker">Qoder Toolchain</span>
          <h3>开发过程证据清单</h3>
        </div>
        <ul>
          <li>
            <Cpu size={16} />
            Qoder CLI 登录账号：macy200201@gmail.com，状态已验证。
          </li>
          <li>
            <GitBranch size={16} />
            代码、架构文档、提交材料均保留在本地工作区，可截图展示。
          </li>
          <li>
            <CalendarClock size={16} />
            赛题提交截止：2026-07-16 23:59:59。
          </li>
          <li>
            <Globe2 size={16} />
            完成构建后可部署为公开 URL，并放入天池论坛帖。
          </li>
          <li>
            <Activity size={16} />
            后续可接入 Qwen API 或百炼应用接口，把静态推演升级为对话式 Agent。
          </li>
        </ul>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
