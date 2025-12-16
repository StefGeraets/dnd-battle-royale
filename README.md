# D&D Battle Royale Manager

A specialized DM tool for running "Battle Royale" style D&D sessions (inspired by *WizardUnknown's Battlegrounds*). 

This app manages the map, the shrinking storm mechanism, loot drops, and provides a synchronized "Presenter View" to display on a TV for your players.

## 📜 Rules Module
This app is designed to run the **WizardUnknown's Battlegrounds** module.
* A PDF copy of the rules (`WUBG-Homebrewery.pdf`) is included in the `static/` folder.
* DMs can access this directly from the **Onboarding Screen** inside the app.

## ✨ Features

* **Dual-Screen Sync:** DM controls the state on a laptop; players see a polished, HUD-free map on the TV.
* **Automated Storm:** Zones shrink automatically based on a configurable game schedule.
* **Dynamic Visuals:** Choose from multiple themes (Fire, Ice, Toxic) with animated procedural fog.
* **Loot Management:** Place and manage 2x2 "Loot Chest" zones on the grid.
* **Persistence:** Auto-saves to your browser's local storage so you never lose game state during a reload.

## 🛠️ Local Installation & Setup

This project uses [Bun](https://bun.sh) as the package manager and runtime.

1.  **Clone the repository**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies**
    ```bash
    bun install
    ```

3.  **Start the development server**
    ```bash
    bun run dev
    ```

4.  **Open the App**
    * **DM Console:** [http://localhost:5173/dm](http://localhost:5173/dm)
    * **Player View:** [http://localhost:5173/presenter](http://localhost:5173/presenter)

## 🎮 How to Use

### 1. Setup (Pre-Game)
* Open the **DM Console**. You will see an onboarding guide with a link to the **PDF Rules**.
* **Second Screen:** Open the **Player View** in a new window, drag it to your TV/Second Monitor, and press `F11` for fullscreen.
* **Configuration:** * Set the **Total Game Time** (e.g., 2.5 Hours). The storm schedule generates automatically.
    * Select a **Map Preset** and **Storm Theme** (e.g., Ruins + Fire Storm).
    * Toggle **"Hide Map"** to keep the screen black (or show a splash screen) until you are ready.

### 2. Preparation (Loot)
* Switch interaction mode to **🎁 Chest**.
* Click empty grid cells to spawn **2x2 Loot Chests**.
* Click existing chests to **Rename** or **Delete** them.

### 3. Running the Game
* Click **👁 REVEAL MAP** to fade in the player screen.
* Click **START CLOCK** (or press `Space`) to begin the game timer.
* **Zone Logic:** * When the "Warning Phase" starts, switch to **🎯 Zone** mode.
    * Click anywhere on the map to set the **Center** of the next Safe Zone.
    * If you don't click, the zone shrinks concentrically by default.
* **Party Tracking:** Use `Arrow Keys` to move the "P" (Party) token around the map.

### ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **Space** | Start / Pause Timer |
| **Z** | Switch to **Zone** Mode |
| **C** | Switch to **Chest** Mode |
| **Arrows** | Move Party Token |
| **H** | Play Warhorn Sound |

## 📦 Building for Production

To create a static production build (e.g., for GitHub Pages):

```bash
bun run build