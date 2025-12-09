# Shavtsak

Shavtsak is a web application built for my military unit to simplify and optimize guard duty scheduling.  
Instead of managing shifts manually in spreadsheets or WhatsApp, Shavtsak generates guard schedules that:

- Cover all required posts.
- Respect unit constraints.
- Maximize continuous sleep time and rest periods for each soldier.

The goal is to reduce friction and unfairness in guard rotations, especially during intense periods (e.g. wartime), while keeping the tool simple enough for anyone in the unit to use.

---

## 🎯 Main Features

_Currently implemented or partially implemented:_

- **Guard schedule generation**
  - Create a schedule for a given period (e.g. one night, several days).
  - Assign guards automatically according to predefined rules and constraints.
- **Multiple posts**
  - Supports several guard posts (e.g. main gate, floor/roof, etc.).
  - Each post has its own time slots and required number of people.
- **Basic fairness / rest logic**
  - Avoids back-to-back guards when possible.
  - Tries to maximize sleep windows and distribute shifts more evenly.

_Planned / in progress:_

- UI to configure:
  - List of soldiers.
  - Availability constraints.
  - Guard posts and time slots.
- Better fairness rules (e.g. limit per person per day, minimum rest gap).
- Export / share schedule (PDF / image / copy-paste format).
- Authentication or simple access control (optional, depending on unit needs).

---

## 🛠 Tech Stack

Shavtsak is currently built as a lightweight React application using Vite:

- **Frontend**
  - React
  - Vite
  - JavaScript / TypeScript (depending on how you evolve the project)
  - CSS / (optionally Tailwind or another UI library if you add it later)

_No backend is strictly required for the basic version if everything runs in the browser, but a backend can be added later if you want persistence or authentication._

---

## 🚀 Getting Started (Development)

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

Clone the repository and install dependencies:

```bash
git clone <YOUR_REPO_URL>.git
cd shavtsak
npm install
# or
yarn install
