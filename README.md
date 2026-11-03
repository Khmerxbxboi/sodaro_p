# Sodaro - Inspection Check (working mobile web demo)

This is an educational **working website**, not a rendered mockup. It uses your original blue circuit-brain logo.

## What's included

- `index.html`, `style.css`, `app.js`: mobile-first web app
- `assets/`: your Sodaro logo, three case photos and QR identifiers
- `print/Sodaro_three_scan_cards.pdf`: three US-letter portrait pages, designed for double-sided? **No - print single sided, IN COLOR**, one sample per page, answers hidden
- `print/Sodaro_instructor_answer_key.pdf`: correct PASS/FAIL cases and references; keep this separate from students
- `manifest.webmanifest` and `service-worker.js`: optional install-like browser experience on HTTPS

## Working camera demo

1. Host this folder on **GitHub Pages with HTTPS** (steps below). Open the resulting URL on your phone.
2. Print the three sample pages **IN COLOR** at **100% size, single-sided**.
3. On your phone, tap **Take a photo**; capture the full card so the photo and colored square QR near the bottom are both included. The app reads a unique practice-code from the picture and shows the appropriate training result. Alternatively, tap **Scan live** and hold the card steady.
4. If camera permission is unavailable, tap the three built-in sample cards to see the exact same explanatory result.

The scanner recognizes a printed color training marker entirely on-device, with the browser's native QR decoder as an optional extra. There is no CDN dependency. The camera input works in supported mobile browsers. Use HTTPS for live camera support. Photographs never get uploaded to a server.

## Deploy to GitHub Pages (simplest method)

1. Create a new public GitHub repository, e.g. `sodaro-inspection`.
2. Unzip and **upload the files inside this folder to the repository root** (`index.html` must be at the top level, not nested within another folder).
3. In GitHub, go to **Settings > Pages > Build and deployment > Deploy from a branch**. Choose `main`, directory `/ (root)`, and Save.
4. GitHub provides a URL in the form `https://YOUR_USERNAME.github.io/sodaro-inspection/`. Use that **actual** link on your phone. GitHub Pages publishing may take a few minutes. Use your own published link; no deployment has been performed automatically.
5. Add this link as the Inspection Check button inside your existing Sodaro app, or copy this feature's code into your existing project.

To run locally, use `python3 -m http.server 8000` from this directory and visit `http://localhost:8000` on the computer. For a phone on Wi-Fi, use GitHub Pages HTTPS because live camera requires a secure context. Photo file upload may still work over HTTP depending on browser.

## Correct training answers

| Printed case | Expected result | Focus | Example reference |
|---|---|---|---|
| 01 | FAIL | Obstructed dedicated handwashing sink | California Health & Safety Code § 113953.1 |
| 02 | FAIL | Electrical junction/outlet box lacking cover | 8 CCR § 2473.2(a) |
| 03 | PASS **for visible cleanliness check only** | Prep surface appears visually clear | California Health & Safety Code § 114115(a) |

### Important limitations (please disclose at your presentation)

- The scanner is **real**: it reads an actual printed card marker from your phone's camera or a selected photo. But it **does not use AI to detect violations**. It recognizes which of these **three predefined practice cards** the photo contains and retrieves the case's prepared learning guidance. An unrelated image or QR-free photo returns an unrecognized message.
- It is not an official health, building, or electrical inspection. A PASS label does **not** certify a business as compliant. The clean-looking photo cannot reveal microbiological contamination, temperatures, permit history, or other nonvisual issues.
- The listed code references are informative starting points. Confirm applicability with the relevant California authority, the City of Oakland and/or Alameda County for real facilities. For wiring, qualified electrical professionals must assess actual hazards.
- Product concept keeps two core features: permits/licenses navigation, and inspection preparation; this website prototypes the latter feature.

## Classroom script (20 seconds)

“I'm developing Sodaro to make starting a business in Oakland less confusing. This is a camera-based inspection learning feature. These three examples have hidden answers. When you scan a card, Sodaro recognizes the practice case and shows the possible issue, the code reference, and what to fix. This is a tested classroom prototype, not yet an AI inspector or a government inspection result.”
