# Guardian Frontend - Detailed Features Documentation

## 📊 Overview
Guardian is an AI-powered early warning system for shipment delays with a premium dark-themed dashboard interface. The frontend provides real-time risk monitoring, predictive analytics, and AI-driven intervention recommendations.

---

## ✅ IMPLEMENTED FEATURES

### 1. Dashboard (Main Overview)
**Location:** `client/src/pages/Dashboard.jsx`

#### Implemented:
- **Hero Metrics Card**
  - Total SLA Savings display (₹420,000 yearly average)
  - Real-time percentage change indicators (+12.4%)
  - Gemini AI active status indicator with pulse animation
  - High-risk shipment count with live updates
  - Abstract SVG gradient visualization overlay

- **KPI Metric Cards**
  - Active High-Risk shipments counter with critical breakdown
  - Carrier Reliability percentage (78%) with carrier avatars
  - Interventions Today counter with success badges
  - Interactive increment/decrement controls

- **Demurrage & Penalty Exposure Panel**
  - Total exposure amount (₹1,250,000 at risk)
  - Day-over-day change tracking (+8% increase)
  - Regional Risk Breakdown visualization
    - India Hubs (40%)
    - Euro Ports (35%)
    - USA (25%)
    - Others (0%)
  - System Insights AI recommendation box
  - Preventive measures status (70% Care, 20% Preventive)

- **Shipments Alerts Table**
  - Real-time shipment list with risk scores
  - Search functionality for health metrics
  - Filter tabs: All Alerts / Critical / Monitor
  - Columns: Shipment ID, Route, Risk Score, Status
  - Color-coded risk indicators (Green/Orange/Red)
  - Status badges: Stable / Monitoring / Intervene
  - Click-through navigation to shipment details
  - Pagination controls (3 pages)
  - Auto-refresh countdown (42s)

- **WebSocket Integration**
  - Live risk score updates via `/ws/risk-updates`
  - Real-time shipment data synchronization
  - Automatic reconnection handling

#### Planned Enhancements:
- [ ] Advanced filtering by carrier, route, service tier
- [ ] Export dashboard data to CSV/PDF
- [ ] Customizable KPI widgets (drag-and-drop)
- [ ] Historical trend comparison (week-over-week)
- [ ] Alert notification center with sound/visual alerts
- [ ] Multi-currency support (USD, EUR, GBP)

---

### 2. Shipment Detail Page
**Location:** `client/src/pages/ShipmentDetail.jsx`

#### Implemented:
- **Risk Hero Card**
  - Large risk score display (87% ± 5%)
  - Prediction interval range (79% - 95%)
  - Confidence badge (High/Medium/Monitor)
  - SLA breach warning with affected hub
  - Animated alert triangle icon

- **Checkpoint Timeline**
  - Visual progress tracker with 3 states:
    - ✅ Completed (green with checkmark)
    - ⚠️ Delayed (red with alert icon)
    - 📍 Pending (gray with map pin)
  - Checkpoint details:
    - Location name
    - Timestamp/ETA
    - Delay tags (DELAYED, WEATHER)
    - Vessel information
  - Dashed connector lines between checkpoints

- **Risk Drivers (SHAP Analysis)**
  - Top 3 feature importance bars
  - Positive/negative impact indicators
  - Color-coded bars (red for risk increase, green for decrease)
  - Numerical impact values (±0.24, -0.18, +0.09)
  - Hover tooltips with explanations

- **AI Intervention Engine Card**
  - Recommended action display
  - Priority Express badge
  - Three metric sub-cards:
    - Action Cost (₹12,000)
    - SLA Saved (₹85,000)
    - Net Saving (₹73,000)
  - DiCE Counterfactuals section
    - 3 what-if scenarios
    - Risk reduction percentages
    - Optimal option highlighting
  - Action buttons:
    - Accept AI Action (primary)
    - Human Override (secondary)

- **Breadcrumb Navigation**
  - Shipments → Shipment ID path
  - Clickable parent links

#### Planned Enhancements:
- [ ] Multi-horizon risk timeline (T+24, T+48, T+72)
- [ ] Historical intervention success rate
- [ ] Alternative route suggestions with map overlay
- [ ] Real-time carrier availability checker
- [ ] Cost-benefit comparison matrix
- [ ] Intervention outcome tracking
- [ ] PDF report generation
- [ ] Share shipment link functionality

---

### 3. Chaos Injector (Simulation Lab)
**Location:** `client/src/pages/ChaosInjector.jsx`

