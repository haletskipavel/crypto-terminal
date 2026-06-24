export const meta = {
  name: 'walle',
  description: 'Fetch ai-agent GitHub issues, implement fix, validate with Playwright, open PR',
  phases: [
    { title: 'Fetch' },
    { title: 'Implement' },
    { title: 'Validate' },
    { title: 'Ship' },
  ]
}

const ISSUE_SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    number: { type: 'number' },
    title: { type: 'string' }
  },
  required: ['found']
}

phase('Fetch')
const issue = await agent(
  'Run: gh issue list --repo haletskipavel/crypto-terminal --label ai-agent --state open --json number,title --limit 10. Then run: gh pr list --repo haletskipavel/crypto-terminal --state open --json headRefName. Skip any issue whose branch AI-DEMO-{n}-phaletski already has an open PR. Return the first available issue with found: true, number, title. If none, return found: false.',
  { label: 'Fetch issues', schema: ISSUE_SCHEMA }
)

if (!issue || !issue.found) {
  log('No ai-agent issues found. Nothing to do.')
} else {
  log(`Found issue #${issue.number}: ${issue.title}`)

  phase('Implement')
  const IMPL_SCHEMA = {
    type: 'object',
    properties: {
      branch: { type: 'string' },
      summary: { type: 'string' }
    },
    required: ['branch', 'summary']
  }

  const impl = await agent(
    `Implement the fix for issue #${issue.number}: "${issue.title}" in D:\\Temp\\AI Demo\\crypto-terminal. Create branch AI-DEMO-${issue.number}-phaletski, read source files, make the change, run npm run build. Do NOT commit yet. Return the branch name and a one-sentence summary of what changed.`,
    { label: `#${issue.number}: ${issue.title}`, schema: IMPL_SCHEMA, agentType: 'WALLE' }
  )

  if (!impl) {
    log('Implementation failed.')
  } else {
    phase('Validate')
    const VALIDATE_SCHEMA = {
      type: 'object',
      properties: {
        passed: { type: 'boolean' },
        observation: { type: 'string' }
      },
      required: ['passed', 'observation']
    }

    const validation = await agent(
      `In D:\\Temp\\AI Demo\\crypto-terminal:
1. Start ng serve on port 4300: run PowerShell command "Start-Process powershell -ArgumentList '-NoProfile -Command ng serve --port 4300' -WindowStyle Hidden", then poll http://localhost:4300 every 2s up to 60s with Invoke-WebRequest until it responds.
2. Use ToolSearch with query "select:mcp__playwright__browser_navigate,mcp__playwright__browser_take_screenshot" to load the Playwright tool schemas.
3. Call mcp__playwright__browser_navigate with url "http://localhost:4300".
4. Call mcp__playwright__browser_take_screenshot to capture the page.
5. Verify this change is visible in the screenshot: "${impl.summary}".
6. Stop the server: run PowerShell "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force".
Return passed true/false and your observation.`,
      { label: 'Playwright screenshot', schema: VALIDATE_SCHEMA }
    )

    if (!validation || !validation.passed) {
      log(`Validation failed: ${validation ? validation.observation : 'agent error'}`)
    } else {
      log(`Validated: ${validation.observation}`)

      phase('Ship')
      const SHIP_SCHEMA = {
        type: 'object',
        properties: { pr_url: { type: 'string' } },
        required: ['pr_url']
      }

      const ship = await agent(
        `In D:\\Temp\\AI Demo\\crypto-terminal on branch ${impl.branch}: squash all changes into a single commit with a concise message (no Co-Authored-By trailer), push to origin, then create a PR to haletskipavel/crypto-terminal titled "[AI-DEMO] ${issue.title}" that closes issue #${issue.number}. Follow the gh-conventions skill. Return the PR URL.`,
        { label: 'Commit, push, PR', schema: SHIP_SCHEMA }
      )

      if (ship) log(`PR created: ${ship.pr_url}`)
    }
  }
}
