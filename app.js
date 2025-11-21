// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    console.log("Chimera Core: DOM Loaded. Initializing application...");

    // --- 3D WORLD INITIALIZATION ---
    const canvas = document.getElementById('island-canvas');
    if (!canvas) {
        console.error("Fatal Error: Canvas element not found!");
        return;
    }

    try {
        // Basic Three.js setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // CRITICAL: Set output encoding for proper color display
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;

        // Instantiate and initialize the main game/simulation class
        const treeWorld = new TreeWorld(scene, camera, renderer);
        // treeWorld is now the main 3D world instance
        window.treeWorld = treeWorld;
        
        // NFT buttons removed - functionality moved to quest system
        
        // Remove legacy tycoon simulation code

        // Hide the loading screen once the world is ready
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                // Remove from DOM after transition
                loadingScreen.addEventListener('transitionend', () => loadingScreen.remove());
            }, 500); // Give a slight delay for effect
        }
    } catch (error) {
        console.error("An error occurred during 3D world initialization:", error);
        // Optionally, show an error message to the user on the page
    }
});

// --- MODE SWITCHING LOGIC ---

let isProfessionalMode = false;

function switchToProfessionalMode() {
    isProfessionalMode = !isProfessionalMode; // Toggle the mode

    // Get all the elements that need to change
    const header = document.querySelector('.app-header h1');
    const subtitle = document.querySelector('.app-header .subtitle');
    const modeButton = document.querySelector('.btn-mode-switch');
    const statusTitle = document.querySelector('#ui-overlay h4');
    const portfolioTitle = document.querySelector('#ui-overlay h4:nth-of-type(2)');
    const controlsTitle = document.querySelector('.app-header h1');
    const goalsTitle = document.querySelector('#quest-panel h3');
    const kCredsLabel = document.querySelector('span[style*="K-Creds"]');

    if (isProfessionalMode) {
        // --- SWITCH TO PROFESSIONAL MODE ---
        header.innerText = '//:Financial Dashboard';
        subtitle.innerText = 'A simulation of your real-world financial health.';
        modeButton.innerHTML = '🎮 Gamified Mode';
        statusTitle.innerText = '//:Financial Status';
        portfolioTitle.innerText = '//:Investment Portfolio:';
        goalsTitle.innerText = '//:Financial Goals';
        kCredsLabel.innerText = '$: Net Worth:';

        // You could also hide/show elements here
        // e.g., document.getElementById('crosshair').style.display = 'none';

    } else {
        // --- SWITCH BACK TO GAMIFIED MODE ---
        header.innerText = '//:Project Chimera';
        subtitle.innerText = 'Your Financial Digital Twin.';
        modeButton.innerHTML = '📊 Financial Simulation Mode';
        statusTitle.innerText = '//:Chimera Status';
        // The portfolio title is already correct from our last change
        goalsTitle.innerText = '//:Financial Goals'; // This was already changed, but good to be explicit
        kCredsLabel.innerText = '$: K-Creds:';

        // e.g., document.getElementById('crosshair').style.display = 'block';
    }
}

function toggleQuestPanel() {
    const questPanel = document.getElementById('quest-panel');
    questPanel.classList.toggle('collapsed');
}

// Note: Other functions from the original app.js would also be here.