# Qoder 世界杯冠军预测 Agent

天池「Qoder码力星期四·世界杯冠军预测Agent开发挑战赛」参赛作品。

本项目实现一个可解释的世界杯冠军预测 Agent：

- 数据层：球队分组、评分指标、赛程推演、赔率式胜率转换。
- 真实数据：分组、小组赛比分、最终积分和 32 强赛果参考 `openfootball/worldcup` 的 `2026--usa/cup.txt` 与 `cup_finals.txt`。
- 决策层：实力、近期状态、淘汰赛经验、阵容深度、旅途/主场适应五类权重。
- 展示层：冠军概率、分组预测、淘汰赛对阵树、比分预测、解释证据和权重调节。
- 提交流程：可部署为静态站点，并在天池赛事论坛发布公开地址、开发思路和 Qoder 使用证据。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run typecheck
npm run build
```

构建产物在 `dist/`。

## 在线访问

https://chengyuann.github.io/qoder-world-cup-agent/
