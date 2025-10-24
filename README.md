# Checkers Royal

Checkers Royal is a real-time multiplayer checkers game built with React and Supabase.
Players can create or join game rooms, play live matches, and communicate through in-game chat.
The project uses Supabase Realtime for instant synchronization of moves, messages, and game state across players.

---

## 🧱 Tech Stack

* **Frontend:** React, Vite
* **Backend:** Supabase (PostgreSQL, Realtime)
* **Styling:** Tailwind CSS
* **Language:** JavaScript / TypeScript

---

## ✨ Features

* Real-time multiplayer gameplay
* Room creation and joining system
* In-game chat support
* Move history tracking
* Realtime synchronization using Supabase

---

## ⚙️ Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/checkers-royal.git
   cd checkers-royal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Supabase**

   * Create a new Supabase project at [https://supabase.com](https://supabase.com)
   * Run the provided SQL migrations from the `supabase/migrations` folder
   * Copy your project credentials from Supabase and add them to a `.env` file:

     ```bash
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Run the project**

   ```bash
   npm run dev
   ```

5. Open the app in your browser (usually at `http://localhost:5173`).

---

## 📈 Future Improvements

* Player authentication and profiles
* Ranked matchmaking system
* Timed matches
* Custom themes and board styles

---
