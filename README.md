# Skill Cycle

The site is split into small files so workout programming can be edited without digging through page logic:

- `programming.js` — warm-ups, tests, and week-by-week workouts. Edit the week-numbered entries here.
- `app.js` — calendar, progress saving, account and coach workflows, navigation, inputs, and timer behavior.
- `styles.css` — visual styling and print layout.
- `index.html` — page shell that loads the other files.
- `supabase-schema.sql` — database schema, account roles, coach links, row-level security, and realtime publication setup.
- `supabase-config.js` — public Supabase project URL and anon key; never put a service-role key here.

The plan has two sessions per week: day 0 pairs double-unders with BMU work; day 1 pairs handstand-walk work with rope climbs. Weeks 1–2 are tests, weeks 3–12 are training, and weeks 13–14 are retests. The `BMU`, `BMU_PULLUPS`, `HSW`, `HSW_WALL`, and `ROPE` objects in `programming.js` use week numbers as keys; edit their entries to change a week.

Enter baseline and retest scores directly on the matching workout day. Those entries update the related targets and skill tracks in Inputs and appear in Results.

Use **Coach** to edit session focus, warm-up, training blocks, and cooldowns. Without an account, plans can still be transferred with JSON export/import. With Supabase configured, create coach and athlete accounts under **Account**, have the coach create a one-time link code, and have the athlete redeem it. The coach can then edit the linked plan and the athlete sees updates live. Athlete progress remains local to each browser and is not shared.

## Enable accounts and live plan sync

1. Create a Supabase project.
2. In the Supabase SQL Editor, run `supabase-schema.sql`.
3. In **Authentication → URL Configuration**, set the deployed site as the Site URL and add its URL to the redirect allowlist. Enable email/password sign-in; email confirmation is recommended.
4. Copy the project URL and the **anon/public** key from **Project Settings → API** into `supabase-config.js`. This browser key is public by design; row-level security protects the data. Never use the service-role key in the site.
5. Deploy the site files. Coach and athlete accounts must use the same configured Supabase project.

The browser uses Supabase Realtime for training-plan changes. Accounts, athlete links, and plans are stored in Supabase; only the coach and linked athlete can read a plan, and only the linked coach can edit it. Account roles are set at signup. An athlete can be linked to one coach at a time and can unlink at any time.

Keep all site files together when testing or publishing. GitHub Pages serves `index.html` and loads the CSS and JavaScript files beside it.
