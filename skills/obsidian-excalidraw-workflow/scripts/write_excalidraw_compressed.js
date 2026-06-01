#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const LZString = (() => {
  const keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const baseReverseDic = {};
  function getBaseValue(alphabet, character) {
    if (!baseReverseDic[alphabet]) {
      baseReverseDic[alphabet] = {};
      for (let i = 0; i < alphabet.length; i++) baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
    return baseReverseDic[alphabet][character];
  }
  return {
    compressToBase64(input) {
      if (input == null) return "";
      const res = this._compress(input, 6, a => keyStrBase64.charAt(a));
      switch (res.length % 4) {
        default:
        case 0: return res;
        case 1: return res + "===";
        case 2: return res + "==";
        case 3: return res + "=";
      }
    },
    decompressFromBase64(input) {
      if (input == null) return "";
      if (input === "") return null;
      return this._decompress(input.length, 32, index => getBaseValue(keyStrBase64, input.charAt(index)));
    },
    _compress(uncompressed, bitsPerChar, getCharFromInt) {
      if (uncompressed == null) return "";
      let i, value;
      const context_dictionary = {};
      const context_dictionaryToCreate = {};
      let context_c = "";
      let context_wc = "";
      let context_w = "";
      let context_enlargeIn = 2;
      let context_dictSize = 3;
      let context_numBits = 2;
      const context_data = [];
      let context_data_val = 0;
      let context_data_position = 0;
      for (let ii = 0; ii < uncompressed.length; ii += 1) {
        context_c = uncompressed.charAt(ii);
        if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
          context_dictionary[context_c] = context_dictSize++;
          context_dictionaryToCreate[context_c] = true;
        }
        context_wc = context_w + context_c;
        if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
          context_w = context_wc;
        } else {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
            if (context_w.charCodeAt(0) < 256) {
              for (i = 0; i < context_numBits; i++) writeBit(0);
              value = context_w.charCodeAt(0);
              for (i = 0; i < 8; i++) { writeBit(value & 1); value >>= 1; }
            } else {
              value = 1;
              for (i = 0; i < context_numBits; i++) { writeBit(value); value = 0; }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 16; i++) { writeBit(value & 1); value >>= 1; }
            }
            context_enlargeIn--;
            if (context_enlargeIn === 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i = 0; i < context_numBits; i++) { writeBit(value & 1); value >>= 1; }
          }
          context_enlargeIn--;
          if (context_enlargeIn === 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
          context_dictionary[context_wc] = context_dictSize++;
          context_w = String(context_c);
        }
      }
      if (context_w !== "") {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) writeBit(0);
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) { writeBit(value & 1); value >>= 1; }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) { writeBit(value); value = 0; }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) { writeBit(value & 1); value >>= 1; }
          }
          context_enlargeIn--;
          if (context_enlargeIn === 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++; }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) { writeBit(value & 1); value >>= 1; }
        }
        context_enlargeIn--;
        if (context_enlargeIn === 0) context_numBits++;
      }
      value = 2;
      for (i = 0; i < context_numBits; i++) { writeBit(value & 1); value >>= 1; }
      while (true) {
        context_data_val <<= 1;
        if (context_data_position === bitsPerChar - 1) {
          context_data.push(getCharFromInt(context_data_val));
          break;
        }
        context_data_position++;
      }
      return context_data.join("");

      function writeBit(bit) {
        context_data_val = (context_data_val << 1) | bit;
        if (context_data_position === bitsPerChar - 1) {
          context_data_position = 0;
          context_data.push(getCharFromInt(context_data_val));
          context_data_val = 0;
        } else {
          context_data_position++;
        }
      }
    },
    _decompress(length, resetValue, getNextValue) {
      const dictionary = [0, 1, 2];
      let enlargeIn = 4;
      let dictSize = 4;
      let numBits = 3;
      let entry = "";
      const result = [];
      let i;
      let w;
      let bits;
      let resb;
      let maxpower;
      let power;
      let c;
      const data = { val: getNextValue(0), position: resetValue, index: 1 };
      bits = 0; maxpower = Math.pow(2, 2); power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      switch (bits) {
        case 0:
          bits = 0; maxpower = Math.pow(2, 8); power = 1;
          while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
          c = String.fromCharCode(bits); break;
        case 1:
          bits = 0; maxpower = Math.pow(2, 16); power = 1;
          while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
          c = String.fromCharCode(bits); break;
        case 2: return "";
      }
      dictionary[3] = c;
      w = c;
      result.push(c);
      while (true) {
        if (data.index > length) return "";
        bits = 0; maxpower = Math.pow(2, numBits); power = 1;
        while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
        c = bits;
        switch (c) {
          case 0:
            bits = 0; maxpower = Math.pow(2, 8); power = 1;
            while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
            dictionary[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
          case 1:
            bits = 0; maxpower = Math.pow(2, 16); power = 1;
            while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++); } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1; }
            dictionary[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
          case 2: return result.join("");
        }
        if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
        if (dictionary[c]) entry = dictionary[c];
        else if (c === dictSize) entry = w + w.charAt(0);
        else return null;
        result.push(entry);
        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;
        w = entry;
        if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
      }
    }
  };
})();

