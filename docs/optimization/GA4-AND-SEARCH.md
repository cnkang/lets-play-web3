# Learning events, DebugView, and Search Console

This build does not create a GA4 property, a data stream, or a filter. If `GA4_MEASUREMENT_ID` is unset or not shaped like `G-` plus letters and digits, the page-view tag is omitted and learning events are not sent.

## Events

| Name | When it is sent | Required parameters |
| --- | --- | --- |
| `curriculum_start` | First “Start learning” click in the session | `locale` |
| `learning_path_start` | First click of each path (`start`, `play`, `ai`) in the session | `locale`, `learning_path` |
| `lab_start` | First control used on a lab page | `locale`, `lab_id` |
| `lab_complete` | The guided challenge is finished. Opening the page is not enough. | `locale`, `lab_id`, `challenge_id` |
| `lab_reset` | Reset, at most once per 500 ms. This allows `lab_complete` again. | `locale`, `lab_id` |
| `prompt_copy` | A prompt copy succeeds. Repeats of the same prompt inside 800 ms are dropped. The prompt text is not sent. | `locale`, `challenge_id` (`prompt-a` … `prompt-e`) |
| `guide_to_lab_click` | A guide link to a lab, once per page load | `locale`, `guide_id`, `lab_id` |
| `related_chapter_click` | A tracked chapter link, once per page load and target | `locale`, `challenge_id` (chapter slug) |

`locale` is `zh` or `en`. Free text, balances typed by the learner, wallet addresses, and prompt bodies are not parameters. Unknown names and unknown ids are dropped.

Completion means:

- Allowance lab: a finite approve left balances unchanged, a later `transferFrom` reduced both the balance and the allowance, and a later approve of 0 left the spent tokens where they were.
- Pool lab: a small quote and a large quote were both taken, one quote was executed, and one execution was refused because the output was below the stored minimum.
- Hash lab: an edit broke a stored hash while a later block still named the old hash, and a later recalculation produced a valid chain with a different head.

## How to look without writing production reports

Add `?events=local` to a page. Events are listed on the page and stored in `sessionStorage` under `lpw3_event_log`. `gtag` is not called.

Add `?ga_debug=1` only when you intend events to reach the property’s DebugView. Debug hits can still appear in standard reports until you filter them. Do not use this flag in automated tests against production.

`traffic_type=internal` is added when the host is `localhost` or `127.0.0.1`, when the URL has `?internal=1`, or when this browser has `localStorage.lpw3_internal = "1"`.

## Internal traffic filter

In GA4: Admin → Data collection → Data filters → Create → Internal traffic.

1. Create the filter in **Testing** mode first.
2. Compare a known internal visit with a normal visit.
3. Move the filter to **Active** only after that comparison. Activation can permanently drop data. This repository cannot undo that.

The code flag does nothing until the property has a matching filter.

## What to inspect

- Realtime or DebugView: event name, `lab_id`, `locale`, `learning_path`.
- Explore: `lab_start` versus `lab_complete` by `lab_id` and `locale`. Completion rate is completes divided by starts, for the same period. A start without a complete is a usability signal, not a failed deploy.
- Landing page and session source: which URL and which channel the visit used.
- Compare `locale=zh` and `locale=en` before comparing languages by page path alone.

Page views still come from the existing `gtag('config', …)` call. There is no consent banner. A banner would change that behaviour and needs a separate decision.

## Search Console

The owner does this in [Google Search Console](https://search.google.com/search-console). This repository cannot verify the property.

1. Add a **Domain** property for `liukang.com`, or a **URL-prefix** property for `https://letsplayweb3.liukang.com/`.
2. Prove control with the method Google shows (DNS for a domain property, or an HTML file / meta tag / Analytics for a prefix). DNS is an owner action. Do not invent a token in git.
3. Submit `https://letsplayweb3.liukang.com/sitemap.xml`.
4. Use URL Inspection on `/`, `/zh/`, `/en/`, one new lab, and one guide. Request indexing only for URLs you have actually published.
5. Read Pages → Indexing, and the exclusion reasons. A “Discovered – currently not indexed” row is not fixed by adding another page.
6. Read Performance for impressions, queries, clicks, and branded versus non-branded queries. Export the query list before changing titles.

Use Search Console for discovery and GA4 for what people did after they arrived. Neither tool, by itself, says the copy is good.
