# yunning-skills

Reusable skills for agent workflows.

This repository collects focused skills that help agents work with local files, developer tools, notes, diagrams, and other repeatable workflows. Each skill is kept small and self-contained so it can be copied, installed, reviewed, or published independently.

## Skills

### obsidian-excalidraw-workflow

Create, inspect, convert, and repair Obsidian Excalidraw `.excalidraw.md` drawings so they open correctly in the Obsidian Excalidraw plugin.

Highlights:

- Creates Obsidian-native `.excalidraw.md` files
- Detects the target vault's Excalidraw save format
- Supports `compressed-json` and uncompressed `json` drawing blocks
- Constrains writes to the declared vault root
- Refuses overwrites unless explicitly requested
- Provides inspect, dry-run, and verification modes

## Structure

```text
skills/
  <skill-name>/
    SKILL.md
    scripts/
```

Each skill contains its own usage instructions in `SKILL.md`.
