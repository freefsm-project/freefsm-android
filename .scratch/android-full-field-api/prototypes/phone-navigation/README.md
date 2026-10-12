# Throwaway phone navigation study

Decision: [Explore phone navigation and workflow screens](https://github.com/freefsm-project/freefsm-android/issues/6).

**Question:** Which phone-first navigation structure best exposes the agreed Job-centered workflows and synchronization recovery?

No Android project or UI exists yet, so this is a standalone browser wireframe beside the planning artifacts. It is not production code, a server integration, or a complete protocol simulator. It uses fictional data and in-memory state, no packages, fonts, Google services, network requests or browser storage. Reload resets the demo. Scenario changes reset queued fixtures; they are not simulations of real permission-revocation handling.

## Run

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory .scratch/android-full-field-api/prototypes/phone-navigation
```

Open **http://127.0.0.1:8765/?variant=A**. Stop the server with Ctrl+C. Opening `index.html` directly also works in browsers that permit local scripts/history updates.

## Variants

- **A — Four destinations:** persistent Jobs / Time / Sync / Account bottom navigation; Overview / Files / Billing inside a Job. Overview combines work and context, with compact schedule/location/contact information, work controls, expandable Customer/Project/Asset details and Comments below.
- **B — Workday first:** next-Job focus and timeline; persistent timer and tool shortcuts; expandable Job sections.
- **C — Compact directory:** dense Job list and global menu; a Job section index rather than a tabbed overview.

Use the floating switcher or left/right arrows outside form controls. `?variant=A`, `B`, or `C` is shareable and reload-stable. The switcher is outside the simulated phone and exists only in this isolated prototype; there is no production route or build integration.

## First review

Compare the same journey in all three: open the pump inspection, find notes/Files/Asset history, open a commercial document, locate Sync activity and compare a conflict, then find standalone time and sessions. Try offline, restricted, empty and expired-lease scenarios and the setup shortcut. Narrow the browser to 320–414px for phone density.

Camera, payment, session, PDF and document workflow actions use explicit simulated review dialogs. Only representative simple edits gain simulated confirmation through Sync now. Unknown Payment outcomes remain uncertain; the demo does not invent receipts. Several list rows open the same Job fixture. These are deliberate scope limits for this navigation review, not validated product decisions.

The human selected **A — Four destinations** as the preferred navigation direction; see [the recorded feedback](https://github.com/freefsm-project/freefsm-android/issues/6#issuecomment-6125788662). The approved direction does not turn placeholder dialogs into complete field designs. B and C are retained as comparison artifacts.

The human also approved combining Work and Context into **Overview**, with **Overview / Files / Billing** inside a Job and Overview opening by default; see [the layout feedback](https://github.com/freefsm-project/freefsm-android/issues/6#issuecomment-6126425235). Open `http://127.0.0.1:8765/?variant=A&screen=job` directly to the revised Job.

## Commercial screen iteration

Open **http://127.0.0.1:8765/?variant=A&screen=job&section=Billing**. The approved structure is now available to try:

1. A unified Estimate/Invoice list shows number, status, total, pending state and authorized conversion provenance. Creation actions are separate.
2. Documents open in summary mode. Choose **Edit** explicitly.
3. The editor scrolls through **Details**, **Line items**, and **Totals & terms**, with **Save changes** always visible outside the scrolling area.
4. Tap a line to edit it, add a custom line, or select a fictional Pricebook Item. Apply the line to the unsaved document draft, then save the document as **Pending sync**.

This is an interaction trial, not financial logic: USD/no-tax/no-adjustment fixtures and simplified date/line inputs. Complete document fields, tax and adjustment controls remain for subsequent review. Saved commercial intent stays pending; the demo does not fabricate server numbers, finalization or Payment acceptance. Reload discards all simulated drafts and edits. The human tried and approved the commercial interaction structure; see [the review outcome](https://github.com/freefsm-project/freefsm-android/issues/6#issuecomment-6127083149).

## Recovery screen iteration

Open **http://127.0.0.1:8765/?variant=A&screen=sync**. Needs attention comes first when populated, followed by Syncing and Waiting; Completed is collapsed. Use **Try Field Notes conflict** or **Try unknown Payment outcome**, then open the generated item.

The focused screen explains the affected action/record, what happened, blocked follow-up work and next steps. A conflict supports comparison, reviewed resubmission or discard. An unknown Payment outcome supports checking the original receipt, never replacement submission; the simulator deliberately leaves it unknown. The human tried and approved the focused recovery layout; see [the review outcome](https://github.com/freefsm-project/freefsm-android/issues/6#issuecomment-6127429263).

## Capture

Preserved on the dedicated [prototype/phone-navigation branch](https://github.com/freefsm-project/freefsm-android/tree/prototype/phone-navigation). The decision issue links the immutable commit used for review. This is a throwaway primary source for planning: implement the validated decisions in the Android application rather than merging this browser prototype into production code.
