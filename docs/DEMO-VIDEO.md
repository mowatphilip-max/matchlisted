# Matchlisted — demo video brief

**For Claude Code. Written 28 September 2026.**

Build a 90-second product demo of Matchlisted in operation, recorded from the real app with
demonstration data, plus a 30-second cut and a silent version for live narration. It will be shown
to the RBS Entrepreneurship Centre and to investors, and may go to HMRC as an investor marketing
document in the SEIS Advance Assurance pack. **That is why nothing in it may be faked.**

Read first, in this order: `CLAUDE.md`, `docs/DECISIONS.md` (§0.5, §1, §2, §4, §4a, §4b),
`docs/PITCH.md` (§1 and §2.8). Where this brief and DECISIONS.md disagree, DECISIONS.md wins.

---

## 1. Rules — each one exists for a reason

1. **Real app, real flows.** Record only screens that work end to end. Never build a mock page,
   a static screenshot dressed as the product, or a fake notification for the camera. If a scene's
   flow is not built, stop and report it: either build it properly to the spec in DECISIONS.md,
   or cut the scene. *Why: investors and HMRC will treat this as a statement of what exists.*
2. **Never production data.** Record against a local Supabase (`supabase start`, apply
   `supabase/migrations/`) or a Supabase branch. Print the project ref and confirm it is not
   production before the first write. *Why: the live project may hold real people's details.*
3. **No real person appears on screen.** Not one of Mowatt's 400 Quiet Seekers, not a real
   address, not a real listing photo. Names clearly fictional, emails `@example.com`, photos from
   our own or licensed stock. A small "Demonstration data" label sits in a corner throughout.
4. **Fix DECISIONS.md §0.5 before recording the offer scene.** A buyer must be able to submit a
   Note of Offer with no solicitor appointed and nothing paid, and the screen must say the note is
   not binding. Remove the £100 deposit rather than relabelling it. *Why: conditioning a buyer's
   offer is a trigger event under the Estate Agents Act; filming it would be filming a breach.*
5. **On-screen copy must match DECISIONS.md.** Before recording, search the codebase for each of
   these and fix or report every hit on a screen the video shows:
   `+ VAT` · `withdrawal fee` · `Hush Home Profile` · `Quiet Seeker Brief` · `0.8%` · `£300`
   (old buyer fee) · `commission` (in a conveyancing sense) · `Make your offer`.
   Consumer prices are inclusive: Home Report £580, buyer fee £360, photography £354,
   Rightmove £240, board £120. Terminology: **Hush Home Listing**, **Quiet Seeker Profile**,
   **Smart Sellers**. Price format: **Offers over £X**. The address stays hidden until a viewing
   is booked.
6. **The logo is placed, never drawn.** Use `public/brand/logo-horizontal.png` verbatim — scale
   and position only. Fonts: Bricolage Grotesque (headings), Instrument Sans (body). Colours:
   Anchor #3D4F61, Signal #E8693A, Precision #3AADDA, #1E8FC4 for small text.
7. **No AI-generated footage of the product.** Every frame of the app is a real capture.
8. **Tone: deadpan, never zany.** Mock the public listing, never the estate agent. The last
   eight seconds are completely straight.

---

## 2. Storyboard — 90 seconds

Demo cast (seed these): **Eilidh**, a Quiet Seeker; **Graham**, a Smart Seller with a four-bed
house in North Berwick (EH39). Supporting seekers across East Lothian so the Match Report shows a
believable count.

| Time | Scene | Route (check it) | What the viewer must see |
|---|---|---|---|
| 0:00–0:06 | Title | — | Logo on white. "Where Quiet Seekers meet Hush Homes." |
| 0:06–0:18 | 1 · Quiet Seeker Profile | `/join` or `/quiet-seekers` | Eilidh picks North Berwick and Gullane, up to £525,000, three bedrooms, sold STC — then types in her own words: "South-facing garden, walk to the beach." |
| 0:18–0:32 | 2 · The Match Report | `/match-report` | Graham enters EH39 and "4-bed detached". The count of registered buyers already matching lands. Free, before he lists. **The key frame — slow zoom on the number.** |
| 0:32–0:48 | 3 · Hush Home Listing | `/dashboard/home/new` | Hero shot only. Offers over £495,000. Address marked private. Optional add-ons with inclusive prices. The free claim with the total liability on the same screen. |
| 0:48–0:58 | 4 · The Matchlist | `/matches`, `/notifications` | A 90%+ match. Both sides told. Eilidh sees the hero shot, not the address. |
| 0:58–1:08 | 5 · Viewing | `/viewings/[id]` | She books a viewing. Only now does the address appear. |
| 1:08–1:18 | 6 · Note of Offer | `/homes/[id]/offer` | Offer submitted with no solicitor and nothing paid. Non-binding statement visible. |
| 1:18–1:30 | End card — straight | — | See §4. |