#### Implemented:
- **Disruption Control Panel**
  - Three slider controls:
    - Weather Severity (0-10 scale)
    - Port Strike Probability (0-100%)
    - Port Congestion Index (0-10 scale)
  - Real-time value badges
  - Left/right labels (CLEAR→EXTREME, STABLE→CRITICAL)
  - Quick preset buttons (Suez Blockage, Monsoon Surge, Port Strike)

- **Batch Disruption Mode** ⚡
  - Hub selector dropdown (Mumbai, Delhi, Chennai, etc.)
  - Severity slider (1-10)
  - Large "Fire Batch Disruption" button
  - Network-wide impact simulation
  - Entire map goes RED simultaneously

- **Interactive Network Map (Leaflet)**
  - 10 major supply chain nodes:
    - Mumbai, Delhi, Chennai, Kolkata, Ahmedabad
    - Hyderabad, Bengaluru, Pune, Singapore, Shanghai
  - Node states:
    - Normal (mixed colors)
    - Firing (orange pulse)
    - Red Alert (all nodes red with risk %)
  - Edge connections showing propagation paths
  - Dynamic color coding based on risk level
  - Tooltips showing node codes and risk percentages

- **Metric Cards**
  - Shipments Affected counter (1,240)
  - Delta Exposure (₹245,000 daily loss)
  - Trend indicators (+12.5%)

- **Real-time Risk Cascade Terminal**
  - Color-coded log entries:
    - CRITICAL (red)
    - WARNING (yellow)
    - INFO (gray)
    - AI (cyan)
    - SYSTEM (gray)
  - Timestamp for each entry
  - Auto-scroll to latest
  - Live feed indicator
  - Terminal-style UI with traffic light dots

#### Planned Enhancements:
- [ ] Historical chaos event replay
- [ ] Multi-region simultaneous disruption
- [ ] Weather API integration (real-time data)
- [ ] Port strike probability ML model
- [ ] Carrier capacity constraints simulation
- [ ] Customs delay injection
- [ ] Geopolitical event scenarios
- [ ] Save/load custom scenarios
- [ ] Chaos event scheduling
- [ ] Impact heatmap overlay

---

### 4. Port Congestion Dashboard
**Location:** `client/src/pages/PortCongestion.jsx`

#### Implemented:
- **Header Section**
  - Last Refresh timestamp (2 mins ago)
  - Generate Report button
  - Calendar icon with refresh indicator

- **KPI Cards (4 metrics)**
  - Global Avg Index (6.4/10)
  - High Risk Ports (12)
  - Avg Wait Time (8.4 Days)
  - Potential Demurrage (₹2.45M)
  - Change indicators (±%)

- **30-Day Trend Cards (3 ports)**
  - Mumbai Port (8.2 index, +12%)
  - Singapore (4.1 index, -4%)
  - Rotterdam (5.5 index, +2%)
  - SVG sparkline charts
  - Gradient fill for primary port

- **Global Port Rankings Table**
  - Columns:
    - Port Name with country code badge
    - Congestion Index (0-10 scale)
    - Visual progress bar
    - Avg Wait Time (days)
    - Demurrage Risk Cost (₹)
    - Health Status badge (Critical/Optimal/Moderate)
    - Details action link
  - Filter tabs: All Ports / High Risk
  - Color-coded congestion bars
  - Glow effect for high-risk ports (≥7.0)
  - Pagination (3 pages)
  - Auto-refresh countdown

- **Default Port Data**
  - Mumbai Port (Critical, 8.2 index)
  - Singapore (Optimal, 4.1 index)
  - Rotterdam (Moderate, 5.5 index)
  - Los Angeles (Critical, 7.8 index)

#### Planned Enhancements:
- [ ] Real-time vessel tracking integration
- [ ] Port capacity utilization charts
- [ ] Berth availability status
- [ ] Weather impact on port operations
- [ ] Historical congestion patterns
- [ ] Port-to-port comparison tool
- [ ] Demurrage cost calculator
- [ ] Vessel queue visualization
- [ ] Port efficiency benchmarking
- [ ] Alert notifications for congestion spikes

---

### 5. Analytics Dashboard
**Location:** `client/src/pages/Analytics.jsx`

#### Implemented:
- **Header Section**
  - "Deep Analytics" title with italic styling
  - Subtitle: "Cross-sectional analysis of supply chain operational performance"
  - Export CSV button

- **Top-Level KPI Cards (3 metrics)**
  - SLA Compliance (94.2%, +2.1% YoY)
  - Demurrage Avoided (₹4.2M, +₹1.1M MTd)
  - Model Accuracy (89.4%, Stable)
  - Icon badges for each metric

