# Skill Cycle

The site is split into small files so workout programming can be edited without digging through page logic:

- `programming.js` — warm-ups, tests, and week-by-week workouts. Edit the week-numbered entries here.
- `app.js` — calendar, progress saving, navigation, inputs, and timer behavior.
- `styles.css` — visual styling and print layout.
- `index.html` — page shell that loads the other files.

The plan has two sessions per week: day 0 pairs double-unders with BMU work; day 1 pairs handstand-walk work with rope climbs. Weeks 1–2 are tests, weeks 3–12 are training, and weeks 13–14 are retests. The `BMU`, `BMU_PULLUPS`, `HSW`, `HSW_WALL`, and `ROPE` objects in `programming.js` use week numbers as keys; edit their entries to change a week.

Keep all four site files together when testing or publishing. GitHub Pages serves `index.html` and loads the CSS and JavaScript files beside it.
