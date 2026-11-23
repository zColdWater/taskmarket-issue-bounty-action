import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

let YAML;
try {
  YAML = await import("yaml");
} catch {
  const require = createRequire(new URL("../../../../package.json", import.meta.url));
  YAML = require("yaml");
}

const ROOT = path.resolve(import.meta.dirname, "..");
const WORKFLOW_PATH = fs.existsSync(path.join(ROOT, ".github/workflows/taskmarket-bounty.yml"))
  ? path.join(ROOT, ".github/workflows/taskmarket-bounty.yml")
  : path.join(ROOT, "workflows/taskmarket-bounty.yml");

function loadWorkflow() {
  const raw = fs.readFileSync(WORKFLOW_PATH, "utf8");
  return { raw, doc: YAML.parse(raw) };
}

function runParseStep({ eventPayload, env = {} }) {
  const { doc } = loadWorkflow();
  const parseStep = doc.jobs["post-bounty"].steps.find((s) => s.id === "parse");
  assert.ok(parseStep, "parse step exists");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tm-action-test-"));
  const eventPath = path.join(tmp, "event.json");
  const outPath = path.join(tmp, "github-output.txt");
  fs.writeFileSync(eventPath, JSON.stringify(eventPayload), "utf8");
  fs.writeFileSync(outPath, "", "utf8");

  execFileSync("bash", ["-euo", "pipefail", "-c", parseStep.run], {
    env: {
      ...process.env,
      EVENT_NAME: "issues",
      REPO: "acme/widgets",
      SERVER_URL: "https://github.com",
      LABEL_NAME: "taskmarket",
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_OUTPUT: outPath,
      RUNNER_TEMP: tmp,
      MOCK_COMMENTS_JSON: "[]",
      VAR_NETWORK: "tempo",
      VAR_DRY_RUN: "true",
      ...env
    },
    encoding: "utf8"
  });

  const outputs = Object.fromEntries(
    fs
      .readFileSync(outPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );
  return { outputs, tmp };
}

test("workflow YAML is valid, triggers on labeled issues, and never interpolates untrusted issue text in run blocks", () => {
  const { raw, doc } = loadWorkflow();
  assert.deepEqual(doc.on.issues.types, ["labeled"]);
  assert.ok(doc.on.workflow_dispatch, "supports manual workflow_dispatch");
  assert.equal(doc.permissions.issues, "write");

  const steps = doc.jobs["post-bounty"].steps;
  const installStep = steps.find((s) => s.name.includes("Install Taskmarket CLI"));
  assert.match(installStep.run, /npm i -g @lucid-agents\/taskmarket/);

  for (const step of steps) {
    if (step.run) {
      assert.doesNotMatch(
        step.run,
        /\$\{\{\s*github\.event\.issue\.(title|body)/,
        `Step "${step.name}" must not interpolate untrusted issue title/body directly in shell`
      );
      assert.doesNotMatch(
        step.run,
        /0x[0-9a-fA-F]{64}/,
        `Step "${step.name}" must never hardcode private keys`
      );
    }
  }

  assert.match(raw, /secrets\.TASKMARKET_PRIVATE_KEY/);
  assert.match(raw, /TASKMARKET_IMPORT_KEY/);
});

test("parse + dry-run step builds valid Taskmarket CLI parameters and neutralizes shell metacharacters", () => {
  const { doc } = loadWorkflow();
  const hostileTitle = "Fix $(touch /tmp/pwned) `whoami` \"quotes\"";
  const issueBody = [
    "Reproduce bug in parser.",
    "taskmarket-reward: 8",
    "taskmarket-duration: 48",
    "taskmarket-mode: bounty",
    "taskmarket-require-verified: tap:identity:known"
  ].join("\n");

  const { outputs, tmp } = runParseStep({
    eventPayload: {
      issue: {
        number: 42,
        title: hostileTitle,
        body: issueBody,
        html_url: "https://github.com/acme/widgets/issues/42"
      }
    }
  });

  assert.equal(outputs.skip, "false");
  assert.equal(outputs.dry_run, "true");
  assert.equal(outputs.network, "tempo");
  assert.equal(outputs.reward, "8");
  assert.equal(outputs.duration, "48");
  assert.equal(outputs.mode, "bounty");
  assert.equal(outputs.require_verified, "tap:identity:known");

  const savedDesc = fs.readFileSync(outputs.description_file, "utf8");
  assert.ok(savedDesc.includes(hostileTitle));
  assert.equal(fs.existsSync("/tmp/pwned"), false);

  const dryRunStep = doc.jobs["post-bounty"].steps.find((s) => s.name.startsWith("Dry-run preview"));
  const summaryFile = path.join(tmp, "summary.md");
  const stdout = execFileSync("bash", ["-euo", "pipefail", "-c", dryRunStep.run], {
    env: {
      ...process.env,
      NETWORK: outputs.network,
      REWARD: outputs.reward,
      DURATION: outputs.duration,
      MODE: outputs.mode,
      REQUIRE_VERIFIED: outputs.require_verified,
      DESC_FILE: outputs.description_file,
      ISSUE_NUMBER: outputs.issue_number,
      GITHUB_STEP_SUMMARY: summaryFile
    },
    encoding: "utf8"
  });

  assert.match(stdout, /taskmarket --network tempo task create/);
  assert.match(stdout, /--reward 8 --duration 48 --mode bounty/);
  assert.match(fs.readFileSync(summaryFile, "utf8"), /Taskmarket Dry-Run Preview/);
});

test("skips duplicate bounty creation when issue already carries posted marker comment", () => {
  const { outputs } = runParseStep({
    eventPayload: {
      issue: { number: 7, title: "Add dark mode", body: "Details" }
    },
    env: {
      MOCK_COMMENTS_JSON: JSON.stringify([
        { body: "<!-- taskmarket-bounty-posted:0xabc123 -->\n### Taskmarket bounty live" }
      ])
    }
  });
  assert.equal(outputs.skip, "true");
  assert.equal(outputs.skip_reason, "already_posted");
});

test("supports shorthand reward label taskmarket:12", () => {
  const { outputs } = runParseStep({
    eventPayload: {
      issue: { number: 9, title: "Optimize bundle", body: "Keep under 50KB." }
    },
    env: {
      LABEL_NAME: "taskmarket:12"
    }
  });
  assert.equal(outputs.reward, "12");
});
