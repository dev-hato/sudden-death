import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const manifestPath = ".github/ci-sync.json";

function safePath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    /[\\:]/u.test(value) ||
    Array.from(value).some((character) => {
      const code = character.codePointAt(0);
      return code < 32 || code === 127;
    }) ||
    value.split("/").some((part) => ["", ".", ".."].includes(part))
  ) {
    throw new Error(`Unsafe relative path: ${JSON.stringify(value)}`);
  }
}

function inspectPath(
  root,
  relativePath,
  { optional = false, directory = false } = {},
) {
  safePath(relativePath);
  let current = root;
  const parts = relativePath.split("/");
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (optional && error.code === "ENOENT") return;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported: ${current}`);
    }
    const needsDirectory = index < parts.length - 1 || directory;
    if (needsDirectory ? !stat.isDirectory() : !stat.isFile()) {
      throw new Error(
        `Expected a regular ${needsDirectory ? "directory" : "file"}: ${current}`,
      );
    }
  }
}

function inspectTree(root, relativePath) {
  inspectPath(root, relativePath, { directory: true });
  for (const entry of readdirSync(join(root, relativePath), {
    withFileTypes: true,
  })) {
    const child = `${relativePath}/${entry.name}`;
    if (entry.isDirectory()) inspectTree(root, child);
    else inspectPath(root, child);
  }
}

function inspectDirectory(directory, owner) {
  if (
    lstatSync(directory).isSymbolicLink() ||
    !lstatSync(directory).isDirectory()
  ) {
    throw new Error(`Expected a regular ${owner} directory: ${directory}`);
  }
}

function validateStringArray(values, field) {
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    values.some((value) => typeof value !== "string") ||
    new Set(values).size !== values.length
  ) {
    throw new Error(`${field} must be a nonempty array of unique strings`);
  }
}

function validateManifestShape(manifest) {
  if (
    manifest === null ||
    Array.isArray(manifest) ||
    typeof manifest !== "object" ||
    manifest.schemaVersion !== 1 ||
    Object.keys(manifest).some(
      (key) => !["schemaVersion", "files", "excludeWorkflows"].includes(key),
    )
  ) {
    throw new Error("Unsupported CI sync manifest; expected schemaVersion 1");
  }
  validateStringArray(manifest.files, "files");
  validateStringArray(manifest.excludeWorkflows, "excludeWorkflows");
}

function validateWorkflowExclusions(patterns) {
  for (const pattern of patterns) {
    if (!/^[A-Za-z0-9_.*-]+\.ya?ml$/u.test(pattern)) {
      throw new Error(
        `Unsafe workflow filename pattern: ${JSON.stringify(pattern)}`,
      );
    }
  }
}

function inspectSourceFiles(source, files) {
  for (const file of files) {
    if (!/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/u.test(file)) {
      throw new Error(`Unsafe manifest file path: ${JSON.stringify(file)}`);
    }
    inspectPath(source, file);
  }
}

function validateAquaFiles(files) {
  for (const file of ["aqua.yaml", "aqua-checksums.json"]) {
    if (!files.includes(file)) {
      throw new Error(`The CI sync contract must include ${file}`);
    }
  }
}

function inspectSharedLayout(directory) {
  inspectPath(directory, "pyproject.toml");
  inspectTree(directory, ".github/workflows");
  inspectTree(directory, "scripts");
}

function inspectTarget(targetDirectory, files) {
  const target = resolve(targetDirectory);
  inspectDirectory(target, "target");
  for (const file of files) inspectPath(target, file, { optional: true });
  inspectSharedLayout(target);
}

export function readManifest(sourceDirectory, targetDirectory) {
  const source = resolve(sourceDirectory);
  inspectDirectory(source, "source");
  inspectPath(source, manifestPath);
  const manifest = JSON.parse(readFileSync(join(source, manifestPath), "utf8"));
  validateManifestShape(manifest);
  validateWorkflowExclusions(manifest.excludeWorkflows);
  inspectSourceFiles(source, manifest.files);
  validateAquaFiles(manifest.files);
  inspectSharedLayout(source);

  if (targetDirectory !== undefined) {
    inspectTarget(targetDirectory, manifest.files);
  }
  return manifest;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [, , field, source = "hato-bot", target = "sudden-death"] =
      process.argv;
    if (!["files", "excludeWorkflows"].includes(field)) {
      throw new Error(
        "Usage: node read_manifest.mjs <files|excludeWorkflows> [source] [target]",
      );
    }
    const manifest = readManifest(source, target);
    process.stdout.write(`${manifest[field].join("\n")}\n`);
  } catch (error) {
    console.error(`CI sync preflight failed: ${error.message}`);
    process.exitCode = 1;
  }
}
