# Guardian Frontend Documentation

This document provides a comprehensive overview of the Guardian frontend architecture, technology stack, project structure, and key components.

## 1. Technology Stack

The Guardian frontend is a modern, responsive web application built using the following core technologies:

-   **Framework:** React 19 (using `react` and `react-dom` version `^19.2.0`)
-   **Build Tool:** Vite (`^7.3.1`)
-   **Routing:** React Router v7 (`react-router ^7.13.1`)
-   **Styling:** Tailwind CSS (`^3.4.17`) combined with PostCSS, and animated utilities (`tailwindcss-animate`, `tw-animate-css`)
-   **UI Components:** Shadcn UI / Base UI for pre-built accessible components.
-   **Icons:** Lucide React (`lucide-react`)
-   **Data Visualization:** Recharts (`^3.8.0`)
-   **Mapping:** Leaflet & React-Leaflet (`react-leaflet ^5.0.0`)
-   **State & Query Management:** React Query (`@tanstack/react-query`) is configured, alongside native React hooks (`useState`, `useEffect`).
-   **Animation:** Framer Motion (`^12.35.2`)

## 2. Project Structure

The project is thoughtfully structured inside the `src` directory to separate concerns effectively:

```text
client/
├── public/                 # Static assets
├── src/                    
│   ├── components/         # Reusable UI components (e.g., Header.jsx, Sidebar.jsx)
│   ├── layouts/            # Page layouts wrapper (e.g., DashboardLayout.jsx) 
│   ├── lib/                # Shared utilities and configurations (e.g., api.js)
│   ├── pages/              # Main view components corresponding to routes
│   ├── App.jsx             # Root component handling routing
│   ├── index.css           # Global stylesheet and Tailwind directives
│   └── main.jsx            # Application entry point
├── package.json            # Dependencies and scripts (dev, build, lint, preview)
├── tailwind.config.js      # Tailwind CSS configuration theme and plugins
└── vite.config.js          # Vite path resolution (aliases) and optimizations
```

## 3. Routing & Layouts

Application routing is handled natively by `react-router` in [App.jsx](file:///f:/Guardian/client/src/App.jsx). 

The entire application uses a centralized layout approach. The primary layout wrapper is `DashboardLayout` which typically integrates the `Sidebar` and `Header` components, ensuring a persistent navigation experience. 

### Routes Map

| Path                  | Component            | Description |
| --------------------- | -------------------- | ----------- |
| `/`                   | [Dashboard.jsx](file:///f:/Guardian/client/src/pages/Dashboard.jsx)      | The main dashboard overview with key metrics. |
| `/shipments/:id`      | [ShipmentDetail.jsx](file:///f:/Guardian/client/src/pages/ShipmentDetail.jsx) | Deep dive into a specific shipment. |
| `/chaos`              | [ChaosInjector.jsx](file:///f:/Guardian/client/src/pages/ChaosInjector.jsx)  | Module for simulating disruptions (Chaos Engineering). |
| `/ports`              | [PortCongestion.jsx](file:///f:/Guardian/client/src/pages/PortCongestion.jsx) | Port monitoring, KPIs, and tracking vessels. |
| `/network`            | [NetworkRipple.jsx](file:///f:/Guardian/client/src/pages/NetworkRipple.jsx)  | Visualizing the ripple effects across the supply chain network. |
| `/analytics`          | [Analytics.jsx](file:///f:/Guardian/client/src/pages/Analytics.jsx)      | Detailed metrics and history data analysis. |
| `/settings`           | [Settings.jsx](file:///f:/Guardian/client/src/pages/Settings.jsx)       | Global application settings and configurations. |
| `/model-card`         | [ModelCard.jsx](file:///f:/Guardian/client/src/pages/ModelCard.jsx)      | Details and documentation about the underlying AI models (Shap, Dice, etc.). |

## 4. State Management & API Integration

### API Layer ([src/lib/api.js](file:///f:/Guardian/client/src/lib/api.js))
The application uses a centralized API utility strategy that wraps the standard JavaScript [fetch](file:///f:/Guardian/client/src/lib/api.js#42-44) API. It maps out functions related to diverse domains within the app:

-   **Dashboard:** [fetchDashboardOverview](file:///f:/Guardian/client/src/lib/api.js#22-24), [fetchAnalyticsSummary](file:///f:/Guardian/client/src/lib/api.js#24-25)
-   **Shipments:** [fetchShipments](file:///f:/Guardian/client/src/lib/api.js#26-28), [fetchShipment(id)](file:///f:/Guardian/client/src/lib/api.js#28-29), [fetchShipmentShap(id)](file:///f:/Guardian/client/src/lib/api.js#29-30), [fetchShipmentTimeline(id)](file:///f:/Guardian/client/src/lib/api.js#30-31), [fetchShipmentDice(id)](file:///f:/Guardian/client/src/lib/api.js#31-32), [fetchShipmentKimi(id)](file:///f:/Guardian/client/src/lib/api.js#32-33)
-   **Chaos:** [fetchChaosPresets](file:///f:/Guardian/client/src/lib/api.js#34-36), [injectChaos(params)](file:///f:/Guardian/client/src/lib/api.js#36-41)
-   **Ports:** [fetchPorts](file:///f:/Guardian/client/src/lib/api.js#42-44), [fetchPortKpis](file:///f:/Guardian/client/src/lib/api.js#44-45), [fetchVessels](file:///f:/Guardian/client/src/lib/api.js#45-46)
-   **Network:** [fetchNetwork](file:///f:/Guardian/client/src/lib/api.js#47-49)

This API layer connects to the backend deployed dynamically at `http://localhost:8000` by default.

### State Handling
Most pages (like [Dashboard.jsx](file:///f:/Guardian/client/src/pages/Dashboard.jsx)) manage data using standard React Hooks (`useState` and `useEffect`):

1. **Mounting Phase:** Pages trigger side-effects via `useEffect` to fetch data from the API helpers defined in [api.js](file:///f:/Guardian/client/src/lib/api.js).
2. **Local State:** Component state captures the result of these fetch calls, updating the UI safely. 
3. **Derived State:** Filters (e.g., showing 'all', 'critical', or 'monitoring' shipments) are derived dynamically from the primary local state variable.

## 5. UI and Design Aesthetics

The application integrates premium aesthetic standards using modern Tailwind properties, such as a custom glassmorphism styling feature commonly present as `glass-card` classes. 

-   **Theming:** Dark-themed UI with accents (`text-dash-accent`, `bg-dash-risk`, etc.)
-   **Interactivity:** Hover transitions, pulsating animated components (`animate-pulse`), and fade-in features (`animate-fade-in`) give the interface a dynamic and premium feel. 
-   **Responsiveness:** Extensively uses mobile-first CSS grids (`grid-cols-12`) ensuring standard dashboard formatting across all breakpoint classes.
