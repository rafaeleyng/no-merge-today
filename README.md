# no-merge-today

A Chrome extension to block the Github merge button on specific days.

This is a PR just to test the merge button.

## scenarios

- [X] navigating directly to a PR link (full page load)
- [X] navigating from anywhere inside Github to the PR link (possibly a client-side render without full reload)
- [X] changing the config on the action popup
- [X] observing changes to the DOM that can be caused by changing the state of a PR
- [ ] detect end of current day/begin of new day