**30-second cut:** scenes 2, 3, 4 and the end card. **Silent version:** the 90-second edit with
captions but no voiceover, for a founder to narrate live.

---

## 3. How to build it

1. **Report before recording.** Walk every route above as each demo user. Report which scenes
   work end to end, which don't, and every stale piece of copy from rule 5. Wait for sign-off.
2. **Demo data.** `scripts/demo/seed-demo.mjs` — idempotent, every row tagged as demo, with a
   matching `teardown-demo.mjs`. Reuse `scripts/seed.mjs` where it fits; don't widen its blast radius.
3. **Run a production build** (`next build && next start`), not `next dev`, so no dev overlay
   or error badge appears on camera.
4. **Recording.** Add `@playwright/test` as a dev dependency. `scripts/demo/record.ts`:
   - one browser context per actor (Graham, Eilidh), one clip per scene;
   - viewport and `recordVideo` at 1920×1080;
   - inject a visible cursor with a click ripple; type with a ~45 ms per-key delay; hold 1.5–2.5 s
     on each key frame; wait for network idle before every hold;
   - a second pass at iPhone 14 size (390×844) for scenes 1–3 — sellers arrive on phones.
5. **Assembly.** Either ffmpeg (webm → H.264 mp4, yuv420p, 30 fps, trim and concat) or Remotion
   for titles, lower-third captions, the Match Report zoom and the end card. Remotion is free for
   very small companies — check its current licence terms before adding it.
6. **Captions.** An `.srt` file and a burned-in version. Instrument Sans, white on a translucent
   Anchor bar, never over the part of the UI being demonstrated.
7. **Voiceover.** Script in §4. Final voice should be Phil or Annabelle. A synthetic voice is
   fine as a timing placeholder only.
8. **Outputs** go to `demo/out/`, which is gitignored: `matchlisted-demo-90s.mp4`,
   `matchlisted-demo-30s.mp4`, `matchlisted-demo-90s-silent.mp4`, `captions.srt`, `poster.png`.
   Commit the scripts, never the videos, on a branch `demo-video`.
9. **Check before handing over.** Extract a frame every three seconds into a contact sheet and
   review every frame for: stale copy, any "+ VAT", a real name or address, a broken layout, a
   console error, a dev indicator, the logo altered in any way. Then run `teardown-demo.mjs`.
10. **Report back** with: which scenes are real captures, what was cut and why, what was fixed,
    and anything on screen you are unsure is accurate.

---

## 4. Voiceover script

Deadpan. Short sentences. Leave air.

- **Scene 1:** "Meet Eilidh. She wants a family home in North Berwick. She tells us once — where,
  how much, and what matters."
- **Scene 2:** "Meet Graham. He isn't sure he's selling. He puts in his postcode, and sees how
  many registered buyers are already looking for a home like his. It costs him nothing."
- **Scene 3:** "He lists privately. One photograph. No board, unless he wants one. The address
  stays hidden."
- **Scene 4:** "The Matchlist scores his home against every buyer. Eilidh is a match. They both
  hear about it."
- **Scene 5:** "She books a viewing. Only now does she see the address."
- **Scene 6:** "She makes an offer. No solicitor needed to do it. Nothing to pay."
- **End card, completely straight:** "List your house for free. No listing fee. No commission.
  You'll need a Home Report — that's the law in Scotland, not us. Ours is five hundred and eighty
  pounds. Matchlisted. Where Quiet Seekers meet Hush Homes."

**End card text on screen, all of it on one frame** (the free claim is only lawful with its
conditions beside it): "List your house for free. No listing fee. No commission. You'll need a
Home Report — that's the law in Scotland, not us. Ours is £580, payable whether or not your home
sells." · logo · matchlisted.com · "Demonstration data".
