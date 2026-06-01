---
name: obsidian-excalidraw-workflow
description: Create, inspect, convert, or repair Obsidian Excalidraw .excalidraw.md drawings so they open correctly in the Obsidian Excalidraw plugin, with compressed-json conversion and vault-safe writes.
---

# Obsidian Excalidraw Workflow

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
