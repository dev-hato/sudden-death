import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readManifest } from "./read_manifest.mjs";

const copyScript = fileURLToPath(new URL("copy_ci.sh", import.meta.url));

function write(root, path, content) {
  const destination = join(root, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content);
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "ci-sync-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, "hato-bot");
  const target = join(root, "sudden-death");
  const manifest = {
    schemaVersion: 1,
    files: ["aqua.yaml", "aqua-checksums.json", ".github/dependabot.yml"],
    excludeWorkflows: ["*hato-bot.yml", "verify-lockfile.yml"],
  };
  write(source, ".github/ci-sync.json", JSON.stringify(manifest));
  write(
    source,
    "aqua.yaml",
    "packages:\n  - name: suzuki-shunsuke/ghalint@v1.6.0\n",
  );
  write(source, "aqua-checksums.json", '{"checksums":{"ghalint":"fixture"}}\n');
  write(source, ".github/dependabot.yml", "version: 2\nupdates: []\n");
  write(
    source,
    ".github/workflows/shared.yml",
    'name: shared\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: example/action@abcdef\n        with:\n          repo-name: dev-hato/hato-bot\n          untouched: "keep this value"\n',
  );
  write(
    source,
    ".github/workflows/pr-test-hato-bot.yml",
    "name: upstream-only\n",
  );
  write(
    source,
    ".github/workflows/verify-lockfile.yml",
    "name: upstream-verify\n",
  );
  write(
    source,
    ".github/workflows/local-sudden-death.yml",
    "name: do-not-copy\n",
  );
  write(source, "scripts/shared/helper with spaces.sh", "echo shared\n");
  write(source, "scripts/pr_test_hato_bot/test.sh", "echo upstream-only\n");
  write(
    source,
    "pyproject.toml",
    'requires-python = "==3.14.10"\nrequired-version = ">=0.13.7"\n',
  );
  write(
    target,
    ".github/workflows/local-sudden-death.yml",
    "name: downstream-only\n",
  );
  write(
    target,
    ".github/workflows/verify-lockfile.yml",
    "name: downstream-verify\n",
  );
  write(target, ".github/workflows/obsolete.yml", "name: obsolete\n");
  write(
    target,
    "scripts/pr_copy_ci_sudden_death/owned.sh",
    "echo downstream-only\n",
  );
  write(target, "scripts/obsolete.sh", "echo obsolete\n");
  write(
    target,
    "pyproject.toml",
    'name = "sudden_death"\nrequires-python = "==3.13.0"\nrequired-version = ">=0.12.0"\n',
  );
  return { root, source, target, manifest };
}

function snapshot(root) {
  const contents = {};
  function visit(directory, prefix = "") {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const relativePath = `${prefix}${name}`;
      const stat = lstatSync(path);
      if (stat.isSymbolicLink())
        contents[relativePath] = { link: readlinkSync(path) };
      else if (stat.isDirectory()) visit(path, `${relativePath}/`);
      else contents[relativePath] = readFileSync(path).toString("base64");
    }
  }
  visit(root);
  return contents;
}

function synchronize(root) {
  return execFileSync("bash", [copyScript], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });
}

function assertFailsBeforeChanges({ root, target }) {
  const before = snapshot(target);
  assert.throws(() => synchronize(root), /CI sync preflight failed/u);
  assert.deepEqual(snapshot(target), before);
}

test("copies the complete contract, preserves downstream ownership, and is idempotent", (t) => {
  const { root, source, target, manifest } = fixture(t);
  synchronize(root);
  for (const file of manifest.files) {
    assert.deepEqual(
      readFileSync(join(target, file)),
      readFileSync(join(source, file)),
    );
  }
  assert.equal(
    readFileSync(
      join(target, ".github/workflows/local-sudden-death.yml"),
      "utf8",
    ),
    "name: downstream-only\n",
  );
  assert.equal(
    readFileSync(join(target, ".github/workflows/verify-lockfile.yml"), "utf8"),
    "name: downstream-verify\n",
  );
  assert.equal(
    readFileSync(
      join(target, "scripts/pr_copy_ci_sudden_death/owned.sh"),
      "utf8",
    ),
    "echo downstream-only\n",
  );
  assert.equal(
    existsSync(join(target, ".github/workflows/pr-test-hato-bot.yml")),
    false,
  );
  assert.equal(
    existsSync(join(target, "scripts/pr_test_hato_bot/test.sh")),
    false,
  );
  assert.equal(
    existsSync(join(target, ".github/workflows/obsolete.yml")),
    false,
  );
  assert.equal(existsSync(join(target, "scripts/obsolete.sh")), false);
  assert.equal(
    readFileSync(join(target, "scripts/shared/helper with spaces.sh"), "utf8"),
    "echo shared\n",
  );
  const workflow = readFileSync(
    join(target, ".github/workflows/shared.yml"),
    "utf8",
  );
  assert.match(workflow, /repo-name: dev-hato\/sudden-death/u);
  assert.match(workflow, /untouched: "keep this value"/u);
  assert.match(
    readFileSync(join(source, ".github/workflows/shared.yml"), "utf8"),
    /repo-name: dev-hato\/hato-bot/u,
  );
  assert.equal(
    readFileSync(join(target, "pyproject.toml"), "utf8"),
    'name = "sudden_death"\nrequires-python = "==3.14.10"\nrequired-version = ">=0.13.7"\n',
  );
  const first = snapshot(target);
  synchronize(root);
  assert.deepEqual(snapshot(target), first);
});

