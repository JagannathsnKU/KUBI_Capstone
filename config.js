// Configuration file for the Worldwide Credit System

const CONFIG = {
    // Plaid Configuration
    PLAID: {
        // Get your Plaid API keys from: https://dashboard.plaid.com/
        // Replace these with your actual keys from the Plaid Dashboard
        LINK_TOKEN: null, // Will be set after getting from backend
        CLIENT_NAME: 'Worldwide Credit System',
        ENV: 'sandbox', // 'sandbox' for testing, 'development' or 'production' for live
        PRODUCTS: ['auth', 'transactions', 'identity', 'liabilities'],
        COUNTRY_CODES: ['US', 'CA', 'GB'],
        LANGUAGE: 'en',
        
        // Sandbox test credentials (for testing):
        // Username: user_good | Password: pass_good (Good credit profile)
        // Username: user_custom | Password: pass_good (Customizable profile)
        // More test users: https://plaid.com/docs/sandbox/test-credentials/
    },
    
    // 3D Scene Configuration
    SCENE: {
        CAMERA: {
            FOV: 75,
            NEAR: 0.1,
            FAR: 1000,
            POSITION: { x: 0, y: 5, z: 15 }
        },
        LIGHTS: {
            AMBIENT_COLOR: 0x404040,
            AMBIENT_INTENSITY: 0.8,
            POINT_COLOR: 0xffffff,
            POINT_INTENSITY: 1.5,
            POINT_POSITION: { x: 10, y: 10, z: 10 }
        }
    },
    
    // Star/Constellation Configuration
    CONSTELLATION: {
        CENTRAL_STAR: {
            SIZE: 2,
            COLOR: 0x64b5f6, // Blue
            STABLE_COLOR: 0x81c784, // Green
            UNSTABLE_COLOR: 0xff6b6b, // Red
            HIGH_UTIL_COLOR: 0xff4444, // Red Giant
            LOW_INCOME_COLOR: 0x4444ff  // Blue Dwarf
        },
        SATELLITE_STARS: {
            COUNT: 5,
            SIZE: 0.5,
            ORBIT_RADIUS: 8,
            COLOR: 0xe1bee7 // Purple
        },
        NEBULA: {
            PARTICLE_COUNT: 1000,
            COLOR: 0x9c27b0,
            SIZE: 0.1,
            RANGE: 30
        }
    },
    
    // Physics Configuration (Rapier.js)
    PHYSICS: {
        GRAVITY: { x: 0, y: 0, z: 0 }, // Zero gravity in space
        UNSTABLE_FORCE: 5.0,
        SHAKE_DURATION: 2000, // milliseconds
        STABILIZATION_DAMPING: 0.9
    },
    
    // Credit Analysis Thresholds
    ANALYSIS: {
        INCOME: {
            LOW_THRESHOLD: 1000,
            MEDIUM_THRESHOLD: 3000,
            HIGH_THRESHOLD: 5000
        },
        UTILIZATION: {
            HEALTHY: 0.3,
            WARNING: 0.5,
            DANGER: 0.8
        },
        BALANCE: {
            LOW_THRESHOLD: 100,
            MEDIUM_THRESHOLD: 1000,
            HIGH_THRESHOLD: 5000
        },
        TRANSACTION_COUNT: {
            LOW: 5,
            MEDIUM: 20,
            HIGH: 50
        }
    },
    
    // Quest System
    QUESTS: {
        FIRST_QUEST: {
            id: 'connect_bank',
            title: 'Exploration Mission: Chart Your Star System',
            description: 'Connect your bank account to begin mapping your financial constellation.',
            rewards: {
                stars: 1,
                unlocks: ['stability_meter']
            }
        }
    },
    
    // UI Update Intervals (milliseconds)
    UPDATE_INTERVALS: {
        STATUS_REFRESH: 1000,
        PHYSICS_UPDATE: 16, // ~60fps
        CONSTELLATION_ROTATION: 0.001
    }
};

// Export configuration (for use in other files)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
