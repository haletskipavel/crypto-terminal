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
  'Fetch the next available ai-agent issue to work on.',
  { label: 'Fetch issues', schema: ISSUE_SCHEMA, agentType: 'WALLE' }
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
    `Implement the fix for issue #${issue.number}: "${issue.title}". Do NOT commit yet. Return the branch name and a one-sentence summary of what changed.`,
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
      `In . on branch ${impl.branch}: validate the change "${impl.summary}". Save screenshot to ".playwright-mcp/${impl.branch}.png".`,
      { label: 'Playwright screenshot', schema: VALIDATE_SCHEMA, agentType: 'WALLE' }
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
        `In . on branch ${impl.branch}: ship issue #${issue.number} "${issue.title}". Include "- ${impl.summary}" and "Closes #${issue.number}" in the PR body.`,
        { label: 'Commit, push, PR', schema: SHIP_SCHEMA, agentType: 'WALLE' }
      )

      if (ship) log(`PR created: ${ship.pr_url}`)
    }
  }
}
