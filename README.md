# yunning-skills

[中文](#中文) | [English](#english)

## 中文

面向通用 Agent 工作流的可复用 skills 仓库。

这个仓库收集小而专注的 skills，用来帮助 Agent 处理本地文件、开发工具、笔记、图表和其他可重复工作流。每个 skill 都尽量保持自包含，方便复制、安装、审查和发布。

### Skills

- [obsidian-excalidraw-workflow](#obsidian-excalidraw-workflow-中文)

#### obsidian-excalidraw-workflow 中文

创建、检查、转换和修复 Obsidian Excalidraw `.excalidraw.md` 图形文件，让它们能在 Obsidian Excalidraw 插件中正确打开。

链接：[文件夹](skills/obsidian-excalidraw-workflow/) | [SKILL.md](skills/obsidian-excalidraw-workflow/SKILL.md)

亮点：

- 创建 Obsidian 原生 `.excalidraw.md` 文件
- 自动检测目标 vault 的 Excalidraw 保存格式
- 支持 `compressed-json` 和未压缩 `json` drawing block
- 将写入限制在声明的 vault 根目录内
- 默认拒绝覆盖，除非显式要求
- 提供 inspect、dry-run 和 verify 模式

## English

Reusable skills for general agent workflows.

This repository collects focused skills that help agents work with local files, developer tools, notes, diagrams, and other repeatable workflows. Each skill is kept small and self-contained so it can be copied, installed, reviewed, or published independently.

### Skills

- [obsidian-excalidraw-workflow](#obsidian-excalidraw-workflow-english)

#### obsidian-excalidraw-workflow English

Create, inspect, convert, and repair Obsidian Excalidraw `.excalidraw.md` drawings so they open correctly in the Obsidian Excalidraw plugin.

Links: [folder](skills/obsidian-excalidraw-workflow/) | [SKILL.md](skills/obsidian-excalidraw-workflow/SKILL.md)

Highlights:

- Creates Obsidian-native `.excalidraw.md` files
- Detects the target vault's Excalidraw save format
- Supports `compressed-json` and uncompressed `json` drawing blocks
- Constrains writes to the declared vault root
- Refuses overwrites unless explicitly requested
- Provides inspect, dry-run, and verification modes