- **Carrier Performance Breakdown**
  - Horizontal bar chart visualization
  - 4 carriers tracked:
    - FedEx-2 (92% SLA Hit Rate)
    - BlueDart (78%)
    - Delhivery (85%)
    - DHL-4 (62%)
  - Color-coded bars (green/yellow/cyan/red)
  - Percentage labels

- **Demurrage Avoidance Trend**
  - 7-day bar chart (Mon-Sun)
  - Interactive hover tooltips showing ₹ values
  - Animated hover effects
  - Border axes (left and bottom)
  - Day labels at bottom

#### Planned Enhancements:
- [ ] Time range selector (7D/30D/90D/1Y)
- [ ] Drill-down by carrier/route/region
- [ ] Predictive trend forecasting
- [ ] Cost breakdown by category
- [ ] ROI calculator for interventions
- [ ] Comparative analysis (carrier vs carrier)
- [ ] Custom metric builder
- [ ] Scheduled report generation
- [ ] Data export in multiple formats
- [ ] Interactive chart filtering

---

### 6. Settings Page
**Location:** `client/src/pages/Settings.jsx`

#### Implemented:
- **Tab Navigation (5 sections)**
  - General Preferences
  - Alert Thresholds
  - API Keys
  - Data Integrations
  - Interface
  - Active tab indicator (cyan dot)

