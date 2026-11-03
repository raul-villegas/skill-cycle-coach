# Skill Cycle

The site is split into small files so workout programming can be edited without digging through page logic:

- `programming.js` — warm-ups, tests, and week-by-week workouts. Edit the week-numbered entries here.
- `app.js` — calendar, progress saving, navigation, inputs, and timer behavior.
- `styles.css` — visual styling and print layout.
- `index.html` — page shell that loads the other files.

The plan has two sessions per week: day 0 pairs double-unders with BMU work; day 1 pairs handstand-walk work with rope climbs. Weeks 1–2 are tests, weeks 3–12 are training, and weeks 13–14 are retests. The `BMU`, `BMU_PULLUPS`, `HSW`, `HSW_WALL`, and `ROPE` objects in `programming.js` use week numbers as keys; edit their entries to change a week.

Enter baseline and retest scores directly on the matching workout day. Those entries update the related targets and skill tracks in Inputs and appear in Results.

Use the **Coach** tab to edit session focus, warm-up, training blocks, and cooldowns. Export the edited plan and import that JSON file from the Coach tab on the athlete's browser; plan files do not include athlete progress. This is a local file-sharing workflow, not account-based access: edits are stored in the current browser and are not synced between devices.

Keep all four site files together when testing or publishing. GitHub Pages serves `index.html` and loads the CSS and JavaScript files beside it.
