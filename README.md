# Nokka Sport

> A full-featured fitness & nutrition tracking web application built with React and Supabase.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat&logo=tailwindcss&logoColor=white)

---

## Features

### Workout Tracking
- Create and manage training sessions with full exercise library (50+ movements)
- Log sets with **weight, reps, RPE** and optional notes per set
- Bodyweight exercise support — auto-adds user body weight to calculations
- Save named **routines** and relaunch them in one click
- Background-safe **rest timer** persisted via localStorage

### Analytics
- Weekly workout **streak** tracker
- **Personal records** (PR) per exercise with history
- Estimated **1RM** via Epley formula
- Volume breakdown by muscle group
- Progression charts over time

### Nutrition
- Daily **calorie & macro tracking** (protein, carbs, fats)
- Smart goal calculation using **Mifflin-St Jeor** formula (BMR → TDEE → daily target)
- Adjusts automatically based on workout calories burned (MET-based)
- Supports **cut / maintain / bulk** modes with adapted macro ratios
- **Water intake** tracking (250 ml increments)
- 7-day history charts

### Food & Meal Management
- Personal food database with full macro breakdown
- **OpenFoodFacts API** integration — search millions of products
- **Barcode scanner** (html5-qrcode) for instant food lookup
- Reusable **meal templates** with auto-calculated totals
- **Meal planner** — assign meals to specific dates and meal slots
- **Smart shopping list** auto-generated from upcoming meal plans

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, JSX |
| Styling | Tailwind CSS 3, Lucide React icons |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Charts | Custom SVG charts + Recharts |
| Barcode | html5-qrcode |
| Food data | OpenFoodFacts REST API |
| State | React Context API |

---

## Architecture

```
src/
├── context/
│   ├── WorkoutContext.jsx   # Auth, sessions, sets, rest timer, stats
│   └── FoodContext.jsx      # Foods, meals, meal plans, shopping lists
├── pages/                   # One file per route (15 pages)
├── components/              # Reusable UI components
├── services/
│   └── openFoodFactsApi.js  # External API wrapper
├── utils/
│   ├── calorieCalculations.js  # BMR / TDEE / MET engine
│   └── photoUpload.js
└── supabaseClient.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/HugoA54/workout-tracker.git
cd workout-tracker
npm install
```

### Environment variables

Create a `.env` file at the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### Run

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Database Schema

The application uses the following Supabase tables:

`exercises` · `sessions` · `sets` · `user_profiles` · `nutrition_logs` · `foods` · `meals` · `meal_foods` · `meal_plans` · `nutrition_log_meals` · `shopping_lists`

---

## License

MIT
