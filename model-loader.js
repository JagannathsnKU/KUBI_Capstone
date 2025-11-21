// 3D Model Loader for Sketchfab Models
// Loads GLTF/GLB files from Sketchfab

class ModelLoader {
    constructor(scene) {
        this.scene = scene;
        this.loadedModels = new Map();

        // Prefer the ES-module-provided GLTFLoader attached to window by the bootstrap module.
        // Fallback: check if THREE.GLTFLoader (legacy) exists.
        const GLTFConstructor = window.GLTFLoader || (typeof THREE !== 'undefined' && THREE.GLTFLoader);
        if (GLTFConstructor) {
            try {
                this.loader = new GLTFConstructor();
                console.log('✅ GLTFLoader initialized');
            } catch (e) {
                console.warn('⚠️ Failed to instantiate GLTFLoader:', e);
                this.loader = null;
            }
        } else {
            console.warn('⚠️ GLTFLoader not found. Model loading disabled.');
            this.loader = null;
        }
    }
    
    /**
     * Load GLTFLoader if not available
     */
    // Note: GLTFLoader should be provided by the ES module bootstrap in `index.html`.
    // The dynamic script loader was removed to avoid CDN/mime issues.
    
    /**
     * Load a GLTF/GLB model from file
     * @param {string} modelPath - Path to .glb or .gltf file
     * @param {object} options - Position, scale, rotation options
     */
    async loadModel(modelPath, options = {}) {
        const {
            position = { x: 0, y: 1, z: 0 },
            scale = 1,
            rotation = { x: 0, y: 0, z: 0 },
            name = 'model'
        } = options;
        
        return new Promise((resolve, reject) => {
            if (!this.loader) {
                reject(new Error('GLTFLoader not initialized yet'));
                return;
            }
            
            console.log(`📦 Loading model: ${modelPath}...`);
            
            this.loader.load(
                modelPath,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Set position
                    model.position.set(position.x, position.y, position.z);
                    
                    // Set scale
                    if (typeof scale === 'number') {
                        model.scale.set(scale, scale, scale);
                    } else {
                        model.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
                    }
                    
                    // Set rotation
                    model.rotation.set(rotation.x, rotation.y, rotation.z);
                    
                    // Attach raw gltf and animations to the scene object for later use
                    try {
                        model.userData.gltf = gltf;
                        model.userData.animations = gltf.animations || [];
                    } catch (e) {
                        // ignore
                    }

                    // Store reference
                    model.userData.name = name;
                    this.loadedModels.set(name, model);

                    // Add to scene
                    this.scene.add(model);
                    
                    console.log(`✅ Model loaded: ${modelPath}`);
                    console.log(`   Position: (${position.x}, ${position.y}, ${position.z})`);
                    console.log(`   Scale: ${scale}`);
                    
                    resolve(model);
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = (progress.loaded / progress.total) * 100;
                        console.log(`   Loading... ${percent.toFixed(0)}%`);
                    }
                },
                (error) => {
                    console.error(`❌ Error loading model: ${modelPath}`, error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Load multiple models at once
     */
    async loadModels(modelConfigs) {
        const promises = modelConfigs.map(config => 
            this.loadModel(config.path, config.options)
        );
        return Promise.all(promises);
    }
    
    /**
     * Remove a loaded model
     */
    removeModel(name) {
        const model = this.loadedModels.get(name);
        if (model) {
            this.scene.remove(model);
            this.loadedModels.delete(name);
            console.log(`🗑️ Removed model: ${name}`);
        }
    }
    
    /**
     * Get a loaded model by name
     */
    getModel(name) {
        return this.loadedModels.get(name);
    }
    
    /**
     * List all loaded models
     */
    listModels() {
        console.log('📋 Loaded models:', Array.from(this.loadedModels.keys()));
        return Array.from(this.loadedModels.keys());
    }
}

// Expose ModelLoader globally for app scripts
window.ModelLoader = ModelLoader;

// Example usage:
/*
const loader = new ModelLoader(scene);

// Load a single model
await loader.loadModel('models/castle.glb', {
    position: { x: 10, y: 0, z: 10 },
    scale: 2,
    rotation: { x: 0, y: Math.PI / 4, z: 0 },
    name: 'castle1'
});

// Load multiple models
await loader.loadModels([
    {
        path: 'models/tree.glb',
        options: { position: { x: 5, y: 0, z: 5 }, scale: 1.5, name: 'tree1' }
    },
    {
        path: 'models/house.glb',
        options: { position: { x: -5, y: 0, z: -5 }, scale: 2, name: 'house1' }
    }
]);
*/
