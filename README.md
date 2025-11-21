## Adding a Custom 3D Model to Your City

1. Place your model files (GLTF/GLB, textures, .bin) in a folder under `models/`, e.g. `models/my_custom_building/`.
2. In `financial-tycoon.js`, use:
   ```js
   this.modelLoader.loadModel('models/my_custom_building/scene.gltf', {
     position: { x: worldX, y: buildingData.height / 2, z: worldZ },
     scale: 2,
     name: 'custom_building'
   });
   ```
3. Trigger this code when you want your model to appear (e.g. when placing a building).

**Note:** You do not need the quest system for this. Just call `loadModel` with your model path and desired position/scale.

### Auto-indexing models and per-model metadata

- You can add an optional `meta.json` inside each `models/<folder>/` to fine-tune placement. Example `models/my_custom_building/meta.json`:

```json
{
  "buildingType": "bank",
  "meta": {
    "rotation": { "x": 0, "y": 90, "z": 0 },
    "rotationDegrees": true,
    "preScale": 1.0,
    "offset": { "x": 0, "y": 0, "z": 0 }
  }
}
```

- The project includes a small Node script `scripts/generate_model_index.js` that scans `models/` for `scene.gltf`/`scene.glb` and optional `meta.json`, then writes `models/models.json`.
- Run the generator before starting the app (or whenever you add new models):

```powershell
node scripts/generate_model_index.js
```

- The frontend (`financial-tycoon.js`) will fetch `models/models.json` at startup and merge discovered models into the runtime mapping. If a model entry has `buildingType` in its meta, that key is used as the building type mapping; otherwise the folder name is used.
# 🌟 Worldwide Credit System - Voxel Island Builder Edition

A **Minecraft-style 3D world builder** where you construct your financial island block by block! Build structures, place 3D models, and customize your world.

