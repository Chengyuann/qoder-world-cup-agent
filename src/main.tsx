import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Brain,
  ChevronRight,
  Cloud,
  DatabaseZap,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { dataSnapshot, defaultWeights } from "./data";
import { buildForecast, normalizeWeights, weightedScore } from "./forecast";
import { flagUrl, visualForTeam } from "./teamVisuals";
import type { Forecast, MatchPrediction, Team, WeightKey, Weights } from "./types";
import heroImage from "./assets/generated/worldscope-hero.webp";
import knockoutOrbImage from "./assets/generated/knockout-orb.webp";
import pitchTextureImage from "./assets/generated/pitch-texture.webp";
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
      <MotionRuntime />
      <AmbientCanvas />
      <MotionDock />
      <Hero forecast={forecast} final={final} />
      <section className="control-band" id="model" data-reveal>
        <div className="control-copy">
          <span className="section-kicker">Model Control</span>
          <h2>冠军预测不是黑箱，所有权重都能现场调节。</h2>
          <p>
            Agent 使用 openfootball/worldcup 的 2026 世界杯小组与淘汰赛快照，锁定小组赛和 32 强真实赛果，
            再把 16 强及后续路径交给权重模型继续推演。
          </p>
        </div>
        <WeightPanel weights={weights} onUpdate={updateWeight} onReset={resetWeights} />
      </section>
      <ProbabilityBoard forecast={forecast} />
      <DataIntelligenceSection />
      <BracketSection forecast={forecast} semis={semis} final={final} />
      <ReasoningSection forecast={forecast} />
      <ScenarioSection weights={weights} onApply={setWeights} />
      <GroupSection forecast={forecast} weights={weights} />
      <ArchitectureSection />
    </main>
  );
}

function MotionRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;

    const updateScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      root.style.setProperty("--scroll-progress", `${window.scrollY / maxScroll}`);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScroll);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      root.style.setProperty("--cursor-x", `${event.clientX}`);
      root.style.setProperty("--cursor-y", `${event.clientY}`);

      const target = (event.target as Element | null)?.closest<HTMLElement>(".motion-card");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    };

    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.16 },
    );

    revealItems.forEach((item) => observer.observe(item));
    updateScroll();

    if (!prefersReducedMotion) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="cursor-spotlight" aria-hidden="true" />
    </>
  );
}