function parseArgs(argv) {
  const args = {};
  const valueArgs = new Set(["input", "from-md", "output", "tags", "created", "vault-root", "format", "inspect"]);
  const flagArgs = new Set(["force", "help", "dry-run", "verify"]);
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const name = key.slice(2);
    if (flagArgs.has(name)) {
      args[name] = true;
      continue;
    }
    if (!valueArgs.has(name)) throw new Error(`Unknown argument: ${key}`);
    const value = argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    args[name] = value;
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node scripts/write_excalidraw_compressed.js --vault-root <vault> --input scene.json --output <vault-relative-or-absolute/file.excalidraw.md> [--format auto|compressed-json|json] [--tags tag1,tag2] [--created YYYY-MM-DD] [--dry-run] [--verify] [--force]",
    "  node scripts/write_excalidraw_compressed.js --vault-root <vault> --from-md <drawing.excalidraw.md> --output <vault-relative-or-absolute/file.excalidraw.md> [--format auto|compressed-json|json] [--tags tag1,tag2] [--created YYYY-MM-DD] [--dry-run] [--verify] [--force]",
    "  node scripts/write_excalidraw_compressed.js --vault-root <vault> --inspect <vault-relative-or-absolute/file.excalidraw.md>"
  ].join("\n");
}

function extractDrawingBlock(text) {
  const drawingSection = text.match(/^## Drawing\s*([\s\S]*)$/m);
  if (!drawingSection) throw new Error("Could not find ## Drawing section.");
  const blockMatch = drawingSection[1].match(/```(json|compressed-json)\s*([\s\S]*?)\s*```/);
  if (!blockMatch) throw new Error("Could not find json or compressed-json drawing block under ## Drawing.");
  return { format: blockMatch[1], body: blockMatch[2].trim() };
}

function sceneFromDrawingBlock(block) {
  if (block.format === "json") return block.body;
  if (block.format === "compressed-json") {
    const scene = LZString.decompressFromBase64(block.body);
    if (!scene) throw new Error("Could not decompress compressed-json block.");
    return scene.trim();
  }
  throw new Error(`Unsupported drawing block format: ${block.format}`);
}

function readScene(args) {
  if (args.input && args["from-md"]) throw new Error("Use either --input or --from-md, not both.");
  if (args.input) return fs.readFileSync(args.input, "utf8").trim();
  if (args["from-md"]) {
    const text = fs.readFileSync(args["from-md"], "utf8");
    return sceneFromDrawingBlock(extractDrawingBlock(text));
  }
  throw new Error("Provide --input scene.json or --from-md drawing.excalidraw.md");
}

function validateScene(scene) {
  const parsed = JSON.parse(scene);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Scene JSON must be an Excalidraw object.");
  }
  if (parsed.type !== "excalidraw") throw new Error('Scene JSON must include type: "excalidraw".');
  if (!Array.isArray(parsed.elements)) throw new Error("Scene JSON must include an elements array.");
  if (!parsed.appState || typeof parsed.appState !== "object" || Array.isArray(parsed.appState)) {
    throw new Error("Scene JSON must include an appState object.");
  }
  if (parsed.files == null) parsed.files = {};
  if (typeof parsed.files !== "object" || Array.isArray(parsed.files)) {
    throw new Error("Scene JSON files must be an object.");
  }
  return parsed;
}

function normalizeScene(scene) {
  return JSON.stringify(validateScene(scene));
}

function validateMetadata(args) {
  const tags = (args.tags || "excalidraw").split(",").map(t => t.trim()).filter(Boolean);
  if (tags.length === 0) throw new Error("Provide at least one non-empty tag.");
  for (const tag of tags) {
    if (!/^[A-Za-z0-9_./-]+$/.test(tag)) {
      throw new Error(`Invalid tag "${tag}". Use only letters, numbers, underscore, dot, slash, or hyphen.`);
    }
  }
  const created = args.created || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(created)) throw new Error("created must use YYYY-MM-DD format.");
  return { tags, created };
}

function validateVaultRoot(args) {
  if (!args["vault-root"]) throw new Error("Provide --vault-root <path-to-obsidian-vault>.");
  const vaultRootInput = path.resolve(args["vault-root"]);
  if (!fs.existsSync(vaultRootInput) || !fs.statSync(vaultRootInput).isDirectory()) {
    throw new Error(`Vault root does not exist or is not a directory: ${vaultRootInput}`);
  }
  if (!fs.existsSync(path.join(vaultRootInput, ".obsidian"))) {
    throw new Error(`Vault root does not look like an Obsidian vault: ${vaultRootInput}`);
  }
  const vaultRoot = fs.realpathSync(vaultRootInput);
  return { vaultRootInput, vaultRoot };
}