- **Guardian Core Configuration Panel**
  - Base Risk Threshold slider (0.65 default)
  - Backend Inference URL input (http://localhost:8000)
  - LLM Agent Backend (Gemini API) password field
  - Notification Channels checkboxes:
    - Email Daily Digest
    - High Risk SMS Alerts
    - Slack Webhook via Zapier
  - Save Configuration button

- **Visual Design**
  - Shield icon header
  - Glass card styling
  - Cyan accent colors
  - Hover effects on tabs

#### Planned Enhancements:
- [ ] User profile management
- [ ] Team member access control
- [ ] Custom alert rules builder
- [ ] Webhook configuration
- [ ] Email template customization
- [ ] Dark/light theme toggle
- [ ] Language selection
- [ ] Timezone settings
- [ ] Data retention policies
- [ ] Audit log viewer
- [ ] Two-factor authentication
- [ ] API rate limit configuration

---

### 7. Model Card (AI Transparency)
**Location:** `client/src/pages/ModelCard.jsx`

#### Implemented:
- **Model Overview Card**
  - Model name: Gradient Boost XG
  - Version: v4.0.0-rc.1
  - Architecture: XGBoost Ensemble
  - Target Task: Delay Classification
  - Training Data: 1.2M Historical
  - Last Updated: 2026-03-11
  - Brain circuit icon

- **Validation Metrics Grid (4 metrics)**
  - F1 Score (0.91)
  - Precision (0.89)
  - Recall (0.94)
  - ROC AUC (0.96)

- **ROC Curve Visualization**
  - SVG-based curve rendering
  - Grid overlay
  - Diagonal reference line
  - Cyan glow effect on curve

- **Feature Importance (Top 5)**
  - Route Historical Delay Rate (86/100)
  - Carrier Reliability Score (72/100)
  - Weather Severity Index (64/100)
  - Port Congestion Level (45/100)
  - Border Crossing Efficiency (32/100)
  - Progress bars with cyan accent

- **Limitations Section**
  - Geographic bias disclosure
  - External API dependency notes
  - Force Majeure event handling

- **Graph Summary Panel**
  - Shipment count
  - Connection count
  - High-risk node count
  - Loading skeleton states
  - Network icon

#### Planned Enhancements:
- [ ] Model versioning history
- [ ] A/B test results comparison
- [ ] Bias and fairness metrics
- [ ] Explainability dashboard
- [ ] Model drift monitoring
- [ ] Retraining schedule display
- [ ] Data quality metrics
- [ ] Feature correlation matrix
- [ ] Confusion matrix visualization
- [ ] Calibration curve
- [ ] Model performance by segment

---

### 8. Network Ripple (Graph Visualization)
**Location:** `client/src/pages/NetworkRipple.jsx`

#### Planned Features:
- [ ] Interactive force-directed graph
- [ ] Node clustering by region/carrier
- [ ] Edge weight visualization
- [ ] Risk propagation animation
- [ ] Zoom and pan controls
- [ ] Node detail popup on click
- [ ] Filter by risk level
- [ ] Export graph as image
- [ ] Time-lapse replay of disruptions
- [ ] Critical path highlighting

---

## 🎨 Design System

### Color Palette
- **Primary Accent:** `#00f2ff` (Cyan)
- **Success:** `#10b981` (Green)
- **Risk/Danger:** `#f43f5e` (Red)
- **Warning:** `#eab308` (Yellow)
- **Background:** `#0a0e14` (Dark Navy)
- **Card Background:** `#16191f` (Charcoal)
- **Border:** `rgba(255,255,255,0.05)` (Subtle White)

### Typography
- **Font Family:** System UI stack (Inter-like)
- **Headings:** Bold, uppercase, italic for emphasis
- **Body:** Regular weight, 14px base
- **Monospace:** For IDs, codes, terminal logs

### Components
- **Glass Cards:** Backdrop blur with subtle borders
- **Buttons:** Rounded corners, shadow effects, hover animations
- **Badges:** Pill-shaped, color-coded by status
- **Icons:** Lucide React library
- **Animations:** Fade-in, pulse, scale transforms

---

## 🔌 API Integration

### Endpoints Used
- `GET /api/dashboard/overview` - Dashboard KPIs
- `GET /api/shipments` - Shipment list
- `GET /api/shipments/:id` - Shipment details
- `GET /api/shipments/:id/shap` - SHAP values
- `GET /api/shipments/:id/timeline` - Timeline data
- `GET /api/shipments/:id/dice` - DiCE counterfactuals
- `GET /api/shipments/:id/kimi` - Kimi recommendations
- `GET /api/chaos/presets` - Chaos scenarios
- `POST /api/chaos/inject` - Inject disruption
- `POST /api/chaos/batch-disruption` - Batch mode
- `GET /api/ports` - Port list
- `GET /api/ports/kpis` - Port metrics
- `GET /api/analytics/summary` - Analytics data
- `GET /api/analytics/graph-summary` - Graph stats
- `WS /ws/risk-updates` - Live risk updates

### Error Handling
- Graceful fallbacks for API failures
- Loading states with skeleton screens
- Empty state messages
- Retry mechanisms for failed requests

---

## 📱 Responsive Design

### Breakpoints
- **Mobile:** < 768px (single column layouts)
- **Tablet:** 768px - 1024px (2-column grids)
- **Desktop:** > 1024px (full 12-column grid)

### Mobile Optimizations
- Collapsible sidebar
- Stacked metric cards
- Horizontal scroll for tables
- Touch-friendly button sizes
- Simplified charts on small screens

---

## 🚀 Performance Optimizations

### Implemented:
- React Router lazy loading
- WebSocket connection pooling
- Debounced search inputs
- Memoized expensive calculations
- CSS-based animations (GPU accelerated)

### Planned:
- [ ] Virtual scrolling for large tables
- [ ] Image lazy loading
- [ ] Service worker for offline support
- [ ] Code splitting by route
- [ ] Bundle size optimization

---

## 🔐 Security Features

### Implemented:
- CORS configuration
- Environment variable for API keys
- No sensitive data in localStorage

### Planned:
- [ ] JWT token authentication
- [ ] Role-based access control
- [ ] Session timeout handling
- [ ] XSS protection
- [ ] CSRF token validation

---

## 📊 Data Visualization Libraries

- **Recharts:** Bar charts, line charts, area charts
- **Leaflet:** Interactive maps with markers and polylines
- **Custom SVG:** ROC curves, sparklines, progress bars
- **CSS Animations:** Pulse effects, fade-ins, transitions

---

## 🧪 Testing Strategy (Planned)

- [ ] Unit tests for utility functions
- [ ] Component tests with React Testing Library
- [ ] Integration tests for API calls
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Accessibility audits (WCAG 2.1 AA)

---

## 📦 Build & Deployment

### Development
```bash
npm run dev  # Vite dev server on port 5173
```

### Production
```bash
npm run build  # Optimized build to dist/
npm run preview  # Preview production build
```

### Environment Variables
```
VITE_API_URL=http://localhost:8000
```

---

## 🎯 Future Roadmap

### Q1 2025
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration features
- [ ] Advanced filtering and search
- [ ] Custom dashboard builder

### Q2 2025
- [ ] Multi-language support (i18n)
- [ ] White-label customization
- [ ] API rate limiting UI
- [ ] Bulk operations interface

### Q3 2025
- [ ] AI chatbot assistant
- [ ] Predictive maintenance alerts
- [ ] Integration marketplace
- [ ] Advanced reporting engine

---

## 📝 Notes

- All monetary values are in Indian Rupees (₹)
- Timestamps use 24-hour format
- Risk scores are percentages (0-100%)
- Auto-refresh intervals are configurable
- WebSocket reconnection is automatic

---

**Last Updated:** January 2025  
**Version:** 4.0.0  
**Maintainer:** Guardian Development Team