for (const file of [
  "aqua.yaml",
  "aqua-checksums.json",
  ".github/ci-sync.json",
]) {
  test(`missing ${file} fails before deleting generated files`, (t) => {
    const data = fixture(t);
    rmSync(join(data.source, file));
    assertFailsBeforeChanges(data);
  });
}

for (const value of [
  "../escape",
  "/absolute",
  "a/../escape",
  "a//file",
  "./file",
  "a\\file",
  "a\nfile",
  "C:/file",
  "a file",
  "",
]) {
  test(`rejects unsafe manifest path ${JSON.stringify(value)}`, (t) => {
    const data = fixture(t);
    data.manifest.files.push(value);
    write(data.source, ".github/ci-sync.json", JSON.stringify(data.manifest));
    assertFailsBeforeChanges(data);
  });
}

for (const [name, update] of [
  [
    "unsupported schema",
    (manifest) => {
      manifest.schemaVersion = 2;
    },
  ],
  [
    "unknown field",
    (manifest) => {
      manifest.typo = [];
    },
  ],
  [
    "duplicate file",
    (manifest) => {
      manifest.files.push("aqua.yaml");
    },
  ],
  [
    "duplicate workflow exclusion",
    (manifest) => {
      manifest.excludeWorkflows.push("verify-lockfile.yml");
    },
  ],
  [
    "invalid workflow exclusion",
    (manifest) => {
      manifest.excludeWorkflows.push("../*.yml");
    },
  ],
  [
    "non-array files",
    (manifest) => {
      manifest.files = "aqua.yaml";
    },
  ],
  [
    "missing Aqua manifest entry",
    (manifest) => {
      manifest.files = manifest.files.filter((file) => file !== "aqua.yaml");
    },
  ],
]) {
  test(`${name} fails before deleting generated files`, (t) => {
    const data = fixture(t);
    update(data.manifest);
    write(data.source, ".github/ci-sync.json", JSON.stringify(data.manifest));
    assertFailsBeforeChanges(data);
  });
}

test("rejects a source file symlink before changing the target", (t) => {
  const data = fixture(t);
  rmSync(join(data.source, "aqua.yaml"));
  symlinkSync("aqua-checksums.json", join(data.source, "aqua.yaml"));
  assertFailsBeforeChanges(data);
});

test("rejects a source parent symlink before changing the target", (t) => {
  const data = fixture(t);
  write(data.source, "real/config.json", "{}\n");
  symlinkSync("real", join(data.source, "linked"));
  data.manifest.files.push("linked/config.json");
  write(data.source, ".github/ci-sync.json", JSON.stringify(data.manifest));
  assertFailsBeforeChanges(data);
});

test("rejects a target parent symlink before changing the target", (t) => {
  const data = fixture(t);
  write(data.source, "config/shared.json", "{}\n");
  data.manifest.files.push("config/shared.json");
  write(data.source, ".github/ci-sync.json", JSON.stringify(data.manifest));
  mkdirSync(join(data.root, "outside"));
  symlinkSync("../outside", join(data.target, "config"));
  assertFailsBeforeChanges(data);
  assert.deepEqual(readdirSync(join(data.root, "outside")), []);
});

test("rejects a directory declared as a regular file", (t) => {
  const data = fixture(t);
  data.manifest.files.push("scripts");
  write(data.source, ".github/ci-sync.json", JSON.stringify(data.manifest));
  assertFailsBeforeChanges(data);
});

test("an upstream script cannot overwrite a downstream-owned script", (t) => {
  const { root, source, target } = fixture(t);
  write(
    source,
    "scripts/pr_copy_ci_sudden_death/owned.sh",
    "echo do-not-copy\n",
  );
  synchronize(root);
  assert.equal(
    readFileSync(
      join(target, "scripts/pr_copy_ci_sudden_death/owned.sh"),
      "utf8",
    ),
    "echo downstream-only\n",
  );
});

test("manifest validation is usable without running the copy", (t) => {
  const { source, manifest } = fixture(t);
  assert.deepEqual(readManifest(source), manifest);
});
