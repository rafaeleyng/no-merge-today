# no-merge-today

A Chrome extension to block the Github merge button on specific days.

## scenarios

- [X] navigating directly to a PR link (full page load)
- [X] navigating from anywhere inside Github to the PR link (possibly a client-side render without full reload)
- [X] changing the config on the action popup
- [X] observing changes to the DOM that can be caused by changing the state of a PR
- [ ] handle more reliably problematic cases, like PRs with conflicts, especially if only a single merge strategy has problems. Currently we try to preserve a button disabled if it was initialized disabled
- [ ] detect end of current day/begin of new day