function MotionDock() {
  return (
    <nav className="motion-dock" aria-label="WorldScope sections" data-reveal>
      <a href="#" className="motion-brand">
        <span>WorldScope</span>
        <strong>Live Forecast</strong>
      </a>
      <div className="motion-links">
        <a href="#model">Model</a>
        <a href="#distribution">Distribution</a>
        <a href="#bracket">Bracket</a>
        <a href="#groups">Groups</a>
      </div>
      <a href="#bracket" className="motion-cta">Open Path</a>
    </nav>
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
  const r32Matches = forecast.knockout.filter((match) => match.round === "R32");
  const futureMatches = forecast.knockout.filter((match) => match.round !== "R32" && match.status === "forecast");
  const heroSignals = [
    `${topThree[0].team.name} ${(topThree[0].probability * 100).toFixed(1)}%`,
    `${topThree[1].team.name} ${(topThree[1].probability * 100).toFixed(1)}%`,
    `${topThree[2].team.name} ${(topThree[2].probability * 100).toFixed(1)}%`,
    final ? `预测决赛 ${final.home.name} ${final.homeGoals}-${final.awayGoals} ${final.away.name}` : "决赛路径生成中",
    `真实 32 强赛果 ${r32Matches.filter((match) => match.status === "actual").length} 场`,
    `16 强以后模型预测 ${futureMatches.length} 场`,
  ];

  return (
    <section className="hero-section">
      <div className="hero-grid">
        <div className="hero-copy" data-reveal>
          <div className="eyebrow">
            <Trophy size={16} />
            Qoder World Cup Forecast Agent
          </div>
          <h1>
            世界杯冠军预测 Agent：
            <span className="kinetic-title">从分组到决赛的可解释推演。</span>
          </h1>
          <p className="hero-lede">
            当前模型在真实赛果快照基础上继续预测冠军为 <strong>{champion.name}</strong>。系统以公开分组、
            小组积分、已结束 32 强赛果、阵容结构和淘汰赛经验构建推演链路。
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
            <span>数据快照：{dataSnapshot.date}</span>
            <span>{dataSnapshot.label}</span>
            <span>真实赛果 + 模型续推</span>
          </div>
          <HeroMotionWall forecast={forecast} final={final} />
          <SignalTicker items={heroSignals} />
        </div>

        <div className="hero-visual" data-reveal>
          <div className="champion-card motion-card">
            <img
              className="champion-backdrop"
              src={heroImage}
              alt="夜色足球场与数据粒子构成的冠军预测视觉"
            />
            <ChampionRadar champion={champion} />
            <div className="card-topline">
              <span>Predicted Champion</span>
              <Sparkles size={18} />
            </div>
            <div className="champion-identity">
              <TeamCrest team={champion} size="large" />
              <div>
                <div className="champion-code">{champion.code}</div>
                <h2>
                  <TeamFlag team={champion} />
                  {champion.name}
                </h2>
              </div>
            </div>
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
                <TeamMark team={item.team} variant="inline" />
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

function HeroMotionWall({ forecast, final }: { forecast: Forecast; final?: MatchPrediction }) {
  const actualMatches = forecast.knockout.filter((match) => match.status === "actual").length;
  const forecastMatches = forecast.knockout.filter((match) => match.status === "forecast").length;
  const topPick = forecast.probabilities[0];
  const cards = [
    {
      label: "Live Data",
      value: `${actualMatches} locked`,
      detail: "openfootball verified",
    },
    {
      label: "Signal",
      value: `${(topPick.probability * 100).toFixed(1)}%`,
      detail: `${topPick.team.name} champion lane`,
    },
    {
      label: "Final",
      value: final ? `${final.homeGoals}-${final.awayGoals}` : "building",
      detail: final ? `${final.home.name} / ${final.away.name}` : "model pending",
    },
    {
      label: "Forecast",
      value: `${forecastMatches} paths`,
      detail: "R16 to final",
    },
  ];

  return (
    <div className="motion-wall" aria-label="实时预测动态卡片">
      {cards.map((card, index) => (
        <div
          className="motion-tile motion-card"
          key={card.label}
          style={{ "--card-delay": `${index * 80}ms` } as React.CSSProperties}
          data-reveal
        >
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.detail}</small>
        </div>
      ))}
    </div>
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

function TeamFlag({ team }: { team: Team }) {
  return <img className="team-flag" src={flagUrl(team)} alt={`${team.name}国旗`} loading="lazy" />;
}

function TeamCrest({ team, size = "normal" }: { team: Team; size?: "small" | "normal" | "large" }) {
  const visual = visualForTeam(team);
  return (
    <span
      className={`team-crest ${size}`}
      style={
        {
          "--crest-primary": visual.primary,
          "--crest-secondary": visual.secondary,
          "--crest-accent": visual.accent,
        } as React.CSSProperties
      }
      aria-label={`${team.name}原创队徽`}
      title={`${team.name}原创队徽`}
    >
      <span>{team.code}</span>
    </span>
  );
}

function TeamMark({
  team,
  variant = "default",
}: {
  team: Team;
  variant?: "default" | "inline" | "compact";
}) {
  return (
    <span className={`team-mark ${variant}`}>
      <TeamCrest team={team} size={variant === "compact" ? "small" : "normal"} />
      <TeamFlag team={team} />
      <span className="team-mark-name">{team.name}</span>
      {variant === "default" && <span className="team-mark-code">{team.code}</span>}
    </span>
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
    <div className="weight-panel motion-card">
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
  const marqueeItems = [...contenders, ...contenders];

  return (
    <section className="probability-section" id="distribution" data-reveal>
      <div className="section-heading" data-reveal>
        <span className="section-kicker">Champion Distribution</span>
        <h2>冠军候选分布</h2>
        <p>softmax 概率用于排序，不声称等同真实博彩概率；它更适合作为 Agent 的可解释相对信心。</p>
      </div>
      <div className="probability-grid">
        {contenders.map((item, index) => (
          <article
            className="probability-card motion-card"
            key={item.team.code}
            style={{ "--card-delay": `${index * 70}ms` } as React.CSSProperties}
            data-reveal
          >
            <div className="probability-card-head">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <TeamCrest team={item.team} size="small" />
            </div>
            <h3>
              <TeamFlag team={item.team} />
              {item.team.name}
            </h3>
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
      <div className="contender-marquee" aria-label="冠军候选动态展台">
        <div className="contender-track">
          {marqueeItems.map((item, index) => (
            <span className="contender-chip" key={`${item.team.code}-${index}`}>
              <TeamCrest team={item.team} size="small" />
              <TeamFlag team={item.team} />
              <strong>{item.team.name}</strong>
              <em>{(item.probability * 100).toFixed(1)}%</em>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataIntelligenceSection() {
  const sources = [
    {
      label: "官方分组",
      value: "12 组 48 队",
      detail: "按 openfootball/worldcup 的 2026--usa/cup.txt 核对分组，保留 Football.TXT 原始赛事结构。",
    },
    {
      label: "小组积分",
      value: "最终排名与 GD",
      detail: "由 openfootball 小组赛比分汇总为积分、进球、失球和净胜球，页面展示真实晋级状态。",
    },
    {
      label: "淘汰赛赛果",
      value: "32 强 16 场锁定",
      detail: "按 2026--usa/cup_finals.txt 锁定 Match 73-88，16 强以后只从真实晋级球队继续推演。",
    },
    {
      label: "模型特征",
      value: "实力 / 状态 / 深度",
      detail: "16 强及后续比赛继续使用权重模型输出胜率、比分和解释语句。",
    },
  ];

  return (
    <section className="data-section" data-reveal>
      <div className="section-heading wide" data-reveal>
        <span className="section-kicker">Data Acquisition</span>
        <h2>数据采集与特征工程</h2>
        <p>
          {dataSnapshot.note} 数据层保留来源边界，页面只呈现可复核的赛程状态、预测结果和推理依据。
        </p>
      </div>
      <div className="data-visual-strip motion-card" data-reveal>
        <img src={pitchTextureImage} alt="球场纹理、足球皮革与数据网格的抽象背景" loading="lazy" />
        <div>
          <span>Structured Snapshot</span>
          <strong>48 teams / 12 groups / live knockout state</strong>
        </div>
      </div>
      <div className="data-grid">
        {sources.map((source, index) => (
          <article
            className="data-card motion-card"
            key={source.label}
            style={{ "--card-delay": `${index * 90}ms` } as React.CSSProperties}
            data-reveal
          >
            <span>{source.label}</span>
            <strong>{source.value}</strong>
            <p>{source.detail}</p>
          </article>
        ))}
      </div>
      <div className="feature-flow" data-reveal>
        <span>raw data</span>
        <ChevronRight size={17} />
        <span>feature score</span>
        <ChevronRight size={17} />
        <span>match probability</span>
        <ChevronRight size={17} />
        <span>scoreline</span>
        <ChevronRight size={17} />
        <span>explanation</span>
      </div>
    </section>
  );
}

function ReasoningSection({ forecast }: { forecast: Forecast }) {
  const final = forecast.knockout.find((match) => match.round === "F");
  const championProbability = forecast.probabilities.find((item) => item.team.code === forecast.champion.code);
  const route = forecast.knockout
    .filter((match) => match.winner.code === forecast.champion.code)
    .map((match) => `${match.round}: ${match.home.name} ${match.homeGoals}-${match.awayGoals} ${match.away.name}`);

  return (
    <section className="reasoning-section" data-reveal>
      <div className="reasoning-panel motion-card">
        <div>
          <span className="section-kicker">Reasoning Chain</span>
          <h2>{forecast.champion.name} 为什么是当前冠军预测？</h2>
          <p>
            模型不只给出单点答案，而是给出从小组赛到决赛的路径、每场胜率、比分和关键依据。
            默认权重下，{forecast.champion.name} 的冠军相对概率为{" "}
            <strong>{championProbability ? (championProbability.probability * 100).toFixed(1) : "-"}%</strong>。
          </p>
        </div>
        <div className="reasoning-stack">
          {final?.explanation.map((line, index) => (
            <div className="reasoning-step motion-card" key={line} data-reveal>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{line}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="route-strip motion-card" data-reveal>
        {route.slice(-5).map((item, index) => (
          <span key={item} style={{ "--card-delay": `${index * 90}ms` } as React.CSSProperties}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ScenarioSection({
  weights,
  onApply,
}: {
  weights: Weights;
  onApply: (weights: Weights) => void;
}) {
  const scenarios: { title: string; text: string; weights: Weights }[] = [
    {
      title: "稳态实力模型",
      text: "更重视长期实力和阵容深度，适合评估冠军级强队下限。",
      weights: defaultWeights,
    },
    {
      title: "状态爆发模型",
      text: "提高近期状态权重，观察黑马球队是否能突破默认路径。",
      weights: { strength: 24, form: 38, depth: 14, knockout: 14, travel: 10 },
    },
    {
      title: "杯赛经验模型",
      text: "强调淘汰赛经验和低比分能力，适合预测强强对话。",
      weights: { strength: 28, form: 16, depth: 16, knockout: 30, travel: 10 },
    },
    {
      title: "北美适应模型",
      text: "提高场地适应权重，测试东道主与美洲球队的赛程红利。",
      weights: { strength: 26, form: 18, depth: 16, knockout: 12, travel: 28 },
    },
  ];

  return (
    <section className="scenario-section" data-reveal>
      <div className="section-heading wide" data-reveal>
        <span className="section-kicker">What-if Lab</span>
        <h2>情景实验：评审可现场切换模型假设</h2>
        <p>
          预测逻辑不固定在一组参数里。点击不同情景后，Agent 会重算冠军概率、小组出线、淘汰赛路径和比分。
        </p>
      </div>
      <div className="scenario-grid">
        {scenarios.map((scenario, index) => {
          const active = (Object.keys(weights) as WeightKey[]).every((key) => weights[key] === scenario.weights[key]);
          return (
            <button
              className={`scenario-card motion-card ${active ? "active" : ""}`}
              key={scenario.title}
              onClick={() => onApply(scenario.weights)}
              style={{ "--card-delay": `${index * 80}ms` } as React.CSSProperties}
              type="button"
              data-reveal
            >
              <span>{scenario.title}</span>
              <p>{scenario.text}</p>
              <strong>
                {Object.entries(scenario.weights)
                  .map(([key, value]) => `${weightMeta[key as WeightKey].short}${value}`)
                  .join(" / ")}
              </strong>
            </button>
          );
        })}
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
    <section className="bracket-section" id="bracket" data-reveal>
      <div className="bracket-intro">
        <div className="section-heading wide" data-reveal>
          <span className="section-kicker">Knockout Path</span>
          <h2>淘汰赛逐层推演</h2>
          <p>32 强 16 场全部按 openfootball 真实赛果锁定，16 强及后续轮次由双方综合评分、攻防错位和杯赛修正生成预测。</p>
        </div>
        <figure className="bracket-art motion-card" data-reveal>
          <img src={knockoutOrbImage} alt="金色足球奖杯剪影与透明赛程球体" loading="lazy" />
        </figure>
      </div>

      <div className="final-strip">
        {semis.map((match) => (
          <MatchCard match={match} key={match.id} compact />
        ))}
        {final && <MatchCard match={final} featured />}
      </div>

      <div className="rounds-grid">
        {rounds.map((round) => (
          <div className="round-column motion-card" key={round.key} data-reveal>
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
      className={`match-card motion-card ${compact ? "compact" : ""} ${featured ? "featured" : ""}`}
      style={{ "--confidence": `${confidence}%` } as React.CSSProperties}
      data-reveal
    >
      <div className="match-slot">{match.slot}</div>
      <div className={`match-status ${match.status}`}>
        {match.status === "actual" ? "真实赛果" : "模型预测"}
        {match.scoreNote && match.scoreNote !== "真实赛果" ? ` · ${match.scoreNote}` : ""}
      </div>
      <div className={`team-line ${homeWinner ? "winner" : ""}`}>
        <TeamMark team={match.home} variant="compact" />
        <strong>{match.homeGoals}</strong>
      </div>
      <div className={`team-line ${!homeWinner ? "winner" : ""}`}>
        <TeamMark team={match.away} variant="compact" />
        <strong>{match.awayGoals}</strong>
      </div>
      <div className="match-confidence">
        <span>{match.status === "actual" ? `${match.winner.name} 模型赛前胜率` : `${match.winner.name} 胜率`}</span>
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
    <section className="groups-section" id="groups" data-reveal>
      <div className="section-heading" data-reveal>
        <span className="section-kicker">Group Snapshot</span>
        <h2>小组赛真实积分与晋级状态</h2>
        <p>表格按 openfootball/worldcup 2026--usa 小组赛比分汇总：前两名直接晋级，第三名仅在公开资料标记为晋级时进入 32 强。</p>
      </div>
      <div className="groups-grid">
        {forecast.groups.map((group) => (
          <article className="group-card motion-card" key={group.group} data-reveal>
            <div className="group-title">Group {group.group}</div>
            {group.standings.map((standing, index) => (
              <div className="standing-row" key={standing.team.code}>
                <span
                  className={`standing-index ${
                    standing.status === "qualified"
                      ? "qualified"
                      : standing.status === "thirdQualified"
                        ? "third"
                        : ""
                  }`}
                >
                  {index + 1}
                </span>
                <TeamMark team={standing.team} variant="compact" />
                <span className="standing-points">{standing.expectedPoints} pts</span>
                <span className="standing-gd">
                  {standing.goalDifference >= 0 ? "+" : ""}
                  {standing.goalDifference}
                </span>
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
      text: "整理官方分组、真实小组积分、32 强赛果、公开排名、阵容状态和旅行适应度，形成可替换数据表。",
    },
    {
      icon: Brain,
      title: "Reasoning Core",
      text: "将权重转成综合评分，再叠加攻防错位和杯赛经验，逐轮计算胜率、比分和解释语句。",
    },
    {
      icon: BarChart3,
      title: "Visual Layer",
      text: "展示冠军概率、真实小组积分、淘汰赛树、决赛推理和参数实验，用户可直接交互验证。",
    },
    {
      icon: Cloud,
      title: "Deploy Surface",
      text: "静态构建面向公开访问，可迁移到阿里云 OSS、ESA 或函数计算静态托管。",
    },
  ];

  return (
    <section className="architecture-section" id="architecture" data-reveal>
      <div className="section-heading wide" data-reveal>
        <span className="section-kicker">System Design</span>
        <h2>Agent 系统架构</h2>
        <p>系统由数据快照、评分模型、赛程推演和解释输出组成，页面中可以直接看到每一层如何影响冠军预测。</p>
      </div>
      <div className="architecture-grid">
        {items.map((item, index) => (
          <article
            className="architecture-card motion-card"
            key={item.title}
            style={{ "--card-delay": `${index * 100}ms` } as React.CSSProperties}
            data-reveal
          >
            <item.icon size={24} />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="pipeline" data-reveal>
        <span>公开数据</span>
        <ChevronRight size={18} />
        <span>权重模型</span>
        <ChevronRight size={18} />
        <span>赛程推演</span>
        <ChevronRight size={18} />
        <span>可视化页面</span>
        <ChevronRight size={18} />
        <span>公开访问</span>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
