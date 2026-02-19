---
trigger: always_on
---

dont push into github untill i told you for

## CI & Linting Safety
- **Validate Before Push**: Always run `npm run lint` and `npm run build` before pushing to ensure the codebase is healthy.
- **Zero Errors Policy**: Never push code if there are active lint errors or pipeline failures.
- **Auto-Fix**: Proactively resolve any linting issues discovered during the development process.