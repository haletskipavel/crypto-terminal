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
    `Implement the fix for issue #${issue.number}: "${issue.title}" in D:\\Temp\\AI Demo\\crypto-terminal.
1. git checkout main && git pull
2. git checkout -b AI-DEMO-${issue.number}-phaletski
3. Read the relevant source files before editing
4. Make minimal, focused changes to implement the fix
5. Run npm run build — fix any errors before finishing
6. Do NOT commit yet
Return the branch name (AI-DEMO-${issue.number}-phaletski) and a one-sentence summary of what changed.`,
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
      `In D:\\Temp\\AI Demo\\crypto-terminal: start ng serve on port 4300 using PowerShell (Start-Process powershell -ArgumentList "-NoProfile -Command ng serve --port 4300" -WindowStyle Hidden), wait until http://localhost:4300 responds (poll every 2s up to 60s with Invoke-WebRequest). Then use Playwright to navigate to http://localhost:4300 and take a screenshot. Verify this change is visible: "${impl.summary}". Stop the server (Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force). Return passed true/false and your observation.`,
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
        `In D:\\Temp\\AI Demo\\crypto-terminal on branch ${impl.branch}:
1. Squash all changes into a single commit — run: git add -A && git commit -m "<concise imperative message>". Never add a Co-Authored-By trailer.
2. Push: git push -u origin ${impl.branch}
3. Create the PR:
   gh pr create --repo haletskipavel/crypto-terminal --title "[AI-DEMO] ${issue.title}" --body "$(cat <<'EOF'
## Summary

Closes #${issue.number}

- ${impl.summary}
EOF
)"
Return the PR URL.`,
        { label: 'Commit, push, PR', schema: SHIP_SCHEMA }
      )

      if (ship) log(`PR created: ${ship.pr_url}`)
    }
  }
}