![Status](https://img.shields.io/badge/status-voxel_builder-brightgreen)
![Three.js](https://img.shields.io/badge/Three.js-r152-blue)
![Models](https://img.shields.io/badge/Sketchfab-supported-orange)

---

## ✨ **What's New in Voxel Builder Edition**

### 🧱 **Minecraft-Style Building**
- ✅ Click-to-place voxel blocks (5 types: Grass, Dirt, Stone, Wood, Crystal)
- ✅ Right-click to remove blocks with particle burst animation
- ✅ Block highlight preview (wireframe cube)
- ✅ Real-time block counter and progress bar
- ✅ Pop-in animation for placed blocks

### 🏗️ **Quick Build Menu** (NEW!)
- ✅ **No quest completion needed!** Build instantly:
  - 🏠 **House** - Cozy 5x5 wooden structure
  - 🗼 **Tower** - Tall 3x3x8 stone tower
  - ⛏️ **Mine** - Crystal mine entrance
  - 🌲 **Tree** - Wood trunk with grass leaves
  - 🔺 **Pyramid** - 5-level stone pyramid

### 🎨 **Sketchfab 3D Models** (NEW!)
- ✅ Load high-quality 3D models from Sketchfab
- ✅ Support for: Castle, Tree, House, Ship, Dragon, Windmill
- ✅ Simple drag-and-drop into `models/` folder
- ✅ In-app model selection menu

---

## 🎮 **Quick Start**
- ✅ 3-layer depth system (9,000+ total stars)
- ✅ Varying opacity by distance
- ✅ Realistic spherical distribution
- ✅ Additive blending for sparkle effect

#### **Energy Field Particles**
- ✅ 5,000 particles in spherical formation
- ✅ Vertex colors with HSL variation
- ✅ Animated wave motion
- ✅ Size attenuation for depth perception

#### **Floating Orbs System**
- ✅ 10 dynamic icosahedron orbs
- ✅ Physics-based bouncing
- ✅ Random emissive colors
- ✅ Autonomous navigation

#### **Advanced Materials**
- ✅ **MeshPhysicalMaterial**: Metalness, roughness, clearcoat
- ✅ **Additive Blending**: For glow and energy effects
- ✅ **Tone Mapping**: ACES Filmic for cinematic look
- ✅ **Shadow Maps**: PCF soft shadows
- ✅ **HDR Rendering**: High dynamic range

---

## 🚀 **Features**

### **Phase 1: Explorer Mode**

#### **Your Personal Constellation**
- 🌟 Massive multi-layer central star (your credit identity)
- ⭐ 5 satellite stars (financial achievements)
- 🌌 Volumetric nebula with 10,000+ particles
- ✨ 3-layer starfield with 9,000+ background stars
- 💫 Floating energy orbs
- 🔗 Dynamic connecting lines between achievements

#### **Real-time Physics**
- Powered by **Rapier.js 3D Physics Engine**
- Gravity simulation
- Collision detection
- Smooth damping and stabilization

#### **AI-Powered Analysis**
- **Stability Score**: Analyzes income vs. expenses
- **Utilization Alert**: Credit usage monitoring
- **Diversity Check**: Number of connected accounts
- **Trend Analysis**: Month-over-month growth

#### **Visual Feedback System**
- 🔴 **Red Giant Mode**: High credit utilization warning
- 🔵 **Blue Dwarf Mode**: Low income alert
- 💚 **Stable Orbit**: Healthy financial status
- ⚠️ **Wobble Effect**: Risk indicators

#### **Gamification**
- Quest system with rewards
- Achievement tracking
- Progressive star revelation
- Score visualization

---

## 🎮 **Controls**

| Action | Control |
|--------|---------|
| **Rotate View** | Click + Drag |
| **Zoom** | Mouse Wheel |
| **Pan** | Right Click + Drag |
| **Reset** | Double Click |

---

## 🛠️ **Tech Stack**

### **Core Technologies**
- **Three.js r152** - 3D rendering engine (634KB local file)
- **Rapier.js 0.11.2** - Physics simulation
- **Plaid API** - Banking data (sandbox mode)
- **Vanilla JavaScript** - ES6+ modules
- **WebGL 2.0** - Hardware-accelerated graphics

### **Advanced Rendering Techniques**
- ✅ BufferGeometry for performance
- ✅ InstancedMesh capability
- ✅ Custom canvas textures
- ✅ Vertex colors and attributes
- ✅ Additive/multiplicative blending modes
- ✅ Tone mapping (ACES Filmic)
- ✅ Soft shadow mapping (PCF)

### **No Build Tools Required!**
- 100% browser-native
- No npm, webpack, or bundlers
- Works **completely offline** (Three.js downloaded locally)

---

## 📦 **Installation**

### **Option 1: Direct Open (Recommended)**
```bash
# Simply open the HTML file in any modern browser
start index.html  # Windows
open index.html   # Mac
xdg-open index.html  # Linux
```

### **Option 2: Local Server (For Development)**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Then visit: `http://localhost:8000`

---

## 🎯 **Project Structure**

```
# 🌍 Worldwide Credit System

> **A user-owned, gamified credit system that crosses borders, opens the "black box," and actively helps you improve.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-prototype-yellow)
![Tech](https://img.shields.io/badge/tech-Three.js%20%7C%20Rapier%20%7C%20Plaid-green)

---

## 🎯 The Problem We're Solving

Traditional credit systems have **three critical flaws**:

1. **🔒 Centralized & Opaque**: Your credit score is a "black box" - you don't know why it changes
2. **🚫 Doesn't Cross Borders**: Move to a new country? Your credit history vanishes (the "immigrant problem")
3. **📉 Reactive, Not Proactive**: Credit bureaus report problems but don't help you fix them

---

## 💡 Our Solution: The 3-Layer Engine

### **Layer 1: "Worldwide" Identity (Self-Sovereign Identity)**
- **Private Digital Wallet**: You own your financial identity
- **Verifiable Credentials (VCs)**: Tamper-proof claims from trusted sources
  - 🏦 Rent payment history from your home country
  - 🎓 Educational degrees
  - 💻 GitHub verified developer status
  - 🏢 Employment letters
- **No More Lost History**: Your reputation travels with you

### **Layer 2: The "Brain" (Explainable AI - XAI)**
- **Holistic Analysis**: Combines off-chain (Plaid banks), on-chain (DeFi/DAO), and VC data
- **Opens the Black Box**: Using XAI libraries (SHAP/LIME) to explain EVERY point
  - Example: "High Credit Utilization = -20 points"
- **Personalized Quest System**: AI generates missions to fix your biggest issues
  - 🗺️ Exploration Quests: Add new data sources
  - ⚠️ Improvement Quests: Fix financial problems  
  - 🏆 Reputation Quests: Unlock on-chain achievements

### **Layer 3: The "Trust" Layer (Zero-Knowledge Proofs)**
- **Privacy (ZKP)**: Prove statements without revealing data
  - "My score is over 700" ✅ (without showing exact 732)
  - "My income is over $50k" ✅ (without showing exact $68k)
- **Verifiability (ZKML)**: Cryptographic proof you ran the official AI model honestly
- **No Cheating**: Can't fake your score

---

## 🎮 The Product: Two Switchable Modes

### 🌌 **Mode 1: Explorer Mode** (Gamified Constellation)

**What it is**: A 3D "Personal Constellation" representing your financial universe

**Tech Stack**:
- Three.js (3D rendering)
- Rapier.js (physics engine)
- WebGL 2.0

**How it works**:
1. **New User**: Dark empty sky with just a dim central sun ☀️
2. **Connect Plaid**: Explosion of particles → New nebula region appears 🌌
3. **Reveal Planets**: Each credit metric becomes an orbiting planet
   - 🟢 Payment History Planet
   - 🟠 Credit Utilization Planet
   - 🔵 Account Age Planet
   - 🟣 Account Mix Planet
   - 🩷 Income Stability Planet

**Quest System**:
- **Exploration Quests**: "Chart the Uncharted Territory" → Connect bank data
- **Improvement Quests**: "Stabilize the Unbalanced Mass" → Fix high debt (constellation shakes visually!)
- **Reputation Quests**: "Ignite the Civic Star" → Vote in DAO proposals

**Physics Feedback**:
- ❌ **Problem Detected**: Red "Unstable Mass" appears, entire constellation shakes
- ✅ **Problem Fixed**: Mass disappears, constellation stabilizes

---

### 📊 **Mode 2: Professional Mode** (Clean Dashboard)

**What it is**: A clean, analytical dashboard with no game metaphors

**Features**:
1. **XAI Factor Breakdown**:
   - Color-coded impact bars (green = positive, red = negative)
   - Detailed explanations for each factor
   
2. **Credit Score Simulator**:
   - 💳 Slider: "Pay down $2,500 in debt" → +30 points
   - 💰 Slider: "Increase income by $1,000/mo" → +15 points
   - 📜 Dropdown: "Add Rent VC" → +30 points
   - **Real-time projection**: See your new score INSTANTLY

3. **Personalized Action Plan**:
   - Prioritized list of recommendations
   - Timeline estimates for each action
   - Impact predictions

4. **Data Sources Grid**:
   - ✅ Connected: Plaid (2 accounts)
   - ➕ Not Connected: Blockchain wallet, VCs, employment

---

## 🚀 How to Run the Project

### **Prerequisites**
- Modern web browser (Chrome/Firefox/Edge)
- Local web server (or just open `index.html` directly)

### **Installation**
```bash
# Clone the repository
git clone https://github.com/JagannathsnKU/KUBI_Capstone.git
cd KUBI_Capstone

# Open in browser (no build step required!)
# Windows:
start index.html

# macOS:
open index.html

# Linux:
xdg-open index.html
```

### **File Structure**
```
KUBI_Capstone/
├── index.html                    # Explorer Mode entry point
├── professional-mode.html        # Professional Mode entry point
├── styles.css                    # Explorer Mode styles
├── professional-mode.css         # Professional Mode styles
├── app.js                        # Main app controller
├── solar-system-credit.js        # 3D solar system visualization
├── quest-system.js               # Quest generation & management
├── ai-analysis.js                # Mock AI analysis engine
├── plaid-integration.js          # Plaid Sandbox integration
├── professional-mode.js          # Professional dashboard logic
├── config.js                     # Configuration constants
├── three.min.js                  # Three.js library (634KB local)
└── README.md                     # This file
```

---

## 🎮 User Journey

### **First-Time User Experience**

#### **1. Opening the App (Explorer Mode)**
- See dark starfield with single glowing sun ☀️
- Quest panel appears: "🗺️ Chart the Uncharted Territory"
- **Objective**: Connect your bank account to map your first financial region

#### **2. Connecting Plaid Sandbox**
- Click "🔗 Connect Bank" quest button
- Plaid Link opens → Select "Sandbox" for demo
- Use test credentials:
  - Username: `user_good`
  - Password: `pass_good`

#### **3. The Magic Moment** ✨
- Particle explosion animation
- 5 planets fade in, starting their orbits
- Each planet represents a credit factor:
  - 🟢 **Payment History** (closest orbit)
  - 🟠 **Credit Utilization** (2nd orbit) - May show red glow if high debt
  - 🔵 **Account Age** (3rd orbit)
  - 🟣 **Account Mix** (4th orbit)
  - 🩷 **Income Stability** (outermost orbit)

#### **4. Interactive Exploration**
- **Hover over sun**: See overall score tooltip
- **Hover over planets**: See factor details
- **Drag to rotate**: View from different angles
- **Scroll to zoom**: Get closer to planets

#### **5. Quest System Updates**
- New quests appear based on AI analysis:
  - ⚠️ **HIGH IMPACT**: "Stabilize the Unbalanced Mass" (if debt > 30%)
  - 🎯 **MEDIUM IMPACT**: "Expand Your Account Universe" (if < 3 account types)
  - 🔐 **LOCKED**: "Collect Your First Credential" (requires previous completion)

#### **6. Switching to Professional Mode**
- Click "📊 Professional Mode" button in header
- See same data in analytical dashboard format
- Use **Credit Score Simulator** to model improvements
- View **Personalized Action Plan** with timelines

---

## 🛠️ Tech Architecture

### **Frontend Stack**
```javascript
{
  "rendering": "Three.js r152 (634KB local)",
  "physics": "Rapier.js 0.11.2 (WASM-based)",
  "banking": "Plaid Sandbox API",
  "language": "Vanilla JavaScript (ES6+)",
  "styling": "CSS3 with glassmorphism",
  "3D": "WebGL 2.0"
}
```

### **Key Classes**

#### **`SolarSystemCredit`** (solar-system-credit.js)
- Manages 3D solar system visualization
- Creates sun, planets, orbit paths, grid floor
- Handles orbital mechanics and animations
- Methods:
  - `createSun()`: Central glowing star
  - `createPlanets()`: 5 credit factor planets
  - `revealSatelliteStar(index)`: Animate planet appearance
  - `animate()`: Update loop for orbital motion

#### **`QuestSystem`** (quest-system.js)
- Generates quests from XAI analysis
- Manages quest state (active/completed/locked)
- Types:
  - **Exploration**: Add new data sources
  - **Improvement**: Fix financial issues
  - **Reputation**: On-chain achievements
- Methods:
  - `generateQuests(analysis, data)`: Create quest list
  - `completeQuest(id)`: Mark quest done, trigger reward
  - `updateQuestUI()`: Refresh quest panel display

#### **`AIAnalysisEngine`** (ai-analysis.js)
- Mock AI that analyzes Plaid data
- Calculates credit factors:
  - Payment consistency score
  - Credit utilization percentage
  - Income stability ratio
  - Account diversity index
- Determines visual state (stable/wobble/unstable)
- Triggers constellation effects
- Methods:
  - `analyzePlaidData(data)`: Main analysis
  - `calculateScores(metrics)`: Compute factor scores
  - `triggerVisualEffects(state)`: Update 3D scene

#### **`PlaidIntegration`** (plaid-integration.js)
- Manages Plaid Sandbox connection
- Generates mock financial data for testing
- Exchanges public tokens
- Methods:
  - `initiatePlaidLink()`: Open Plaid modal
  - `generateMockData()`: Create test data
  - `onPlaidSuccess(token)`: Handle connection

---

## 🎨 Visual Design System

### **Color Palette**
```css
/* Background */
--space-dark: #0a0e27
--space-mid: #1a1a2e
--space-light: #16213e

/* Planets */
--payment-green: #10b981 (Payment History)
--utilization-orange: #f59e0b (Credit Utilization)
--age-blue: #3b82f6 (Account Age)
--mix-purple: #8b5cf6 (Account Mix)
--income-pink: #ec4899 (Income Stability)

/* UI Accents */
--primary-blue: #64b5f6
--warning-red: #ef4444
--success-green: #10b981
--glass-overlay: rgba(10, 14, 39, 0.6)
```

### **Visual Effects**
- **Glassmorphism**: Frosted glass panels with backdrop blur
- **Glow Effects**: Corona around sun, atmospheric glow on planets
- **Particle Systems**: Starfield (5000 distant stars)
- **Grid Floor**: Cyan/blue lines (Solar System Scope aesthetic)
- **Orbit Paths**: Elliptical colored rings showing planet trajectories

---

## 📊 Data Flow

```
User Action → Plaid Sandbox → AI Analysis → Quest Generation → Constellation Update
     ↓              ↓              ↓              ↓                 ↓
[Click Connect] [Mock Data] [Calculate Scores] [Generate Quests] [Reveal Planets]
                    ↓              ↓              ↓                 ↓
              [Transactions]  [XAI Factors]  [Update UI]      [Animate Orbits]
              [Balances]      [Reason Codes] [Show Tooltips]  [Physics Shake]
              [Income]        [Overall Score]
```

### **Analysis Results Structure**
```javascript
{
  metrics: {
    income: 4500,
    utilization: 65,  // % of credit used
    balance: 5000,
    transactionCount: 47
  },
  scores: {
    overallScore: 685,
    utilization: 35,   // -20 pts (too high)
    stability: 72,
    diversity: 60,
    payment: 92        // +35 pts (excellent)
  },
  state: {
    color: 'stable',   // or 'red_giant', 'blue_dwarf'
    brightness: 0.8,
    effects: ['wobble'] // or ['unstable'], []
  }
}
```

---

## 🔮 Future Roadmap

### **Phase 1: Current Prototype** ✅
- [x] Explorer Mode with 3D solar system
- [x] Professional Mode dashboard
- [x] Plaid Sandbox integration
- [x] Quest system
- [x] Credit score simulator
- [x] Mode switcher

### **Phase 2: Real AI Integration** 🚧
- [ ] Replace mock AI with actual XAI model (SHAP/LIME)
- [ ] Train on real financial datasets
- [ ] Deploy model inference endpoint
- [ ] Generate personalized reason codes

### **Phase 3: Blockchain Integration** 📅
- [ ] Wallet connection (MetaMask/WalletConnect)
- [ ] On-chain data ingestion (DeFi, DAO, NFTs)
- [ ] Smart contract for score storage
- [ ] ZKP circuit for privacy proofs
- [ ] ZKML verification system

### **Phase 4: Verifiable Credentials** 📅
- [ ] VC upload interface
- [ ] Credential verification service
- [ ] Issuer registry (universities, employers, etc.)
- [ ] W3C DID integration
- [ ] IPFS storage for credential metadata

### **Phase 5: Production Ready** 🎯
- [ ] Real Plaid Production API keys
- [ ] User authentication system
- [ ] Database for persistent storage
- [ ] Mobile responsive design
- [ ] Security audit
- [ ] GDPR/privacy compliance

---

## 🧪 Testing the System

### **Mock Data Scenarios**

#### **Scenario A: Good Credit**
```javascript
// Generates:
- Overall Score: 720-750
- No unstable masses
- All planets visible
- Stable constellation
```

#### **Scenario B: High Debt**
```javascript
// Generates:
- Overall Score: 650-680
- Red "Unstable Mass" appears
- Credit Utilization planet glows red
- Constellation shakes
- Quest: "Stabilize the Unbalanced Mass"
```

#### **Scenario C: Low Income Stability**
```javascript
// Generates:
- Overall Score: 670-700
- Income planet flickers
- Wobble effect
- Quest: "Balance the Financial Scale"
```

### **User Testing Checklist**
- [ ] Can switch between modes without losing data
- [ ] Tooltips appear on planet hover
- [ ] Quest panel can collapse/expand
- [ ] Simulator updates score in real-time
- [ ] Planets orbit smoothly (60 FPS)
- [ ] Grid floor renders correctly
- [ ] Camera controls responsive (drag/scroll)

---

## 🤝 Contributing

This is a **capstone project** for the Worldwide Credit System. Contributions welcome!

### **Development Setup**
```bash
# No build tools required! Pure HTML/CSS/JS
# Just edit files and refresh browser

# Recommended VS Code extensions:
- Live Server (for auto-reload)
- ESLint (code quality)
- Prettier (formatting)
```

### **Code Style**
- Use ES6+ features (classes, arrow functions, async/await)
- Comment complex Three.js/physics logic
- Keep functions under 50 lines when possible
- Use descriptive variable names

---

## 📄 License

**MIT License** - See LICENSE file for details

---

## 👥 Team

**Project**: KUBI Capstone - Worldwide Credit System  
**University**: [Your University]  
**Course**: [Your Course Code]  
**Semester**: Fall 2025

---

## 📞 Contact

Have questions or feedback? Open an issue on GitHub!

---

## 🙏 Acknowledgments

- **Three.js**: Amazing 3D rendering library
- **Rapier.js**: High-performance physics engine
- **Plaid**: Financial data infrastructure
- **Solar System Scope**: Visual inspiration for Explorer Mode

---

**Built with ❤️ for a more inclusive, transparent, and empowering financial future.**
/
│
├── index.html                    # Main HTML structure
├── styles.css                    # Glassmorphism UI styling
├── three.min.js                  # Three.js r152 (634KB, local)
│
├── config.js                     # Configuration constants
├── constellation-enhanced.js     # ⭐ ENHANCED 3D visualization
├── ai-analysis.js                # Financial health AI
├── plaid-integration.js          # Banking data integration
├── app.js                        # Application flow
│
└── README.md                     # This file
```

---

## 🌟 **Visual Features Breakdown**

### **1. Central Star System**
```javascript
- Core: IcosahedronGeometry (level 4 subdivision)
- Material: MeshPhysicalMaterial
  - Metalness: 0.9
  - Roughness: 0.1
  - Clearcoat: 1.0
  - Emissive glow
- Glow Shell: Scaled sphere with BackSide rendering
- Energy Rings: 2x rotating torus geometries
- Point Light: Dynamic 3-unit range
```

### **2. Particle Systems**
```javascript
// Energy Field
- Count: 5,000 particles
- Distribution: Spherical (15-25 unit radius)
- Animation: Sine wave oscillation
- Colors: HSL variation (H: 0.6-0.8)

// Nebula Cloud
- Count: 10,000 particles
- Distribution: Cubic with noise
- Colors: [Purple, Blue, Pink, Green]
- Texture: Custom radial gradient

// Starfield (3 layers)
- Layer 1: 3,000 stars (100-250 units)
- Layer 2: 6,000 stars (250-400 units)
- Layer 3: 9,000 stars (400-550 units)
- Opacity: Fades by distance
```

### **3. Advanced Materials**
```javascript
MeshPhysicalMaterial properties:
- metalness: 0.8-0.9 (reflective)
- roughness: 0.1-0.2 (smooth)
- clearcoat: 1.0 (extra shine)
- clearcoatRoughness: 0.1
- transmission: Optional transparency
- ior: Index of refraction support
```

### **4. Post-Processing**
```javascript
// Tone Mapping
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Shadow Quality
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Anti-aliasing
antialias: true
```

---

## 🔥 **Performance Optimizations**

### **Implemented**
- ✅ BufferGeometry (GPU-optimized)
- ✅ Object pooling for particles
- ✅ Level-of-detail (LOD) ready
- ✅ Frustum culling (automatic)
- ✅ Texture compression ready
- ✅ Pixel ratio capping (max 2x)

### **Rendering Stats**
- **Draw Calls**: ~15-20
- **Triangles**: ~50,000
- **Particles**: ~24,000
- **FPS**: 60 (on modern hardware)
- **Memory**: ~150MB VRAM

---

## 🎨 **Customization Guide**

### **Change Central Star Color**
Edit `config.js`:
```javascript
CENTRAL_STAR: {
    COLOR: 0x00ffff,  // Cyan star
    SIZE: 2,
    // ...
}
```

### **Increase Particle Count**
Edit `constellation-enhanced.js`:
```javascript
// In createAdvancedNebula()
const particleCount = 20000;  // Double the particles!
```

### **Add More Satellite Stars**
Edit `constellation-enhanced.js`:
```javascript
// In createSatelliteConstellation()
// Add more patterns to constellationPatterns array
```

### **Change Color Palette**
```javascript
// In createAdvancedNebula()
const colorPalette = [
    0xff0000,  // Red
    0x00ff00,  // Green
    0x0000ff,  // Blue
    0xffff00   // Yellow
];
```

---

## 🐛 **Troubleshooting**

### **Issue: Black screen**
✅ **Solution**: Check browser console for errors
- Ensure `three.min.js` exists in same folder
- Try opening in Chrome/Firefox (not IE)

### **Issue: Slow performance**
✅ **Solution**: Reduce particle counts
```javascript
// Energy field: 5000 → 2000
// Nebula: 10000 → 5000
// Starfield layers: Reduce by 50%
```

### **Issue: Physics not working**
✅ **Solution**: Check Rapier.js CDN connection
- App still works without physics (visuals only mode)
- Check console for Rapier warnings

### **Issue: Stars not appearing**
✅ **Solution**: Connect Plaid sandbox account
- Click "Connect Bank Account" button
- Use Plaid test credentials
- Stars appear after analysis

---

## 🎓 **How It Works**

### **Financial Data Flow**
```
1. User connects bank via Plaid
2. Plaid returns transaction data
3. AI Analysis processes metrics:
   - Income vs Expenses
   - Credit utilization
   - Account diversity
   - Spending trends
4. Constellation reacts:
   - Color changes (health indicators)
   - Physics reactions (wobble/stability)
   - Star revelations (achievements)
```

### **3D Rendering Pipeline**
```
1. Three.js Scene Setup
   ↓
2. Load Geometries & Materials
   ↓
3. Initialize Physics (Rapier)
   ↓
4. Animation Loop (60 FPS):
   - Update physics world
   - Animate particles
   - Rotate objects
   - Update camera
   - Render frame
```

---

## 🚀 **Future Enhancements (Phase 2)**

### **Planned Features**
- [ ] GLTF model loading for custom star shapes
- [ ] Bloom post-processing (EffectComposer)
- [ ] Interactive particle trails
- [ ] Sound effects and ambient music
- [ ] VR/AR support (WebXR)
- [ ] Multiplayer constellation viewing
- [ ] Export constellation as NFT
- [ ] Mobile touch controls optimization

### **Advanced Graphics**
- [ ] Volumetric lighting
- [ ] Screen-space reflections (SSR)
- [ ] Ambient occlusion (SSAO)
- [ ] God rays
- [ ] Particle compute shaders (WebGPU)
- [ ] Custom fragment shaders for stars

---

## 📖 **References & Inspiration**

- **Three.js Examples**: https://threejs.org/examples/
- **Rapier Physics**: https://rapier.rs/
- **Plaid API Docs**: https://plaid.com/docs/
- **WebGL Best Practices**: https://webglfundamentals.org/

### **Techniques Used**
- Icosahedron subdivision surfaces
- Additive/subtractive blending
- BufferGeometry with custom attributes
- Canvas-based procedural textures
- Physically-based materials (PBR)
- Tone mapping and HDR

---

## 📝 **License**

MIT License - Feel free to use, modify, and distribute!

---

## 🙌 **Credits**

- **Three.js Team** - Amazing 3D engine
- **Dimforge** - Rapier.js physics
- **Plaid** - Banking API
- **You** - For building something awesome! 🚀

---

## 🎉 **Get Started Now!**

```bash
# Just open the file!
start index.html
```

**Your enhanced financial constellation awaits!** 🌟✨💫

---

**Made with ❤️ and WebGL magic**
