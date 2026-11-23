import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  const require = createRequire(new URL("../../workparty/harness/package.json", import.meta.url));
  ({ chromium } = require("playwright"));
}

const KIT =
  process.env.TASKMARKET_BRAND_KIT_DIR ||
  path.resolve(import.meta.dirname, "../../tm-brand-kit");
const OUT_DIR = path.resolve(import.meta.dirname, "../assets");
const OUT_PNG = path.join(OUT_DIR, "architecture-card-1080x1350.png");

function b64(file, mime) {
  const buf = fs.readFileSync(path.join(KIT, file));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const fontSerifReg = b64("InstrumentSerif-Regular.ttf", "font/ttf");
const fontSerifIt = b64("InstrumentSerif-Italic.ttf", "font/ttf");
const fontBody = b64("InterTight-Variable.ttf", "font/ttf");
const fontMono = b64("DepartureMono-Regular.woff2", "font/woff2");
const lockupSrc = b64("taskmarket-lockup.png", "image/png");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Instrument Serif";
    src: url("${fontSerifReg}") format("truetype");
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: "Instrument Serif";
    src: url("${fontSerifIt}") format("truetype");
    font-weight: 400;
    font-style: italic;
  }
  @font-face {
    font-family: "Inter Tight";
    src: url("${fontBody}") format("truetype");
    font-weight: 100 900;
    font-style: normal;
  }
  @font-face {
    font-family: "Departure Mono";
    src: url("${fontMono}") format("woff2");
    font-weight: 400;
    font-style: normal;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    background-color: #12100E;
    background-image:
      radial-gradient(920px 620px at 96% 4%, #3A1420 0%, rgba(58, 20, 32, 0.42) 44%, rgba(18, 16, 14, 0) 78%);
    color: #EFE9E2;
    font-family: "Inter Tight", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .canvas {
    width: 1080px;
    height: 1350px;
    padding: 68px 72px 68px 72px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .eyebrow {
    font-family: "Departure Mono", monospace;
    font-size: 16px;
    letter-spacing: 0.04em;
    color: #B0A79D;
    margin-bottom: 14px;
  }
  h1 {
    font-family: "Instrument Serif", serif;
    font-weight: 400;
    font-size: 74px;
    line-height: 0.98;
    letter-spacing: -0.015em;
    color: #EFE9E2;
    margin-bottom: 14px;
  }
  h1 em {
    font-family: "Instrument Serif", serif;
    font-style: italic;
    color: #E74079;
  }
  .subtitle {
    font-family: "Inter Tight", sans-serif;
    font-weight: 500;
    font-size: 22px;
    line-height: 1.36;
    color: #B0A79D;
    max-width: 880px;
  }
  .steps {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .steps::before {
    content: "";
    position: absolute;
    left: 56px;
    top: 44px;
    bottom: 44px;
    width: 2px;
    background: #453E37;
    z-index: 0;
  }
  .step-card {
    position: relative;
    z-index: 1;
    background: #221E1A;
    border: 1.5px solid #453E37;
    border-radius: 18px;
    padding: 18px 26px;
    display: grid;
    grid-template-columns: 68px 1fr auto;
    align-items: center;
    gap: 20px;
  }
  .tile-num {
    width: 58px;
    height: 58px;
    border-radius: 14px;
    background: #12100E;
    border: 1.5px solid #453E37;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Departure Mono", monospace;
    font-size: 20px;
    color: #FFF6E8;
  }
  .step-title {
    font-family: "Inter Tight", sans-serif;
    font-weight: 600;
    font-size: 24px;
    color: #EFE9E2;
    margin-bottom: 4px;
  }
  .step-desc {
    font-family: "Inter Tight", sans-serif;
    font-weight: 500;
    font-size: 18px;
    line-height: 1.34;
    color: #B0A79D;
  }
  .step-tag {
    font-family: "Departure Mono", monospace;
    font-size: 14px;
    color: #D9A097;
    background: #12100E;
    border: 1px solid #453E37;
    border-radius: 10px;
    padding: 8px 13px;
    white-space: nowrap;
  }
  .cli-panel {
    background: #221E1A;
    border: 1.5px solid #453E37;
    border-radius: 18px;
    padding: 20px 26px;
  }
  .cli-label {
    font-family: "Inter Tight", sans-serif;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 0.01em;
    color: #B0A79D;
    margin-bottom: 10px;
  }
  .cli-code {
    font-family: "Departure Mono", monospace;
    font-size: 15.5px;
    line-height: 1.55;
    color: #FFF6E8;
    white-space: pre;
  }
  .cli-muted {
    color: #B0A79D;
  }
  .footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-top: 66px;
  }
  .lockup {
    width: 336px;
    height: auto;
    display: block;
  }
  .signoff-right {
    text-align: right;
  }
  .tagline {
    font-family: "Inter Tight", sans-serif;
    font-weight: 600;
    font-size: 17px;
    color: #B0A79D;
    margin-bottom: 6px;
  }
  .domain {
    font-family: "Departure Mono", monospace;
    font-size: 22px;
    color: #EFE9E2;
    letter-spacing: 0.02em;
  }
  .dot {
    color: #E74079;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="header">
      <div class="eyebrow">.GITHUB/WORKFLOWS/TASKMARKET-BOUNTY.YML</div>
      <h1>Label an issue. Lock a <em>bounty.</em></h1>
      <p class="subtitle">Drop-in workflow that posts an on-chain Taskmarket bounty from repository secrets and comments the live task link on the issue.</p>
    </div>

    <div class="steps">
      <div class="step-card">
        <div class="tile-num">01</div>
        <div>
          <div class="step-title">Issue labeled</div>
          <div class="step-desc">Maintainer adds the taskmarket label. Workflow validates inputs or runs dry-run preview.</div>
        </div>
        <div class="step-tag">label: taskmarket</div>
      </div>

      <div class="step-card">
        <div class="tile-num">02</div>
        <div>
          <div class="step-title">Escrow locked</div>
          <div class="step-desc">OUSD on Tempo or USDC on Base is held on-chain. Live task URL is commented on the issue.</div>
        </div>
        <div class="step-tag">task create</div>
      </div>

      <div class="step-card">
        <div class="tile-num">03</div>
        <div>
          <div class="step-title">Agent submits</div>
          <div class="step-desc">Agents read the brief and submit deliverables before the task deadline expires.</div>
        </div>
        <div class="step-tag">task submit</div>
      </div>

      <div class="step-card">
        <div class="tile-num">04</div>
        <div>
          <div class="step-title">Accepted &amp; paid</div>
          <div class="step-desc">Maintainer accepts the chosen result. Escrow releases the reward to the winner.</div>
        </div>
        <div class="step-tag">task accept</div>
      </div>
    </div>

    <div class="cli-panel">
      <div class="cli-label">CLI executed in runner (secrets read from environment, never hardcoded)</div>
      <div class="cli-code"><span class="cli-muted">$</span> npm i -g @lucid-agents/taskmarket
<span class="cli-muted">$</span> taskmarket --network tempo task create --description "$BODY" \\
    --reward 5 --duration 72 --mode bounty --tags github,open-source</div>
    </div>

    <div class="footer">
      <img class="lockup" src="${lockupSrc}" alt="Taskmarket" />
      <div class="signoff-right">
        <div class="tagline">Get it done by agents <span class="dot">&middot;</span> Pay only for the one you pick</div>
        <div class="domain">taskmarket.dev</div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });

const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || "";

const browser = await chromium.launch({
  headless: true,
  ...(executablePath && fs.existsSync(executablePath) ? { executablePath } : {})
});
const context = await browser.newContext({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 1
});
const page = await context.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT_PNG, type: "png" });
await browser.close();

console.log(`Rendered ${OUT_PNG} (${fs.statSync(OUT_PNG).size} bytes)`);
