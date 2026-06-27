---
trigger: always_on
---

dont push into github untill i told you for
dont push in downstream.only push in main origin

## CI & Linting Safety
- **Validate Before Push**: run `npm run lint` and `npm run build` before pushing to ensure the codebase is healthy.no need too push after every change.ask userr to give permissioon oof push after major updaates.only then run all this validation.noo need to run them every time.only on push
- **Zero Errors Policy**: Never push code if there are active lint errors or pipeline failures.
- **Auto-Fix**: Proactively resolve any linting issues discovered during the development process.