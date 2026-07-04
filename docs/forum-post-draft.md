# Qoder码力星期四·世界杯挑战赛 - WorldScope 世界杯冠军预测 Agent

## 作品公开地址

https://chengyuann.github.io/qoder-world-cup-agent/

## 作品简介

WorldScope 是一个世界杯冠军预测 Agent。它参考 openfootball/worldcup 的 2026--usa 真实赛程数据，锁定小组赛比分、最终积分和 32 强 16 场真实赛果，再预测 16 强到决赛的逐轮赛果、比分和最终冠军，并用可视化页面展示完整推理过程。

当前默认模型预测冠军为法国，主要竞争者包括阿根廷、西班牙、巴西、德国、葡萄牙和英格兰。预测结果不是黑箱输出，页面提供五类可调权重：综合实力、近期状态、阵容深度、淘汰赛经验、场地适应。评审可以调节权重，实时观察冠军路径和概率变化。

## 系统架构设计

Agent 分为五层：

1. 数据采集层：整理球队分组、公开排名、近期状态、阵容深度、攻防能力和北美场地适应度。
2. 特征工程层：将球队转换为综合实力、近期状态、阵容深度、淘汰赛经验、场地适应五类特征。
3. 推理决策层：根据权重计算综合评分，叠加攻防错位和杯赛修正，生成胜率、比分和解释。
4. 可视化层：展示冠军概率、小组积分表、淘汰赛对阵树、决赛推理和权重实验台。
5. 部署层：Vite + React 静态站点，可部署到 GitHub Pages，也可迁移到阿里云 OSS/ESA/函数计算静态托管。

## 可视化呈现

页面包含：

- 冠军预测卡片
- 冠军候选概率分布
- 权重调节实验台
- 小组赛真实积分与晋级状态
- 32 强、16 强、8 强、半决赛、决赛对阵树
- 决赛比分与推理解释
- 开发工具链和合规说明

## 创新与创意

- 将冠军预测做成可调参数实验台，避免只有一个黑箱答案。
- 同时输出比分、赛程树、概率和解释，便于评审验证预测路径。
- 引入“北美场地适应度”作为 2026 世界杯特有变量。
- 将系统架构和提交证据集成到页面中，方便论坛公开评审。

## Qoder / QoderWork 使用说明

本作品开发过程使用 Qoder CLI 国际版作为参赛工具链入口，CLI 已使用 `macy200201@gmail.com` 登录，并已确认可用模型包括 Qwen3.7-Max、Qwen3.7-Plus、Kimi-K2.7-Code 等。

Qoder CLI 实际参与了以下环节：

- 使用 Qwen3.7-Max 生成系统架构、数据流、推理链路和可视化亮点总结。
- 使用 Kimi-K2.7-Code 对当前 React/Vite 代码做代码质量检查，并给出模型、类型、构建和 Qwen API 接入建议。
- 使用 Qwen3.7-Plus 生成路演材料提纲。

对应原始输出和截图式证据已整理在 `evidence/` 目录。

建议插入截图：

1. `evidence/screenshots/00_qoder_cli_status_models.png`：Qoder CLI 登录状态与可用模型
2. `evidence/screenshots/01_qwen_architecture.png`：Qwen3.7-Max 架构总结对话结果
3. `evidence/screenshots/02_kimi_code_review.png`：Kimi-K2.7-Code 代码质量检查对话结果
4. `evidence/screenshots/03_qwen_roadshow_outline.png`：Qwen3.7-Plus 路演提纲对话结果
5. `evidence/screenshots/04_qoder_desktop_project_window.png`：Qoder Desktop 项目窗口截图
6. 如评审明确要求 QoderWork 独立界面，请补充 QoderWork 路演材料页面截图

## 验证结果

本地已完成：

```bash
pnpm exec tsc --noEmit
pnpm exec vite build
```

构建产物可部署为静态页面。

公开页面已通过 HTTP 200 与 Playwright 页面标题验证。

## 后续规划

- 接入 Qwen API 或百炼应用接口，把当前静态推演升级为可对话 Agent。
- 将数据层拆成可更新 JSON，支持赛程和球队数据一键刷新。
- 部署到阿里云静态服务，补齐赛题加分项。