function resolveVaultPath(vault, filePath) {
  const resolved = path.resolve(path.isAbsolute(filePath) ? filePath : path.join(vault.vaultRoot, filePath));
  const relative = path.relative(vault.vaultRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path must be inside --vault-root.");
  }
  return resolved;
}

function validateOutputPath(args, vault) {
  const output = resolveVaultPath(vault, args.output);
  if (!output.toLowerCase().endsWith(".excalidraw.md")) {
    throw new Error("Output path must end with .excalidraw.md");
  }
  const parent = path.dirname(output);
  if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) {
    throw new Error(`Output parent directory must already exist: ${parent}`);
  }
  const parentReal = fs.realpathSync(parent);
  const parentRelative = path.relative(vault.vaultRoot, parentReal);
  if (parentRelative.startsWith("..") || path.isAbsolute(parentRelative)) {
    throw new Error("Output parent directory must resolve inside --vault-root.");
  }
  if (fs.existsSync(output)) {
    if (fs.lstatSync(output).isSymbolicLink()) throw new Error("Refusing to write through a symbolic link output path.");
    if (!args.force) throw new Error("Output file already exists. Pass --force to overwrite it.");
  }
  return output;
}

function detectVaultFormat(vault, requestedFormat) {
  const allowed = new Set(["auto", "compressed-json", "json"]);
  const format = requestedFormat || "auto";
  if (!allowed.has(format)) throw new Error("format must be auto, compressed-json, or json.");
  if (format !== "auto") return { format, source: "argument" };

  const settingsPath = path.join(vault.vaultRoot, ".obsidian", "plugins", "obsidian-excalidraw-plugin", "data.json");
  if (!fs.existsSync(settingsPath)) return { format: "compressed-json", source: "default-no-plugin-data" };
  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8").replace(/^\uFEFF/, ""));
  if (settings.compress === false) return { format: "json", source: "plugin-data-compress-false" };
  if (settings.compress === true) return { format: "compressed-json", source: "plugin-data-compress-true" };
  return { format: "compressed-json", source: "default-missing-compress-setting" };
}

function buildMarkdown(scene, format, tags, created) {
  const fence = "```";
  const frontmatter = ["---", "excalidraw-plugin: parsed", "tags:", ...tags.map(t => `  - ${t}`), `created: ${created}`, "---"].join("\n");
  const drawing = format === "json" ? scene : LZString.compressToBase64(scene);
  return `${frontmatter}\n\n== Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ==\nYou can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. For more info check in plugin settings under 'Saving'\n\n\n## Drawing\n${fence}${format}\n${drawing}\n${fence}\n`;
}

function summarizeScene(parsed) {
  const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
  return {
    type: parsed.type,
    elements: elements.length,
    textElements: elements.filter(e => e && e.type === "text").length,
    files: parsed.files && typeof parsed.files === "object" ? Object.keys(parsed.files).length : 0
  };
}

function verifyMarkdown(text, expectedFormat) {
  const block = extractDrawingBlock(text);
  if (expectedFormat && block.format !== expectedFormat) {
    throw new Error(`Expected ${expectedFormat} block but found ${block.format}.`);
  }
  const parsed = validateScene(sceneFromDrawingBlock(block));
  return { format: block.format, summary: summarizeScene(parsed) };
}

function inspectDrawing(args, vault) {
  const target = resolveVaultPath(vault, args.inspect);
  if (!fs.existsSync(target)) throw new Error(`Inspect target does not exist: ${target}`);
  const report = verifyMarkdown(fs.readFileSync(target, "utf8"));
  console.log(JSON.stringify({ path: target, ...report }, null, 2));
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    return;
  }
  const vault = validateVaultRoot(args);
  if (args.inspect) {
    inspectDrawing(args, vault);
    return;
  }
  if (!args.output) throw new Error("Provide --output <drawing.excalidraw.md>");
  const output = validateOutputPath(args, vault);
  const scene = normalizeScene(readScene(args));
  const parsedScene = validateScene(scene);
  const { tags, created } = validateMetadata(args);
  const format = detectVaultFormat(vault, args.format);
  const body = buildMarkdown(scene, format.format, tags, created);
  const summary = {
    output,
    format: format.format,
    formatSource: format.source,
    dryRun: Boolean(args["dry-run"]),
    force: Boolean(args.force),
    verify: Boolean(args.verify),
    summary: summarizeScene(parsedScene)
  };
  if (args["dry-run"]) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  if (args.force) {
    fs.writeFileSync(output, body, "utf8");
  } else {
    const fd = fs.openSync(output, "wx");
    try {
      fs.writeFileSync(fd, body, "utf8");
    } finally {
      fs.closeSync(fd);
    }
  }
  if (args.verify) summary.verification = verifyMarkdown(fs.readFileSync(output, "utf8"), format.format);
  console.log(JSON.stringify({ wrote: true, ...summary }, null, 2));
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  console.error(usage());
  process.exit(1);
}
