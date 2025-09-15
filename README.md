# ⌨️ Typing Speed Tester

A clean, responsive, and accessible typing speed tester that runs right in your browser. Track WPM, accuracy, CPM, and errors with a polished UI on top of a vibrant gradient background.

<p align="center">
  <a href="#"><img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white"></a>
  <a href="#"><img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white"></a>
  <a href="#"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-323330?logo=javascript&logoColor=F7DF1E"></a>
  <a href="#"><img alt="Responsive" src="https://img.shields.io/badge/Responsive-Yes-22c55e"></a>
  <a href="#"><img alt="A11y" src="https://img.shields.io/badge/Accessibility-A11y-8b5cf6"></a>
  <a href="#"><img alt="License" src="https://img.shields.io/badge/License-MIT-0ea5e9"></a>
</p>

---

## ✨ Features

- 🎨 Attractive, accessible UI on a gradient background  
  Background: `linear-gradient(to right, #3b82f6, #6366f1, #db2777)`
- ⏱️ Adjustable Duration: 15s, 30s, 60s, 120s
- 🧠 Text Sources: Quotes, Pangrams, Code-like, Lorem
- 🧩 Difficulty Modes:
  - Normal
  - Hard (disables backspace)
- 📈 Live Stats: WPM, CPM, Accuracy, Errors, Timer
- 🏆 Best WPM saved (localStorage)
- 🗂️ Recent Results History (persisted, up to 15 entries)
- ⏯️ Pause/Resume and New Text controls
- ⌨️ Keyboard Shortcuts:
  - Enter: Start
  - Escape: Reset
  - Space: Pause/Resume only when the input is NOT focused
  - Space inside the typing box inserts a normal space
- 📱 Fully responsive
- ♿ Thoughtful focus states and reduced-motion support

---

## 🚀 Quick Start

1. Download or clone this repository
2. Open `index.html` in your browser  
   - Or serve locally for best results:
     - Python: `python -m http.server 8000`
     - Node (http-server): `npx http-server -p 8000`
3. Start typing! Press Enter to begin a test.

---

## 📸 Screenshots

![image](https://github.com/MdSaifAli063/Typing-Speed-Tester/blob/09de04acac423f02754d8001d494f5d0d5ca796e/Screenshot%202025-09-16%20012301.png)

Typing View
Results & History

---

## 🗂️ Project Structure


. ├── index.html # UI markup ├── style.css # Theme, layout, and component styles ├── script.js # App logic, timing, scoring, history └── assets/ └── banner.png # Optional banner for README


---

## 🖱️ How to Use

1. Choose Duration, Text Source, and Difficulty
2. Press Start (or Enter)
3. Type what you see in “Text to type”
4. View live stats while you type
5. Press Pause or click outside input and press Space to pause/resume
6. Review your results and history after finishing

Notes:
- Spacebar behavior:
  - When typing in the input, Space inserts a space normally
  - When the input is NOT focused, Space toggles Pause/Resume

---
## 🎛️ Customization

### Change the Background Gradient
In `style.css`, ensure the body background is set (towards the end of the file to override earlier rules):
```css
body {
  background: linear-gradient(to right, #3b82f6, #6366f1, #db2777);
}


Adjust Theme Surfaces and Text
Use the CSS variables at the top of style.css to tweak surface transparency, borders, and focus rings.

Edit/Extend Text Sources
In script.js, update the TEXT_BANK to add/remove phrases:

const TEXT_BANK = {
  quotes: [
    "Simplicity is the soul of efficiency.",
    // add more
  ],
  pangrams: [
    "The quick brown fox jumps over the lazy dog.",
  ],
  code: [
    "for (let i = 0; i < 10; i++) { console.log(i); }",
  ],
  lorem: [
    "Lorem ipsum dolor sit amet consectetur...",
  ],
};


Change Duration Options
Edit the <select id="duration-select"> options in index.html.

⌨️ Keyboard Shortcuts

Enter: Start test (when idle/finished)
Escape: Reset test
Space:
Toggles Pause/Resume only if the input is not focused
Types a space when the input is focused
Tip: Click anywhere in the typing area to refocus the input while running.

🧪 Scoring Details

WPM = (correct characters / 5) / minutes
CPM = correct characters / minutes
Accuracy = correct / typed × 100
Errors = total incorrect characters typed
Best WPM is stored in localStorage under typing-best-wpm
History is stored in localStorage under typing-history (max 15 recent results)

🛠️ Development Notes

Plain HTML/CSS/JS—no build step required
Uses requestAnimation-friendly timers (setInterval) for 100ms updates
Respects prefers-reduced-motion for users who opt out of animations
Focus-visible outlines and clear states for keyboard users

🐞 Troubleshooting

Gradient not showing?
Make sure your gradient body rule is last in style.css, or remove earlier body background rules.
History not saving?
Ensure your browser allows localStorage (not in private mode) and JavaScript is enabled.
Space pauses when typing?
This project is configured so Space inside the input types a space; Space outside the input toggles pause/resume.

Typing View
Results & History

📄 License

MIT License — feel free to use, modify, and share.

🙌 Acknowledgements

Fonts: Inter + JetBrains Mono (Google Fonts)
Pangrams and quotes collected from public sources
Icons and badges via emojis and shields.io
Happy typing! 🎉
