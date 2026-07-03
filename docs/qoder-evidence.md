# Qoder / QoderWork 使用证据

## 已完成

- 已安装 Qoder CLI 国际版。
- 已使用 `macy200201@gmail.com` 登录 Qoder CLI。
- 登录状态验证结果：

```text
Version: 1.0.36
Username: yuan a
Email: macy200201@gmail.com
```

## 当前限制

`qodercli --list-models` 当前返回：

```text
Warning: no models available for your account.
```

这说明 CLI 已登录，但账号当前没有可用模型权限。作品代码和文档已按 Qoder 参赛要求组织，后续若账号开通 Credits 或模型权限，可继续用 Qoder CLI/Qoder Desktop 补充开发过程截图和 QoderWork 路演材料截图。

## 可截图证据建议

- Qoder CLI 登录状态：`qodercli status`
- Qoder CLI 版本：`qodercli --version`
- 当前项目文件树：`world-cup-agent/src`
- 本地运行页面：`http://127.0.0.1:5176/`
- 构建验证：`pnpm exec tsc --noEmit` 和 `pnpm exec vite build`
- 架构文档：`docs/architecture.md`

## 后续 QoderWork 材料

按赛题要求，论坛帖需要展示 Qoder/QoderWork 工作界面截图和对话结果。建议用 QoderWork 制作 5 页路演材料：

1. 赛题理解与目标
2. Agent 架构与数据链路
3. 预测模型与可解释权重
4. 可视化页面与交互演示
5. 部署地址与后续规划
