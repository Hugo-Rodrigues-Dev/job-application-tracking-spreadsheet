# Job Application Tracker

## Why This Project Exists

Landing an internship requires juggling dozens of contacts, deadlines, follow-ups, and interviews. I needed a tool that keeps everything organized and actionable in one place, so I built this application to manage my outreach with clarity. To accelerate the process and keep the codebase clean, I partnered with **Codex**, an AI coding assistant that helps me iterate quickly, explore implementation ideas, and maintain the code quality while I practice building full-stack features.

## What Codex Brings To The Table

- Speeds up feature scaffolding so I can focus on user experience.
- Suggests clean code patterns.
- Acts as a sparring partner while I learn to ship complete, professional-grade apps at a faster pace.

## Capabilities

- Track every internship or job application with company, role, location, priority, next actions, and notes.
- View key metrics (total applications, interviews/offers, in-progress items, and refusals) at a glance.
- Filter the pipeline by status, priority, and application type, and search by company, role, or location.
- Add, edit, and delete applications through an intuitive UI with visual cues based on priority and status.
- Persist sensible defaults for newly created entries to speed up data entry.
- Keep the pipeline across refreshes with browser-based persistence powered by localStorage.

## Tech Stack

- **React 19** with functional components and hooks for state management.
- **Vite** for fast development server and bundling.
- **Tailwind CSS** for utility-first styling.
- **Lucide-react** for consistent iconography.
- **localStorage** for lightweight persistence without a backend.

## Data Storage

Every change to the pipeline is serialized to the browser’s `localStorage` under a dedicated key. On a first visit, the app seeds sample applications so you always see a populated interface; afterwards, edits, additions, and deletions overwrite that store so your data survives refreshes and restarts with zero backend setup.

**Good practice:** export your tracker data before you leave the application so you always keep an offline Excel backup of your candidatures. 
If the browser ever clears `localStorage` or something unexpected happens, you can now import that spreadsheet back into the app and recover the full history in seconds.

## Reuse This Project

Interested in using the tracker for your own internship hunt? Fork or clone the repository, customize the seed data, and extend the features—don’t hesitate to adapt it to your workflow.

## Roadmap Ideas

Redaction in-progress 🚧...

---

## 🙌 Stay Connected

You can connect with me on [LinkedIn](https://www.linkedin.com/in/hugo-rdg/) or follow my GitHub activity.

Thanks for passing by and happy coding! 🚀🐍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
