---
name: obsidian-excalidraw-workflow
description: Create, inspect, convert, or repair Obsidian Excalidraw .excalidraw.md drawings so they open correctly in the Obsidian Excalidraw plugin, with compressed-json conversion and vault-safe writes.
---

# Obsidian Excalidraw Workflow

[中文](#中文) | [English](#english)

## 中文

这个 skill 用于创建、检查、转换和修复 Obsidian Excalidraw `.excalidraw.md` 图形文件，让生成的图能在 Obsidian Excalidraw 插件中正确打开。

核心能力：

- 根据目标 vault 的 Excalidraw 插件配置自动选择 `compressed-json` 或 `json` 保存格式
- 将输出限制在声明的 vault 根目录内
- 默认拒绝覆盖已有文件，除非显式传入 `--force`
- 提供 `--inspect`、`--dry-run` 和 `--verify` 模式
- 适合排查 `.excalidraw.md` 显示为 raw Markdown 的问题

## 适用场景

当 Agent 需要创建、检查、转换或修复 Obsidian Excalidraw `.excalidraw.md` 文件时使用这个 skill。如果输出必须能在 Obsidian Excalidraw 插件中打开，优先使用这个 skill，而不是通用 Excalidraw skill。

## 前置条件

- 需要可用的 Node.js 来运行 `scripts/write_excalidraw_compressed.js`。
- 目标文件夹必须是 Obsidian vault，并且包含 `.obsidian` 目录。
- 如果需要插件兼容输出，请在目标 vault 中安装 Obsidian Excalidraw community plugin。

## 输入

- `--vault-root`: Obsidian vault 根目录。所有脚本模式都需要。
- `--input`: 要转换的 Excalidraw scene JSON 文件。
- `--from-md`: 要检查并重写的现有 `.excalidraw.md` 文件。
- `--output`: vault-relative 或绝对 `.excalidraw.md` 输出路径。
- `--inspect`: 只检查现有 `.excalidraw.md` 文件，不写入。
- 可选参数：`--format auto|compressed-json|json`、`--tags`、`--created`、`--dry-run`、`--verify`、`--force`。

## 输出

- 在声明的 vault 内写入插件兼容的 `.excalidraw.md` 文件。
- 为 `--dry-run`、`--verify` 和 `--inspect` 打印 JSON 摘要。
- 拒绝写入 `--vault-root` 之外的路径；没有 `--force` 时拒绝覆盖。

## 首次检查

1. 从用户或项目上下文确认目标 vault 路径，不要假设默认 vault。
2. 检查 `.obsidian/plugins/obsidian-excalidraw-plugin/manifest.json` 或插件目录，确认 Excalidraw 插件存在。
3. 如果 vault 里已有用户创建的 `.excalidraw.md` 文件，生成前先检查一个样例，匹配该 vault 的实际保存格式。
4. 优先把新图写在 vault 内，并用 vault-relative Obsidian embed 链接。

## 安全说明

这个 skill 会向指定 Obsidian vault 路径写入 `.excalidraw.md` 文件。随附脚本不会执行 Excalidraw scene JSON 中的代码，不会运行子进程，也不会发起网络请求。

脚本会读取目标 vault 的 Excalidraw 插件设置，验证 scene JSON，然后把 Obsidian Markdown wrapper 写入请求的输出文件。只有传入 `--force` 时才会覆盖该精确输出文件。

## 安全检查

使用 `scripts/write_excalidraw_compressed.js` 时传入 `--vault-root` 和 `--output`。脚本会：

1. 要求 `--vault-root` 存在并包含 `.obsidian` 目录。
2. 接受绝对 `--output` 路径或 vault-relative 输出路径，并要求解析后的路径位于 `--vault-root` 内。
3. 要求输出路径以 `.excalidraw.md` 结尾。
4. 要求输出文件的父目录已经存在。
5. 除非命令包含 `--force`，否则拒绝覆盖已有文件。
6. 写入 YAML frontmatter 前验证 tags 和 `created`。
7. 支持 `--dry-run` 进行无写入预览，支持 `--verify` 进行写入后的 round-trip 检查。

运行脚本前请主动创建目标文件夹。不要把 `--vault-root` 指向 home 目录、磁盘根目录等过宽路径。

## 存储格式

不要假设 `.excalidraw.md` 一定是未压缩 parsed Markdown。可用时读取目标 vault 的 Excalidraw 插件设置：`.obsidian/plugins/obsidian-excalidraw-plugin/data.json`。

- 如果 `compress` 是 `true`，写入 `compressed-json` block。
- 如果 `compress` 是 `false`，写入 `json` block。
- 如果缺少该设置，检查同一 vault 中已有的 drawing。随附脚本无法判断时默认使用 `compressed-json`。
- 不要用 `decompressForMDView` 决定保存的 drawing block 格式。该设置控制插件切换到 Markdown view 时是否自动解压 drawing；保存格式仍应跟随 `compress`。

许多 Obsidian Excalidraw vault 会把 drawing 保存为包含 `## Drawing` fenced `compressed-json` block 的 Markdown：

````text
== Switch to EXCALIDRAW VIEW in the document menu. ==
You can decompress Drawing data with the command palette.
Check plugin settings under 'Saving' for more details.

## Drawing
```compressed-json
<compressed Excalidraw scene>
```
````

如果插件保存压缩 drawing，手写的 `# Excalidraw Data`、`## Text Elements` 和未压缩 `json` fence 可能显示异常。无法确定时，先在目标 vault 中用 Obsidian 创建一个很小的 drawing，检查该文件，并匹配它的格式。

## 创建流程

1. 构建有效的 Excalidraw scene JSON object，包含：
   - `type: "excalidraw"`
   - `version: 2`
   - `source`
   - `elements`
   - `appState`
   - `files: {}`
2. 从 skill 文件夹运行 `scripts/write_excalidraw_compressed.js`，或使用安装后 skill 目录里的绝对脚本路径，写入插件兼容的 `.excalidraw.md` 文件。脚本默认使用 `--format auto`，并在可用时匹配目标 vault 的 `compress` 设置。
3. 在 Obsidian note 中用 vault-relative 语法嵌入 drawing：

```md
![[Diagrams/relationship.excalidraw.md]]
```

4. 让用户重新打开 note 或切换到 Excalidraw View。如果 drawing 仍显示 raw Markdown，把生成文件和同一 vault 中新建的 Excalidraw 文件对比。

## 脚本用法

从 skill 根目录运行命令，或把 `scripts/write_excalidraw_compressed.js` 替换成已安装 skill 目录中的绝对脚本路径。以下示例假设 vault 中已经存在 `Diagrams` 目标文件夹。`--vault-root` 使用绝对路径；除非必须使用绝对输出路径，`--output` 建议使用 vault-relative 路径。

## 示例

只检查现有 drawing，不写入：

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --inspect "Diagrams/relationship.excalidraw.md"
```

从 scene JSON 创建或重写 drawing：

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --input scene.json \
  --output "Diagrams/relationship.excalidraw.md" \
  --tags excalidraw,diagram \
  --verify
```

PowerShell 等价命令：

```powershell
node scripts\write_excalidraw_compressed.js `
  --vault-root "C:\path\to\vault" `
  --input scene.json `
  --output "Diagrams\relationship.excalidraw.md" `
  --tags excalidraw,diagram `
  --verify
```

预览同一操作但不写入：

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --input scene.json \
  --output "Diagrams/relationship.excalidraw.md" \
  --tags excalidraw,diagram \
  --dry-run
```

转换包含未压缩 fenced `json` drawing block 或现有 `compressed-json` block 的 `.excalidraw.md`：

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --from-md "/path/to/vault/Diagrams/relationship.excalidraw.md" \
  --output "/path/to/vault/Diagrams/relationship.excalidraw.md" \
  --force \
  --tags excalidraw,diagram \
  --verify
```

## 排障

- 如果 Obsidian 只显示 warning text，请用 note 菜单切换到 Excalidraw View。
- 如果切换视图后仍失败，检查同一 vault 中新建的 Excalidraw 文件，并精确匹配它的存储格式。
- 如果插件创建的文件使用 `compressed-json`，不要输出未压缩 `json` 或 `# Excalidraw Data`，除非用户明确需要 decompressed storage。
- 如果生成的 embed 不可见，检查链接目标是否是准确的 vault-relative 路径，包括 Unicode 字符、空格和文件夹名。
- 对包含空格或 Unicode 字符的路径加引号。shell 或平台可能使用 legacy encoding 时，对 Markdown 读写使用显式 UTF-8 encoding。
- 先保持生成图小而简单。插件能显示后，再优化布局、标签和样式。

## English

Use this skill when working with Obsidian vault notes that include Excalidraw drawings. It is designed for local vaults that use the Obsidian Excalidraw community plugin and need generated diagrams to render in Excalidraw view instead of appearing as raw Markdown.

## When to Use

Use this skill when an agent needs to create, inspect, convert, or repair Obsidian Excalidraw `.excalidraw.md` files. Prefer it over generic Excalidraw skills when the output must open inside the Obsidian Excalidraw plugin.

## Prerequisites

- Node.js must be available to run `scripts/write_excalidraw_compressed.js`.
- The target folder must be an Obsidian vault with a `.obsidian` directory.
- Install the Obsidian Excalidraw community plugin in the vault when plugin-compatible output is required.

## Inputs

- `--vault-root`: Obsidian vault root. Required for all script modes.
- `--input`: Excalidraw scene JSON file to convert.
- `--from-md`: Existing `.excalidraw.md` file to inspect and rewrite.
- `--output`: Vault-relative or absolute `.excalidraw.md` output path.
- `--inspect`: Existing `.excalidraw.md` file to inspect without writing.
- Optional flags: `--format auto|compressed-json|json`, `--tags`, `--created`, `--dry-run`, `--verify`, and `--force`.

## Outputs

- Write a plugin-compatible `.excalidraw.md` file inside the declared vault.
- Print JSON summaries for `--dry-run`, `--verify`, and `--inspect`.
- Refuse writes outside `--vault-root` or overwrites without `--force`.

## First Checks

1. Confirm the target vault path from the user or surrounding project context. Do not assume a default vault.
2. Confirm the Excalidraw plugin exists by checking `.obsidian/plugins/obsidian-excalidraw-plugin/manifest.json` or the plugin directory.
3. If the vault already has user-created `.excalidraw.md` files, inspect one before generating anything. Match the vault's actual save format.
4. Prefer writing new drawings inside the vault and linking them with vault-relative Obsidian embeds.

## Security Considerations

This skill writes `.excalidraw.md` files to the specified Obsidian vault path. The bundled script does not execute code from Excalidraw scene JSON, run subprocesses, or make network requests.

The script reads the target vault's Excalidraw plugin settings. It then validates the scene JSON and writes an Obsidian Markdown wrapper to the requested output file. It only overwrites that exact output file with `--force`.

## Safety Checks

Use `scripts/write_excalidraw_compressed.js` with `--vault-root` and `--output`. The script will:

1. Require `--vault-root` to exist and contain a `.obsidian` directory.
2. Accept an absolute `--output` path or a vault-relative output path, then require it to resolve inside `--vault-root`.
3. Require the output path to end with `.excalidraw.md`.
4. Require the output parent directory to already exist.
5. Refuse to overwrite an existing file unless the command includes `--force`.
6. Validate tags and `created` before writing YAML frontmatter.
7. Support `--dry-run` for a no-write preview and `--verify` for a post-write round-trip check.

Create destination folders deliberately before running the script. Do not point `--vault-root` at a broad directory such as a home folder or drive root.

## Storage Format

Do not assume `.excalidraw.md` means uncompressed parsed Markdown. Read the target vault's Excalidraw plugin settings at `.obsidian/plugins/obsidian-excalidraw-plugin/data.json` when available:

- If `compress` is `true`, write a `compressed-json` block.
- If `compress` is `false`, write a `json` block.
- If the setting is missing, inspect an existing drawing from the same vault. The bundled script defaults to `compressed-json` if it cannot determine the setting.
- Do not use `decompressForMDView` to choose the saved drawing block format. That setting controls whether the plugin auto-decompresses the drawing when switching to Markdown view; the saved format should still follow `compress`.

Many Obsidian Excalidraw vaults save drawings as Markdown with a `## Drawing` fenced `compressed-json` block:

````text
== Switch to EXCALIDRAW VIEW in the document menu. ==
You can decompress Drawing data with the command palette.
Check plugin settings under 'Saving' for more details.

## Drawing
```compressed-json
<compressed Excalidraw scene>
```
````

A hand-written file with `# Excalidraw Data`, `## Text Elements`, and an uncompressed `json` fence may display incorrectly when the plugin saves compressed drawings. When in doubt, create a tiny drawing in the target vault with Obsidian first. Inspect that file and mirror its format.

## Creation Workflow

1. Build a valid Excalidraw scene JSON object with:
   - `type: "excalidraw"`
   - `version: 2`
   - `source`
   - `elements`
   - `appState`
   - `files: {}`
2. Run `scripts/write_excalidraw_compressed.js` from this skill folder, or call the script by absolute path from the installed skill directory, to write a plugin-compatible `.excalidraw.md` file. The script uses `--format auto` by default and matches the target vault's `compress` setting when available.
3. Embed the drawing in an Obsidian note with vault-relative syntax:

```md
![[Diagrams/relationship.excalidraw.md]]
```

4. Ask the user to reopen the note or switch to Excalidraw View. If the drawing still shows raw Markdown, compare the generated file against a newly-created Excalidraw file from the same vault.

## Script Usage

Run commands from the skill root, or replace `scripts/write_excalidraw_compressed.js` with the absolute script path in the installed skill directory. The examples assume the destination `Diagrams` folder already exists in the vault. Use an absolute path for `--vault-root`; use a vault-relative path for `--output` unless an absolute output path is necessary.

## Examples

Inspect an existing drawing without writing:

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --inspect "Diagrams/relationship.excalidraw.md"
```

Create or rewrite a drawing from scene JSON:

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --input scene.json \
  --output "Diagrams/relationship.excalidraw.md" \
  --tags excalidraw,diagram \
  --verify
```

PowerShell equivalent:

```powershell
node scripts\write_excalidraw_compressed.js `
  --vault-root "C:\path\to\vault" `
  --input scene.json `
  --output "Diagrams\relationship.excalidraw.md" `
  --tags excalidraw,diagram `
  --verify
```

Preview the same operation without writing:

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --input scene.json \
  --output "Diagrams/relationship.excalidraw.md" \
  --tags excalidraw,diagram \
  --dry-run
```

Convert an existing `.excalidraw.md` that contains an uncompressed fenced `json` drawing block or an existing `compressed-json` block:

```bash
node scripts/write_excalidraw_compressed.js \
  --vault-root "/path/to/vault" \
  --from-md "/path/to/vault/Diagrams/relationship.excalidraw.md" \
  --output "/path/to/vault/Diagrams/relationship.excalidraw.md" \
  --force \
  --tags excalidraw,diagram \
  --verify
```

## Troubleshooting

- If Obsidian shows the warning text only, use the note menu to switch to Excalidraw View.
- If switching views still fails, inspect a newly-created Excalidraw file in the same vault and match its storage format exactly.
- If the plugin-created file uses `compressed-json`, do not emit uncompressed `json` or `# Excalidraw Data` unless the user explicitly wants decompressed storage.
- If the generated embed is not visible, check that the link target is vault-relative and exact, including Unicode characters, spaces, and folder names.
- Quote paths that contain spaces or Unicode characters. Use explicit UTF-8 encoding for Markdown reads and writes when the shell or platform might use a legacy encoding.
- Keep generated diagrams small and simple first. Once the plugin displays them, improve layout, labels, and styling.
