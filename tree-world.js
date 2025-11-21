// Tree World - Orange Tree Scene with Controls

class TreeWorld {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.clock = new THREE.Clock();
        
        // NFT Achievement Balls
        this.nftBalls = [];
        this.tree = null;
        this.treeBounds = null;
        
        // Leaderboard-based customization
        this.userRank = null;
        this.userStats = null;
        this.previousRank = null;
        this.customization = {
            theme: 'default',
            particles: [],
            decorations: [],
            specialEffects: [],
            lights: []
        };
        this.celebrationActive = false;
        
        this.init();
    }

    async init() {
        // Brighter lighting to show natural colors
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.5)); // Brighter ambient
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0); // Much brighter
        dirLight.position.set(20, 40, 20);
        this.scene.add(dirLight);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.0); // Fill light
        fillLight.position.set(-20, 20, -20);
        this.scene.add(fillLight);
        
        const topLight = new THREE.DirectionalLight(0xffffff, 0.8); // Top light
        topLight.position.set(0, 50, 0);
        this.scene.add(topLight);

        // Lighter sky background
        this.scene.background = new THREE.Color(0xd4e8f7); // Lighter blue

        // Load orbit controls first
        await this.setupOrbitControls();
        
        // Load orange tree
        await this.loadOrangeTree();

        // Load user rank and apply customization
        await this.loadUserRankAndCustomize();

        // Start render
        this.animate();
    }

    async setupOrbitControls() {
        try {
            const { OrbitControls } = await import('https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js');
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI / 2;
            console.log('🎮 Orbit controls enabled - Click and drag to move around!');
        } catch (error) {
            console.error('❌ Error loading OrbitControls:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate NFT balls with subtle pulsing
        const time = this.clock.getElapsedTime();
        this.nftBalls.forEach(ball => {
            if (ball.userData.pulseSpeed) {
                const pulse = Math.sin(time * ball.userData.pulseSpeed + ball.userData.pulseOffset) * 0.1 + 1.0;
                ball.scale.set(pulse, pulse, pulse);
                
                // Also pulse the emissive intensity
                if (ball.material && ball.material.emissiveIntensity !== undefined) {
                    ball.material.emissiveIntensity = 3.0 + Math.sin(time * ball.userData.pulseSpeed + ball.userData.pulseOffset) * 0.5;
                }
            }
        });

        // Animate decorations
        this.animateDecorations();
        
        this.renderer.render(this.scene, this.camera);
    }

    async loadOrangeTree() {
        console.log('🍊 Loading Orange Tree...');
        
        try {
            const { FBXLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/FBXLoader.js');
            
            // Load textures with proper color encoding
            const textureLoader = new THREE.TextureLoader();
            const treeTexture = textureLoader.load('models/the-orange-tree/textures/FinalTree.jpg');
            const grassTexture = textureLoader.load('models/the-orange-tree/textures/FinalGrass.jpg');
            const grassAlpha = textureLoader.load('models/the-orange-tree/textures/GrassAlpha.jpg');
            
            // Set proper color space for textures (important for natural colors!)
            treeTexture.encoding = THREE.sRGBEncoding;
            grassTexture.encoding = THREE.sRGBEncoding;
            
            console.log('🎨 Loading textures with sRGB encoding...');
            
            const loader = new FBXLoader();
            loader.setPath('models/the-orange-tree/source/');
            
            loader.load(
                'PalaceGrounds.fbx',
                (tree) => {
                    console.log('✅ Tree loaded!');
                    
                    // Apply textures and fix materials
                    tree.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            console.log('Mesh:', child.name);
                            
                            if (child.material) {
                                const name = child.name.toLowerCase();
                                
                                // Handle array of materials
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                
                                materials.forEach((mat, index) => {
                                    if (!mat || typeof mat.clone !== 'function') {
                                        console.log('  ⚠️ Skipping invalid material');
                                        return;
                                    }
                                    
                                    // Clone to avoid shared material issues
                                    const newMat = mat.clone();
                                    
                                    // Skip skybox - keep it as is
                                    if (name.includes('sky') || name.includes('moon')) {
                                        console.log('  → Keeping original material for:', child.name);
                                        return;
                                    }
                                    
                                    // Apply tree texture to tree parts
                                    if (name.includes('tree') || name.includes('leaf') || name.includes('branch') || 
                                        name.includes('trunk') || name.includes('orange') || name.includes('fruit') ||
                                        name.includes('foliage') || name.includes('plant')) {
                                        
                                        // Create a new MeshStandardMaterial with the texture
                                        const treeMaterial = new THREE.MeshStandardMaterial({
                                            map: treeTexture,
                                            color: 0xffffff,
                                            metalness: 0,
                                            roughness: 0.8,
                                            side: THREE.DoubleSide
                                        });
                                        
                                        if (Array.isArray(child.material)) {
                                            child.material[index] = treeMaterial;
                                        } else {
                                            child.material = treeMaterial;
                                        }
                                        
                                        console.log('  → Applied TREE texture with MeshStandardMaterial');
                                        
                                    } else if (name.includes('grass') || name.includes('ground') || 
                                              name.includes('floor') || name.includes('plane')) {
                                        
                                        // Create a new MeshStandardMaterial for grass
                                        const grassMaterial = new THREE.MeshStandardMaterial({
                                            map: grassTexture,
                                            alphaMap: grassAlpha,
                                            transparent: true,
                                            color: 0xffffff,
                                            side: THREE.DoubleSide
                                        });
                                        
                                        if (Array.isArray(child.material)) {
                                            child.material[index] = grassMaterial;
                                        } else {
                                            child.material = grassMaterial;
                                        }
                                        
                                        console.log('  → Applied GRASS texture with MeshStandardMaterial');
                                    }
                                });
                            }
                        }
                    });
                    
                    // Position tree
                    tree.position.set(0, 0, 0);
                    tree.scale.set(0.01, 0.01, 0.01);
                    this.scene.add(tree);
                    
                    // Store tree reference for NFT balls
                    this.tree = tree;
                    
                    // Calculate tree bounds for placing NFT balls
                    const bbox = new THREE.Box3().setFromObject(tree);
                    this.treeBounds = {
                        center: bbox.getCenter(new THREE.Vector3()),
                        size: bbox.getSize(new THREE.Vector3())
                    };
                    
                    console.log('🌳 Tree added to scene');
                    console.log('📦 Tree bounds:', this.treeBounds);
                    
                    // Camera position - better angle like Sketchfab
                    this.camera.position.set(20, 15, 20);
                    this.camera.lookAt(0, 5, 0);
                    
                    // Set orbit controls target
                    if (this.controls) {
                        this.controls.target.set(0, 5, 0);
                        this.controls.update();
                    }
                    
                    console.log('📹 Camera at:', this.camera.position);
                    console.log('🎮 Use mouse to rotate, scroll to zoom!');
                    
                    // Load existing NFTs from localStorage FIRST
                    this.loadNFTsFromStorage();
                    
                    // Load pending NFTs (from quests completed before tree loaded)
                    this.loadPendingNFTs();
                    
                    // Setup hover detection for NFT balls (after loading)
                    setTimeout(() => {
                        this.setupNFTHoverDetection();
                    }, 500);
                },
                (progress) => {
                    if (progress.total > 0) {
                        console.log(`Loading... ${((progress.loaded / progress.total) * 100).toFixed(0)}%`);
                    }
                },
                (error) => {
                    console.error('❌ Error loading tree:', error);
                }
            );
            
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }

    // Add NFT ball to tree when quest is completed
    addNFTBall(questData) {
        if (!this.tree || !this.treeBounds) {
            console.warn('⚠️ Tree not loaded yet, cannot add NFT ball');
            // Queue it for later
            setTimeout(() => this.addNFTBall(questData), 1000);
            return;
        }

        const { center, size } = this.treeBounds;
        
        console.log('🌳 Tree bounds:', { center, size });
        console.log('📹 Camera position:', this.camera.position);
        console.log('👀 Camera looking at:', this.controls ? this.controls.target : 'N/A');
        console.log('🎯 Tree center coordinates:', center);
        console.log('📏 Tree size:', size);
        
        // Use SIMPLE absolute positioning - tree center is around (-4.32, -0.59, -1.95)
        // Camera looks at (0, 5, 0), so position balls near that area but around tree center
        
        const angle = Math.random() * Math.PI * 2;
        // Increased radius for better spacing - 2.5 to 4.0 units from tree center
        const radius = 2.5 + Math.random() * 1.5;
        // Height: tree center Y + 2 to 4 units up (visible height)
        const height = center.y + 2 + Math.random() * 2;
        
        // Position relative to tree center with simple math
        const x = center.x + Math.cos(angle) * radius;
        const y = height;
        const z = center.z + Math.sin(angle) * radius;
        
        console.log('🎯 Calculated ball position:', { x, y, z });
        console.log('📐 Distance from tree center:', Math.sqrt(
            Math.pow(x - center.x, 2) + 
            Math.pow(y - center.y, 2) + 
            Math.pow(z - center.z, 2)
        ).toFixed(2), 'units');
        
        // Create LARGER, MORE VISIBLE glowing NFT ball
        const ballSize = 0.6; // Bigger so it's clearly visible floating outside
        const geometry = new THREE.SphereGeometry(ballSize, 16, 16);
        
        const ballColor = questData.color || `hsl(${Math.random() * 360}, 80%, 60%)`;
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(ballColor),
            emissive: new THREE.Color(ballColor),
            emissiveIntensity: 3.0, // Very bright so it stands out!
            metalness: 0.1,
            roughness: 0.05,
            side: THREE.DoubleSide, // Visible from all angles
            transparent: false,
            opacity: 1.0
        });
        
        const ball = new THREE.Mesh(geometry, material);
        ball.position.set(x, y, z);
        ball.castShadow = true;
        ball.receiveShadow = true;
        
        // Add a point light to make it glow even more
        const pointLight = new THREE.PointLight(ballColor, 5, 20); // Very bright, long range
        pointLight.position.copy(ball.position);
        this.scene.add(pointLight);
        ball.userData.pointLight = pointLight;
        
        // Add a subtle pulsing animation to make it more noticeable
        ball.userData.pulseSpeed = 0.02 + Math.random() * 0.03;
        ball.userData.pulseOffset = Math.random() * Math.PI * 2;
        
        // Remove wireframe helper - balls should be visible enough now
        // (Keep code but disable it)
        const helper = new THREE.Mesh(
            new THREE.SphereGeometry(ballSize * 1.2, 8, 8),
            new THREE.MeshBasicMaterial({ 
                color: 0xffff00, 
                wireframe: true,
                transparent: true,
                opacity: 0.0 // Hidden now
            })
        );
        helper.position.copy(ball.position);
        helper.visible = false; // Disabled - balls are visible enough
        this.scene.add(helper);
        ball.userData.helper = helper;
        
        // Store quest data on ball (with full date/time for hover display)
        const completionDate = questData.date ? (typeof questData.date === 'string' ? new Date(questData.date) : new Date()) : new Date();
        ball.userData = {
            ...ball.userData,
            questId: questData.questId,
            questTitle: questData.title,
            completedDate: completionDate.toISOString(), // Store full ISO string for proper parsing
            nftAddress: questData.nftAddress || 'Minting...',
            userAddress: questData.userAddress || 'Unknown'
        };
        
        this.scene.add(ball);
        this.nftBalls.push(ball);
        
        console.log('✨ Added NFT ball for quest:', questData.title);
        console.log('📍 Ball position:', { x, y, z });
        console.log('🎨 Ball color:', ballColor);
        console.log('📊 Total NFT balls:', this.nftBalls.length);
        console.log('👁️ Ball visible:', ball.visible);
        console.log('📏 Ball scale:', ball.scale);
        
        // Make absolutely sure ball is visible
        ball.visible = true;
        ball.renderOrder = 1000; // Render on top
        
        // Animate entrance
        ball.scale.set(0, 0, 0);
        this.animateBallEntrance(ball);
        
        // Save to localStorage
        this.saveNFTsToStorage();
    }
    
    animateBallEntrance(ball) {
        let progress = 0;
        const animate = () => {
            progress += 0.05;
            if (progress < 1) {
                const scale = Math.sin(progress * Math.PI * 0.5);
                ball.scale.set(scale, scale, scale);
                requestAnimationFrame(animate);
            } else {
                ball.scale.set(1, 1, 1);
            }
        };
        animate();
    }
    
    setupNFTHoverDetection() {
        // Create hover info div
        let hoverDiv = document.getElementById('nft-hover-info');
        if (!hoverDiv) {
            hoverDiv = document.createElement('div');
            hoverDiv.id = 'nft-hover-info';
            hoverDiv.style.position = 'fixed'; // Changed to fixed
            hoverDiv.style.pointerEvents = 'none';
            hoverDiv.style.background = 'linear-gradient(135deg, rgba(20,20,40,0.95), rgba(40,40,80,0.95))';
            hoverDiv.style.color = '#fff';
            hoverDiv.style.padding = '12px 16px';
            hoverDiv.style.borderRadius = '12px';
            hoverDiv.style.fontSize = '0.9em';
            hoverDiv.style.display = 'none';
            hoverDiv.style.zIndex = '10000'; // Much higher z-index
            hoverDiv.style.border = '2px solid rgba(100,200,255,0.5)';
            hoverDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
            hoverDiv.style.minWidth = '200px';
            hoverDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            document.body.appendChild(hoverDiv);
        }
        
        // Raycaster for hover detection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const canvas = this.renderer.domElement;
        
        let hoverCheckInterval = setInterval(() => {
            if (this.nftBalls.length === 0) return;
            
            // Update raycaster with current camera
            const mousePos = { x: 0, y: 0 };
            raycaster.setFromCamera(mousePos, this.camera);
            const intersects = raycaster.intersectObjects(this.nftBalls, false);
        }, 100);
        
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.nftBalls, false);
            
            if (intersects.length > 0) {
                const ball = intersects[0].object;
                const data = ball.userData;
                
                if (!data.questTitle) {
                    console.warn('⚠️ Ball missing quest data:', ball);
                    return;
                }
                
                // Parse completion date and time
                const completedDate = data.completedDate ? new Date(data.completedDate) : new Date();
                const formattedDate = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const formattedTime = completedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const timeAgo = this.getTimeAgo(completedDate);
                
                hoverDiv.innerHTML = `
                    <div style="position:relative;padding:16px;background:linear-gradient(135deg, rgba(30,41,59,0.98), rgba(51,65,85,0.98));border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4), 0 0 0 2px rgba(100,200,255,0.3);min-width:280px;backdrop-filter:blur(20px);">
                        <!-- Header with glow effect -->
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:2px solid rgba(100,200,255,0.2);">
                            <div style="width:48px;height:48px;background:linear-gradient(135deg, #3b82f6, #8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 16px rgba(59,130,246,0.4);animation:pulse 2s ease-in-out infinite;">
                                🎯
                            </div>
                            <div style="flex:1;">
                                <div style="font-weight:700;font-size:1.1em;color:#fff;margin-bottom:4px;text-shadow:0 2px 8px rgba(0,0,0,0.3);">
                                    ${data.questTitle}
                                </div>
                                <div style="font-size:0.75em;color:#94a3b8;display:flex;align-items:center;gap:6px;">
                                    <span style="width:6px;height:6px;background:#10b981;border-radius:50%;display:inline-block;box-shadow:0 0 8px #10b981;"></span>
                                    Completed ${timeAgo}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Details Grid -->
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                            <div style="background:rgba(100,200,255,0.1);padding:10px;border-radius:8px;border:1px solid rgba(100,200,255,0.2);">
                                <div style="font-size:0.7em;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Date</div>
                                <div style="font-weight:600;color:#fff;font-size:0.9em;">${formattedDate}</div>
                            </div>
                            <div style="background:rgba(100,200,255,0.1);padding:10px;border-radius:8px;border:1px solid rgba(100,200,255,0.2);">
                                <div style="font-size:0.7em;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Time</div>
                                <div style="font-weight:600;color:#fff;font-size:0.9em;">${formattedTime}</div>
                            </div>
                        </div>
                        
                        <!-- NFT Info -->
                        <div style="background:rgba(16,185,129,0.1);padding:12px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);margin-bottom:12px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <span style="font-size:1.2em;">💎</span>
                                <div style="font-size:0.75em;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">NFT Token</div>
                            </div>
                            <div style="font-family:'Courier New',monospace;font-size:0.85em;color:#10b981;word-break:break-all;font-weight:600;">
                                ${data.nftAddress === 'Minting...' ? data.nftAddress : (data.nftAddress && data.nftAddress.length > 16 ? data.nftAddress.slice(0, 12) + '...' + data.nftAddress.slice(-8) : data.nftAddress)}
                            </div>
                        </div>
                        
                        <!-- User Address -->
                        <div style="display:flex;align-items:center;gap:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
                            <span style="font-size:1em;">👤</span>
                            <div style="flex:1;">
                                <div style="font-size:0.7em;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Wallet</div>
                                <div style="font-family:'Courier New',monospace;font-size:0.8em;color:#7dd3fc;word-break:break-all;">
                                    ${data.userAddress && data.userAddress.length > 10 ? data.userAddress.slice(0, 6) + '...' + data.userAddress.slice(-4) : data.userAddress}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add pulse animation style if not already added
                if (!document.getElementById('nft-hover-styles')) {
                    const style = document.createElement('style');
                    style.id = 'nft-hover-styles';
                    style.textContent = `
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); opacity: 1; }
                            50% { transform: scale(1.05); opacity: 0.9; }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                hoverDiv.style.left = event.clientX + 15 + 'px';
                hoverDiv.style.top = event.clientY + 15 + 'px';
                hoverDiv.style.display = 'block';
                
                console.log('🖱️ Hovering over NFT:', data.questTitle);
            } else {
                hoverDiv.style.display = 'none';
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            hoverDiv.style.display = 'none';
        });
        
        console.log('🎯 NFT hover detection enabled');
        console.log('📊 Current NFT balls count:', this.nftBalls.length);
    }
    
    saveNFTsToStorage() {
        const nftData = this.nftBalls.map(ball => ({
            position: { x: ball.position.x, y: ball.position.y, z: ball.position.z },
            color: '#' + ball.material.color.getHexString(),
            userData: ball.userData
        }));
        localStorage.setItem('treeNFTs', JSON.stringify(nftData));
    }
    
    loadNFTsFromStorage() {
        const stored = localStorage.getItem('treeNFTs');
        if (stored) {
            try {
                const nftData = JSON.parse(stored);
                console.log(`📦 Loading ${nftData.length} stored NFT balls...`);
                nftData.forEach((data, index) => {
                    if (data.userData && data.userData.questTitle) {
                        this.addNFTBall({
                            questId: data.userData.questId || `stored-${index}`,
                            title: data.userData.questTitle,
                            date: data.userData.completedDate || new Date().toISOString(),
                            nftAddress: data.userData.nftAddress || 'Stored NFT',
                            userAddress: data.userData.userAddress || 'Unknown',
                            color: data.color || '#10b981'
                        });
                    } else {
                        console.warn('⚠️ Skipping invalid NFT data:', data);
                    }
                });
            } catch (error) {
                console.error('❌ Error loading NFTs from storage:', error);
            }
        } else {
            console.log('📦 No stored NFTs found');
        }
    }
    
    // Public method to add NFT from quest completion
    addQuestNFT(questId, title, nftAddress, userAddress) {
        this.addNFTBall({
            questId,
            title,
            nftAddress,
            userAddress,
            date: new Date().toISOString(), // Store as ISO string for proper parsing
            color: this.getQuestColor(questId)
        });
    }
    
    // Clear all NFT balls (for debugging/resetting)
    clearAllNFTs() {
        this.nftBalls.forEach(ball => {
            if (ball.userData.pointLight) {
                this.scene.remove(ball.userData.pointLight);
            }
            if (ball.userData.helper) {
                this.scene.remove(ball.userData.helper);
            }
            this.scene.remove(ball);
        });
        this.nftBalls = [];
        localStorage.removeItem('treeNFTs');
        console.log('🗑️ Cleared all NFT balls');
    }
    
    getQuestColor(questId) {
        // Different colors for different quest types
        const colors = {
            'save': '#10b981',     // Green
            'overdraft': '#f59e0b', // Orange
            'rent': '#3b82f6',     // Blue
            'debt': '#ef4444',     // Red
            'income': '#8b5cf6',   // Purple
            'budget': '#ec4899',   // Pink
            'charity': '#14b8a6'   // Teal
        };
        
        for (const key in colors) {
            if (questId.includes(key)) return colors[key];
        }
        
        return `hsl(${Math.random() * 360}, 80%, 60%)`;
    }
    
    // Helper function to get time ago
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'just now';
    }
    
    // Load pending NFTs that were completed before tree was loaded
    loadPendingNFTs() {
        const pendingNFTs = JSON.parse(localStorage.getItem('pendingNFTs') || '[]');
        if (pendingNFTs.length > 0) {
            console.log(`📦 Loading ${pendingNFTs.length} pending NFT(s)...`);
            pendingNFTs.forEach(nft => {
                this.addQuestNFT(
                    nft.questId,
                    nft.title,
                    nft.nftAddress,
                    nft.userAddress
                );
            });
            // Clear pending NFTs after loading
            localStorage.removeItem('pendingNFTs');
            console.log('✅ Pending NFTs loaded and cleared');
        }
    }

    // ============================================
    // LEADERBOARD-BASED CUSTOMIZATION SYSTEM
    // ============================================

    // Load user rank and apply customization (DEMO MODE - shows effects based on NFT count)
    async loadUserRankAndCustomize() {
        try {
            // DEMO MODE: Apply effects based on NFT count instead of leaderboard rank
            const nftCount = this.nftBalls.length;
            const storedNFTs = JSON.parse(localStorage.getItem('treeNFTs') || '[]');
            const totalNFTs = Math.max(nftCount, storedNFTs.length);
            
            // Get credit score from localStorage or use default
            const creditScore = parseInt(localStorage.getItem('creditScore')) || 68;
            
            // Create demo stats based on NFT count
            const demoStats = {
                nftCount: totalNFTs,
                creditScore: creditScore
            };
            
            // Apply effects based on NFT count (more NFTs = better effects)
            if (totalNFTs >= 15) {
                // Top tier - Golden theme
                this.applyGoldenTheme(demoStats);
                this.userRank = 1;
            } else if (totalNFTs >= 10) {
                // High tier - Silver theme
                this.applySilverTheme(demoStats);
                this.userRank = 2;
            } else if (totalNFTs >= 5) {
                // Mid tier - Bronze theme
                this.applyBronzeTheme(demoStats);
                this.userRank = 3;
            } else if (totalNFTs >= 3) {
                // Good tier - Platinum theme
                this.applyPlatinumTheme(demoStats);
                this.userRank = 4;
            } else if (totalNFTs >= 1) {
                // Basic tier - Diamond theme
                this.applyDiamondTheme(demoStats);
                this.userRank = 5;
            } else {
                // Default - Emerald theme (still has effects)
                this.applyEmeraldTheme(demoStats);
                this.userRank = 6;
            }
            
            this.userStats = demoStats;
            
            // Add stat-based unlocks
            this.applyStatBasedUnlocks(demoStats);
            
            console.log(`🎨 Applied customization for ${totalNFTs} NFTs (Demo Mode)`);
            console.log(`📊 Stats: ${totalNFTs} NFTs, ${creditScore} credit score`);
            
        } catch (error) {
            console.warn('⚠️ Could not load customization, using default theme:', error);
            // Still apply default theme with effects
            this.applyEmeraldTheme({ nftCount: 0, creditScore: 68 });
        }
    }

    // Apply visual customization based on rank (kept for compatibility)
    applyRankBasedCustomization(rank, stats) {
        // This method is now mainly for manual theme switching
        console.log(`🎨 Applying customization for rank #${rank}`);

        // Clear existing customizations
        this.clearCustomizations();

        if (rank === 1) {
            this.applyGoldenTheme(stats);
        } else if (rank === 2) {
            this.applySilverTheme(stats);
        } else if (rank === 3) {
            this.applyBronzeTheme(stats);
        } else if (rank <= 10) {
            this.applyPlatinumTheme(stats);
        } else if (rank <= 25) {
            this.applyDiamondTheme(stats);
        } else if (rank <= 50) {
            this.applyEmeraldTheme(stats);
        } else if (rank <= 100) {
            this.applySapphireTheme(stats);
        } else {
            this.applyDefaultTheme(stats);
        }

        this.addRankDecorations(rank, stats);
        this.applyStatBasedUnlocks(stats);
    }
    
    // Public method to manually switch themes (for demo/preview)
    switchTheme(themeName) {
        this.clearCustomizations();
        const stats = this.userStats || { nftCount: this.nftBalls.length, creditScore: 68 };
        
        switch(themeName) {
            case 'golden':
                this.applyGoldenTheme(stats);
                break;
            case 'silver':
                this.applySilverTheme(stats);
                break;
            case 'bronze':
                this.applyBronzeTheme(stats);
                break;
            case 'platinum':
                this.applyPlatinumTheme(stats);
                break;
            case 'diamond':
                this.applyDiamondTheme(stats);
                break;
            case 'emerald':
                this.applyEmeraldTheme(stats);
                break;
            case 'sapphire':
                this.applySapphireTheme(stats);
                break;
            default:
                this.applyEmeraldTheme(stats);
        }
        console.log(`🎨 Switched to ${themeName} theme`);
    }

    // 🥇 GOLDEN THEME (Rank #1)
    applyGoldenTheme(stats) {
        // Golden sky with gradient effect
        this.scene.background = new THREE.Color(0xffd700); // Gold
        this.scene.fog = new THREE.Fog(0xffd700, 10, 50);

        // Add golden particles
        this.addParticleSystem(100, 0xffd700, 0.3);

        // Golden tree lighting
        const goldenLight = new THREE.DirectionalLight(0xffd700, 2.0);
        goldenLight.position.set(0, 30, 0);
        this.scene.add(goldenLight);
        this.customization.lights.push(goldenLight);

        // Add golden point lights around tree
        if (this.treeBounds) {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = 5;
                const light = new THREE.PointLight(0xffd700, 3, 15);
                light.position.set(
                    this.treeBounds.center.x + Math.cos(angle) * radius,
                    this.treeBounds.center.y + 3,
                    this.treeBounds.center.z + Math.sin(angle) * radius
                );
                this.scene.add(light);
                this.customization.lights.push(light);
            }
        }

        // Crown above tree
        if (this.treeBounds) {
            this.addCrown(this.treeBounds.center, 0xffd700);
        }

        // Trophy decorations
        this.addTrophies(3, 0xffd700);

        // Add floating golden orbs
        this.addFloatingOrbs(10, 0xffd700, 0.4);

        console.log('✨ Applied GOLDEN theme for #1!');
    }

    // 🥈 SILVER THEME (Rank #2)
    applySilverTheme(stats) {
        this.scene.background = new THREE.Color(0xc0c0c0);
        this.scene.fog = new THREE.Fog(0xc0c0c0, 10, 50);
        this.addParticleSystem(75, 0xc0c0c0, 0.25);
        
        const silverLight = new THREE.DirectionalLight(0xc0c0c0, 1.5);
        silverLight.position.set(0, 30, 0);
        this.scene.add(silverLight);
        this.customization.lights.push(silverLight);

        if (this.treeBounds) {
            this.addCrown(this.treeBounds.center, 0xc0c0c0);
            this.addTrophies(2, 0xc0c0c0);
            this.addFloatingOrbs(7, 0xc0c0c0, 0.3);
        }
    }

    // 🥉 BRONZE THEME (Rank #3)
    applyBronzeTheme(stats) {
        this.scene.background = new THREE.Color(0xcd7f32);
        this.scene.fog = new THREE.Fog(0xcd7f32, 10, 50);
        this.addParticleSystem(50, 0xcd7f32, 0.2);
        
        const bronzeLight = new THREE.DirectionalLight(0xcd7f32, 1.2);
        bronzeLight.position.set(0, 30, 0);
        this.scene.add(bronzeLight);
        this.customization.lights.push(bronzeLight);

        if (this.treeBounds) {
            this.addCrown(this.treeBounds.center, 0xcd7f32);
            this.addTrophies(1, 0xcd7f32);
            this.addFloatingOrbs(5, 0xcd7f32, 0.25);
        }
    }

    // 💎 PLATINUM THEME (Top 10)
    applyPlatinumTheme(stats) {
        this.scene.background = new THREE.Color(0xe5e4e2);
        this.scene.fog = new THREE.Fog(0xe5e4e2, 15, 60);
        this.addParticleSystem(40, 0xe5e4e2, 0.15);
        if (this.treeBounds) {
            this.addFloatingCrystals(5, 0xe5e4e2);
            this.addFloatingOrbs(4, 0xe5e4e2, 0.2);
        }
    }

    // 💠 DIAMOND THEME (Top 25)
    applyDiamondTheme(stats) {
        this.scene.background = new THREE.Color(0xb9f2ff);
        this.scene.fog = new THREE.Fog(0xb9f2ff, 15, 60);
        this.addParticleSystem(30, 0xb9f2ff, 0.12);
        if (this.treeBounds) {
            this.addFloatingCrystals(3, 0xb9f2ff);
            this.addFloatingOrbs(3, 0xb9f2ff, 0.15);
        }
    }

    // 💚 EMERALD THEME (Top 50)
    applyEmeraldTheme(stats) {
        this.scene.background = new THREE.Color(0x50c878);
        this.scene.fog = new THREE.Fog(0x50c878, 20, 70);
        this.addParticleSystem(20, 0x50c878, 0.1);
        if (this.treeBounds) {
            this.addFloatingFlowers(5);
            this.addFloatingOrbs(2, 0x50c878, 0.1);
        }
    }

    // 💙 SAPPHIRE THEME (Top 100)
    applySapphireTheme(stats) {
        this.scene.background = new THREE.Color(0x0f52ba);
        this.scene.fog = new THREE.Fog(0x0f52ba, 20, 70);
        this.addParticleSystem(15, 0x0f52ba, 0.08);
        if (this.treeBounds) {
            this.addFloatingOrbs(1, 0x0f52ba, 0.08);
        }
    }

    // 🌳 DEFAULT THEME (Everyone else) - Now uses Emerald as default
    applyDefaultTheme(stats) {
        // Use Emerald theme as default (still has nice effects)
        this.applyEmeraldTheme(stats);
    }

    // Add particle system
    addParticleSystem(count, color, intensity) {
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorObj = new THREE.Color(color);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 50;
            positions[i + 1] = Math.random() * 30;
            positions[i + 2] = (Math.random() - 0.5) * 50;

            colors[i] = colorObj.r;
            colors[i + 1] = colorObj.g;
            colors[i + 2] = colorObj.b;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: intensity,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, material);
        this.scene.add(particleSystem);
        this.customization.particles.push(particleSystem);
    }

    // Add floating crown above tree
    addCrown(position, color) {
        const crownGroup = new THREE.Group();
        
        // Create simple crown geometry
        const crownGeometry = new THREE.ConeGeometry(0.5, 1, 8);
        const crownMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.set(0, 0, 0);
        crown.rotation.x = Math.PI;
        crownGroup.add(crown);

        // Add jewels
        for (let i = 0; i < 5; i++) {
            const jewel = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: 0xff00ff,
                    emissive: 0xff00ff,
                    emissiveIntensity: 1.0
                })
            );
            jewel.position.set(
                (i - 2) * 0.15,
                -0.3,
                0
            );
            crownGroup.add(jewel);
        }

        crownGroup.position.set(
            position.x,
            position.y + 5,
            position.z
        );

        // Animate floating
        crownGroup.userData.floatSpeed = 0.5;
        crownGroup.userData.floatOffset = Math.random() * Math.PI * 2;

        this.scene.add(crownGroup);
        this.customization.decorations.push(crownGroup);
    }

    // Add trophy decorations
    addTrophies(count, color) {
        if (!this.treeBounds) return;
        
        const { center } = this.treeBounds;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 3;
            const x = center.x + Math.cos(angle) * radius;
            const z = center.z + Math.sin(angle) * radius;
            const y = center.y - 1;

            const trophy = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.3, 1, 8),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.3,
                    metalness: 0.9,
                    roughness: 0.1
                })
            );
            trophy.position.set(x, y, z);
            trophy.rotation.y = angle;

            this.scene.add(trophy);
            this.customization.decorations.push(trophy);
        }
    }

    // Add floating crystals
    addFloatingCrystals(count, color) {
        if (!this.treeBounds) return;
        
        const { center } = this.treeBounds;
        
        for (let i = 0; i < count; i++) {
            const crystal = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.3, 0),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8
                })
            );

            const angle = (i / count) * Math.PI * 2;
            const radius = 4 + Math.random() * 2;
            crystal.position.set(
                center.x + Math.cos(angle) * radius,
                center.y + 2 + Math.random() * 3,
                center.z + Math.sin(angle) * radius
            );

            crystal.userData.floatSpeed = 0.3 + Math.random() * 0.2;
            crystal.userData.floatOffset = Math.random() * Math.PI * 2;
            crystal.userData.rotationSpeed = 0.01 + Math.random() * 0.02;

            this.scene.add(crystal);
            this.customization.decorations.push(crystal);
        }
    }

    // Add floating flowers
    addFloatingFlowers(count) {
        if (!this.treeBounds) return;
        
        const { center } = this.treeBounds;
        const flowerColors = [0xff69b4, 0xff1493, 0xffc0cb, 0xffb6c1];
        
        for (let i = 0; i < count; i++) {
            const flower = new THREE.Mesh(
                new THREE.ConeGeometry(0.2, 0.4, 6),
                new THREE.MeshStandardMaterial({
                    color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                    emissive: 0xff69b4,
                    emissiveIntensity: 0.3
                })
            );

            const angle = (i / count) * Math.PI * 2;
            const radius = 3 + Math.random() * 2;
            flower.position.set(
                center.x + Math.cos(angle) * radius,
                center.y - 0.5 + Math.random() * 1,
                center.z + Math.sin(angle) * radius
            );

            this.scene.add(flower);
            this.customization.decorations.push(flower);
        }
    }

    // Add floating orbs
    addFloatingOrbs(count, color, intensity) {
        if (!this.treeBounds) return;
        
        const { center } = this.treeBounds;
        
        for (let i = 0; i < count; i++) {
            const orb = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: intensity,
                    transparent: true,
                    opacity: 0.7
                })
            );

            const angle = (i / count) * Math.PI * 2;
            const radius = 5 + Math.random() * 3;
            orb.position.set(
                center.x + Math.cos(angle) * radius,
                center.y + 3 + Math.random() * 4,
                center.z + Math.sin(angle) * radius
            );

            orb.userData.floatSpeed = 0.2 + Math.random() * 0.2;
            orb.userData.floatOffset = Math.random() * Math.PI * 2;
            orb.userData.rotationSpeed = 0.005 + Math.random() * 0.01;

            this.scene.add(orb);
            this.customization.decorations.push(orb);
        }
    }

    // Add rank-specific decorations
    addRankDecorations(rank, stats) {
        if (!this.treeBounds) return;
        
        // Add rank badge display (3D text would require text library, using sprite for now)
        if (rank <= 10) {
            // Add special effects for top 10
            this.addRankBadge(rank);
        }
    }

    // Add rank badge (visual indicator)
    addRankBadge(rank) {
        // Create a simple visual indicator
        console.log(`🏆 Rank badge: #${rank}`);
        // Could add a 3D sprite or text here if text library is available
    }

    // Apply stat-based unlocks
    applyStatBasedUnlocks(stats) {
        if (!stats) return;
        
        // Unlock features based on NFT count
        if (stats.nftCount >= 20 && !this.customization.decorations.some(d => d.userData.type === 'milestone_20')) {
            this.addMilestoneDecoration('20 NFTs', 0x10b981);
        }
        if (stats.nftCount >= 50 && !this.customization.decorations.some(d => d.userData.type === 'milestone_50')) {
            this.addMilestoneDecoration('50 NFTs', 0x3b82f6);
        }
        if (stats.nftCount >= 100 && !this.customization.decorations.some(d => d.userData.type === 'milestone_100')) {
            this.addMilestoneDecoration('100 NFTs', 0x8b5cf6);
        }

        // Unlock features based on credit score
        if (stats.creditScore >= 90 && !this.customization.decorations.some(d => d.userData.type === 'score_90')) {
            this.addMilestoneDecoration('90+ Score', 0xffd700);
        }
    }

    // Add milestone decoration
    addMilestoneDecoration(label, color) {
        if (!this.treeBounds) return;
        
        const milestone = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.1, 8, 16),
            new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5
            })
        );
        
        milestone.position.set(
            this.treeBounds.center.x,
            this.treeBounds.center.y + 6,
            this.treeBounds.center.z
        );
        
        milestone.userData.type = label.toLowerCase().replace(/\s+/g, '_');
        milestone.userData.label = label;
        milestone.userData.rotationSpeed = 0.02;
        
        this.scene.add(milestone);
        this.customization.decorations.push(milestone);
    }

    // Celebrate rank up (disabled in demo mode)
    celebrateRankUp(newRank, oldRank) {
        // Disabled for demo - no rank-up celebrations needed
        return;
    }

    // Create particle burst effect
    createParticleBurst(count, color) {
        if (!this.treeBounds) return;
        
        const { center } = this.treeBounds;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorObj = new THREE.Color(color);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = center.x;
            positions[i + 1] = center.y + 3;
            positions[i + 2] = center.z;

            const speed = 0.5 + Math.random() * 0.5;
            const angle = Math.random() * Math.PI * 2;
            velocities[i] = Math.cos(angle) * speed;
            velocities[i + 1] = (Math.random() - 0.5) * speed + 0.5;
            velocities[i + 2] = Math.sin(angle) * speed;

            colors[i] = colorObj.r;
            colors[i + 1] = colorObj.g;
            colors[i + 2] = colorObj.b;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, material);
        this.scene.add(particleSystem);

        // Animate burst
        let frame = 0;
        const maxFrames = 60;
        const animate = () => {
            frame++;
            if (frame < maxFrames) {
                const positions = particleSystem.geometry.attributes.position.array;
                for (let i = 0; i < count * 3; i += 3) {
                    positions[i] += velocities[i];
                    positions[i + 1] += velocities[i + 1];
                    positions[i + 2] += velocities[i + 2];
                }
                particleSystem.geometry.attributes.position.needsUpdate = true;
                material.opacity = 1.0 - (frame / maxFrames);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particleSystem);
                particleSystem.geometry.dispose();
                particleSystem.material.dispose();
            }
        };
        animate();
    }

    // Show celebration notification
    showCelebrationNotification(newRank, oldRank) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 165, 0, 0.95));
            color: #000;
            padding: 30px 50px;
            border-radius: 20px;
            font-size: 2em;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            animation: celebrate 0.5s ease-out;
            text-align: center;
        `;
        notification.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 10px;">🎉</div>
            <div>Rank Up!</div>
            <div style="font-size: 0.6em; margin-top: 10px;">#${oldRank} → #${newRank}</div>
        `;
        
        // Add animation
        if (!document.getElementById('celebration-styles')) {
            const style = document.createElement('style');
            style.id = 'celebration-styles';
            style.textContent = `
                @keyframes celebrate {
                    0% { transform: translateX(-50%) scale(0) rotate(-180deg); opacity: 0; }
                    50% { transform: translateX(-50%) scale(1.2) rotate(10deg); }
                    100% { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transition = 'all 0.5s ease-out';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-50px)';
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }

    // Animate decorations
    animateDecorations() {
        const time = this.clock.getElapsedTime();
        
        this.customization.decorations.forEach(decoration => {
            if (decoration.userData.floatSpeed) {
                const float = Math.sin(time * decoration.userData.floatSpeed + decoration.userData.floatOffset) * 0.3;
                decoration.position.y += float * 0.01;
            }
            if (decoration.userData.rotationSpeed) {
                decoration.rotation.y += decoration.userData.rotationSpeed;
            }
        });
    }

    // Clear all customizations
    clearCustomizations() {
        // Remove particles
        this.customization.particles.forEach(particle => {
            this.scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });

        // Remove decorations
        this.customization.decorations.forEach(decoration => {
            this.scene.remove(decoration);
            if (decoration.geometry) decoration.geometry.dispose();
            if (decoration.material) decoration.material.dispose();
        });

        // Remove lights
        this.customization.lights.forEach(light => {
            this.scene.remove(light);
        });

        this.customization.particles = [];
        this.customization.decorations = [];
        this.customization.lights = [];
    }

    // Public method to refresh customization (call after quest completion)
    async refreshCustomization() {
        await this.loadUserRankAndCustomize();
    }

    // Visit another user's tree (for social features)
    async visitUserTree(userAddress) {
        console.log(`🌳 Visiting tree for user: ${userAddress}`);
        // This would load that user's tree state
        // For now, just log it
        // In future: fetch user's tree data from backend and apply their customization
    }

    // Share tree screenshot
    shareTreeScreenshot() {
        // Capture canvas as image
        const canvas = this.renderer.domElement;
        const dataURL = canvas.toDataURL('image/png');
        
        // Create download link
        const link = document.createElement('a');
        link.download = `my-tree-rank-${this.userRank || 'unknown'}.png`;
        link.href = dataURL;
        link.click();
        
        console.log('📸 Tree screenshot saved!');
    }
}

window.TreeWorld = TreeWorld;
