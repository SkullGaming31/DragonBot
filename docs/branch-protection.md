**Branch Protection — Default Branch**

- **Rule name:** PR Required
- **Enforcement:** active (repository-level)
- **Target:** default branch (condition include: `~DEFAULT_BRANCH`)
- **Bypass actors:** none (no bypass allowed)

Summary of enforced rules:

- Prevent branch deletion
- Prevent non-fast-forward pushes
- Require pull requests for changes; review threads must be resolved before merge
- Allowed merge methods: merge, squash, rebase
- Run CodeQL code-scanning with a high-or-higher security threshold; treat scanning alerts as errors
- Enforce code quality checks at severity `errors`

What this means:

- Changes to the default branch must be made through a pull request that resolves review threads.
- There are no configured bypass actors, so branch-protection cannot be bypassed by users or apps.