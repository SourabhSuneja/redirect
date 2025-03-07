/**
 * Hand Gesture Recognition with Combined Finger Counter
 * Using MediaPipe Hands for real-time hand tracking
 */
class HandGestureRecognizer {
    constructor() {
        // DOM elements
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('output-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.combinedCountElement = document.getElementById('combined-fingers-count');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        // Configuration settings
        this.settings = {
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5,
            modelComplexity: 1,
            maxNumHands: 2,
            showLandmarks: true,
            isDebugMode: false
        };
        
        // UI state
        this.uiState = {
            isSettingsOpen: false,
            isCameraFlipped: false,
            isFullscreen: false
        };
        
        // Finger landmark indices
        this.fingerTips = [4, 8, 12, 16, 20];  // Thumb, index, middle, ring, pinky
        this.fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
        this.fingerBaseIndices = [2, 5, 9, 13, 17];
        
        // English finger names mapping for UI display
        this.fingerDisplayNames = {
            thumb: 'Thumb',
            index: 'Index',
            middle: 'Middle',
            ring: 'Ring',
            pinky: 'Pinky'
        };
        
        // Gesture definitions for recognition
        this.gestures = {
            fist: { description: 'Fist/Closed hand', requiredFingers: [] },
            pointingUp: { description: 'Pointing Up', requiredFingers: ['index'] },
            peace: { description: 'Peace Sign', requiredFingers: ['index', 'middle'] },
            thumbsUp: { description: 'Thumbs Up', requiredFingers: ['thumb'] },
            openPalm: { description: 'Open Palm', requiredFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'] },
            // Add more complex gestures
            threeFingers: { description: 'Three Fingers', requiredFingers: ['index', 'middle', 'ring'] },
            fourFingers: { description: 'Four Fingers', requiredFingers: ['index', 'middle', 'ring', 'pinky'] }
        };
        
        // Performance metrics
        this.performanceMetrics = {
            lastFrameTime: 0,
            frameRate: 0,
            frameCount: 0,
            totalProcessingTime: 0,
            avgProcessingTime: 0
        };
        
        // Setup event listeners
        this.setupUIEventListeners();
        
        // Initialize MediaPipe hands
        this.initializeHandTracking();
        
        // Set up screen resize handling
        this.setupResizeHandling();
    }
    
    /**
     * Setup UI interaction event listeners
     */
    setupUIEventListeners() {
        // Settings button functionality
        const settingsButton = document.getElementById('settings-button');
        const settingsPanel = document.getElementById('settings-panel');
        const closeSettingsBtn = document.querySelector('.close-btn');
        
        if (settingsButton && settingsPanel) {
            settingsButton.addEventListener('click', () => {
                this.uiState.isSettingsOpen = !this.uiState.isSettingsOpen;
                settingsPanel.classList.toggle('show', this.uiState.isSettingsOpen);
            });
            
            if (closeSettingsBtn) {
                closeSettingsBtn.addEventListener('click', () => {
                    this.uiState.isSettingsOpen = false;
                    settingsPanel.classList.remove('show');
                });
            }
        }
        
        // Fullscreen button
        const fullscreenButton = document.getElementById('fullscreen-button');
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Camera flip button
        const cameraFlipButton = document.getElementById('camera-flip-button');
        if (cameraFlipButton) {
            cameraFlipButton.addEventListener('click', () => {
                this.flipCamera();
            });
        }
        
        // Setup settings sliders
        this.setupSettingsControls();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'd':
                case 'D':
                    this.toggleDebugMode();
                    const debugCheckbox = document.getElementById('debug-mode');
                    if (debugCheckbox) debugCheckbox.checked = this.settings.isDebugMode;
                    break;
                    
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                    
                case 'Escape':
                    if (this.uiState.isSettingsOpen) {
                        this.uiState.isSettingsOpen = false;
                        settingsPanel.classList.remove('show');
                    }
                    break;
            }
        });
    }
    
    /**
     * Setup settings panel controls
     */
    setupSettingsControls() {
        // Detection confidence slider
        const detectionConfSlider = document.getElementById('detection-confidence');
        const detectionConfValue = detectionConfSlider?.nextElementSibling;
        
        if (detectionConfSlider && detectionConfValue) {
            detectionConfSlider.value = this.settings.minDetectionConfidence;
            detectionConfValue.textContent = this.settings.minDetectionConfidence;
            
            detectionConfSlider.addEventListener('input', () => {
                const value = parseFloat(detectionConfSlider.value);
                detectionConfValue.textContent = value;
                this.settings.minDetectionConfidence = value;
                this.updateHandsSettings();
            });
        }
        
        // Tracking confidence slider
        const trackingConfSlider = document.getElementById('tracking-confidence');
        const trackingConfValue = trackingConfSlider?.nextElementSibling;
        
        if (trackingConfSlider && trackingConfValue) {
            trackingConfSlider.value = this.settings.minTrackingConfidence;
            trackingConfValue.textContent = this.settings.minTrackingConfidence;
            
            trackingConfSlider.addEventListener('input', () => {
                const value = parseFloat(trackingConfSlider.value);
                trackingConfValue.textContent = value;
                this.settings.minTrackingConfidence = value;
                this.updateHandsSettings();
            });
        }
        
        // Model complexity dropdown
        const modelComplexitySelect = document.getElementById('model-complexity');
        
        if (modelComplexitySelect) {
            modelComplexitySelect.value = this.settings.modelComplexity;
            
            modelComplexitySelect.addEventListener('change', () => {
                const value = parseInt(modelComplexitySelect.value);
                this.settings.modelComplexity = value;
                this.updateHandsSettings();
            });
        }
        
        // Debug mode toggle
        const debugModeToggle = document.getElementById('debug-mode');
        
        if (debugModeToggle) {
            debugModeToggle.checked = this.settings.isDebugMode;
            
            debugModeToggle.addEventListener('change', () => {
                this.settings.isDebugMode = debugModeToggle.checked;
            });
        }
        
        // Show landmarks toggle
        const showLandmarksToggle = document.getElementById('show-landmarks');
        
        if (showLandmarksToggle) {
            showLandmarksToggle.checked = this.settings.showLandmarks;
            
            showLandmarksToggle.addEventListener('change', () => {
                this.settings.showLandmarks = showLandmarksToggle.checked;
            });
        }
    }
    
    /**
     * Update the MediaPipe Hands settings
     */
    updateHandsSettings() {
        if (this.hands) {
            this.hands.setOptions({
                maxNumHands: this.settings.maxNumHands,
                modelComplexity: this.settings.modelComplexity,
                minDetectionConfidence: this.settings.minDetectionConfidence,
                minTrackingConfidence: this.settings.minTrackingConfidence
            });
        }
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const container = document.querySelector('.container-fluid');
        
        if (!document.fullscreenElement && container) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
            this.uiState.isFullscreen = true;
            
            // Update button icon
            const fullscreenButton = document.getElementById('fullscreen-button');
            if (fullscreenButton) {
                fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.uiState.isFullscreen = false;
            
            // Update button icon
            const fullscreenButton = document.getElementById('fullscreen-button');
            if (fullscreenButton) {
                fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }
    }
    
    /**
     * Flip the camera (front/rear)
     */
    flipCamera() {
        this.uiState.isCameraFlipped = !this.uiState.isCameraFlipped;
        
        // Here you would ideally restart the camera with the new facingMode
        // This is a simplified implementation - in practice, you'd need to check
        // device capabilities and restart the camera with the correct settings
        
        if (this.camera) {
            this.camera.stop();
            
            // Show loading spinner during camera switch
            if (this.loadingSpinner) {
                this.loadingSpinner.classList.remove('hidden');
            }
            
            // Apply CSS transform to flip the video horizontally
            this.video.style.transform = this.uiState.isCameraFlipped ? 'scaleX(-1)' : '';
            this.canvas.style.transform = this.uiState.isCameraFlipped ? 'scaleX(-1)' : '';
            
            // Restart camera after a short delay
            setTimeout(() => {
                this.startCamera();
            }, 500);
        }
    }
    
    /**
     * Initialize MediaPipe Hands and configure settings
     */
    initializeHandTracking() {
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        // Set initial options
        this.updateHandsSettings();
        
        // Set results handler
        this.hands.onResults((results) => this.processHandResults(results));
        
        // Initialize camera
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                const startTime = performance.now();
                await this.hands.send({image: this.video});
                const endTime = performance.now();
                
                // Update performance metrics
                this.performanceMetrics.totalProcessingTime += (endTime - startTime);
                this.performanceMetrics.frameCount++;
                this.performanceMetrics.avgProcessingTime = 
                    this.performanceMetrics.totalProcessingTime / this.performanceMetrics.frameCount;
            },
            width: 1280,
            height: 720
        });
        
        // Start camera
        this.startCamera();
    }
    
    /**
     * Start camera with error handling
     */
    startCamera() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.remove('hidden');
        }
        
        this.camera.start()
            .then(() => {
                console.log('Camera started successfully');
                // Hide loading spinner
                if (this.loadingSpinner) {
                    setTimeout(() => {
                        this.loadingSpinner.classList.add('hidden');
                    }, 1000); // Add slight delay to ensure everything is ready
                }
            })
            .catch(err => {
                console.error('Error starting camera:', err);
                this.showCameraErrorNotification();
                // Hide loading spinner even on error
                if (this.loadingSpinner) {
                    this.loadingSpinner.classList.add('hidden');
                }
            });
    }
    
    /**
     * Display camera error notification to user
     */
    showCameraErrorNotification() {
        // Create a bootstrap alert notification
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger position-absolute top-0 start-50 translate-middle-x mt-2';
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            <strong>Camera Error!</strong> Failed to access camera. 
            Please allow camera access and refresh the page.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.classList.add('fade');
            setTimeout(() => alertDiv.remove(), 500);
        }, 5000);
    }
    
    /**
     * Handle window resize to maintain canvas size
     */
    setupResizeHandling() {
        const resizeCanvas = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        
        // Set initial size and add resize listener
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    /**
     * Process hand tracking results from MediaPipe
     */
    processHandResults(results) {
        // Calculate frame rate
        const now = performance.now();
        this.performanceMetrics.frameRate = 1000 / (now - this.performanceMetrics.lastFrameTime);
        this.performanceMetrics.lastFrameTime = now;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw camera feed on canvas if needed
        // this.ctx.save();
        // this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);
        // this.ctx.restore();
        
        // Initialize finger data for both hands
        let rightHandFingers = { count: 0, list: {}, landmarks: null };
        let leftHandFingers = { count: 0, list: {}, landmarks: null };
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Process each detected hand
            results.multiHandLandmarks.forEach((landmarks, i) => {
                const handedness = results.multiHandedness[i].label;
                
                // Draw hand landmarks if enabled
                if (this.settings.showLandmarks) {
                    this.drawHandLandmarks(landmarks);
                }
                
                // Determine which fingers are raised
                const raisedFingers = this.checkRaisedFingers(landmarks);
                
                // Update the appropriate hand information
                if (handedness === 'Right') {  // This is actually the left hand on screen
                    leftHandFingers = {
                        count: raisedFingers.count,
                        list: raisedFingers.list,
                        landmarks: landmarks
                    };
                } else {
                    rightHandFingers = {
                        count: raisedFingers.count,
                        list: raisedFingers.list,
                        landmarks: landmarks
                    };
                }
                
                // Identify and display recognized gestures
                const gesture = this.recognizeGesture(raisedFingers.list);
                if (gesture) {
                    this.displayGestureLabel(landmarks, gesture, handedness);
                    alert(gesture);
                }
            });
        }
        
        // Update UI with finger information
        this.updateFingerInfo('right', rightHandFingers);
        this.updateFingerInfo('left', leftHandFingers);
        
        // Update combined finger count and display
        this.updateCombinedCountDisplay(leftHandFingers, rightHandFingers);
        
        // Display debug information if enabled
        if (this.settings.isDebugMode) {
            this.showDebugInfo();
        }
    }
    
    /**
     * Draw the hand landmarks and connections
     */
    drawHandLandmarks(landmarks) {
        // Draw connections between landmarks
        drawConnectors(
            this.ctx, 
            landmarks, 
            HAND_CONNECTIONS, 
            {color: 'rgba(0, 255, 0, 0.8)', lineWidth: 5}
        );
        
        // Draw landmarks with custom coloring
        landmarks.forEach((landmark, index) => {
            // Use different colors for fingertips
            let color = '#FF0000';
            let size = 8;
            
            if (this.fingerTips.includes(index)) {
                color = '#FFFF00';
                size = 12;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(
                landmark.x * this.canvas.width,
                landmark.y * this.canvas.height,
                size,
                0,
                2 * Math.PI
            );
            this.ctx.fillStyle = color;
            this.ctx.fill();
        });
    }
    
    /**
     * Check which fingers are raised in a hand
     */
    checkRaisedFingers(landmarks) {
        const raisedFingers = { count: 0, list: {} };
        
        this.fingerNames.forEach((name, i) => {
            let isRaised = false;
            
            if (i === 0) {  // Thumb has special check
                // Check if thumb is extended to the side
                isRaised = landmarks[this.fingerTips[i]].x < landmarks[this.fingerBaseIndices[i]].x - 0.05;
            } else {
                // For other fingers, check if the tip is higher than the base joint
                isRaised = landmarks[this.fingerTips[i]].y < landmarks[this.fingerBaseIndices[i]].y - 0.07;
            }
            
            raisedFingers.list[name] = isRaised;
            if (isRaised) raisedFingers.count++;
        });
        
        return raisedFingers;
    }
    
    /**
     * Recognize predefined hand gestures based on raised fingers
     */
    recognizeGesture(raisedFingersList) {
        const raisedFingers = Object.entries(raisedFingersList)
            .filter(([_, isRaised]) => isRaised)
            .map(([name, _]) => name);
            
        // Check each gesture definition against current finger state
        for (const [gestureName, gestureData] of Object.entries(this.gestures)) {
            const {requiredFingers, description} = gestureData;
            
            // For gestures requiring specific fingers only
            if (requiredFingers.length === raisedFingers.length && 
                requiredFingers.every(finger => raisedFingers.includes(finger))) {
                return {name: gestureName, description};
            }
        }
        
        return null;
    }
    
    /**
     * Display gesture label above the hand
     */
    displayGestureLabel(landmarks, gesture, handedness) {
        // Find topmost point of the hand
        let minY = 1;
        landmarks.forEach(landmark => {
            if (landmark.y < minY) {
                minY = landmark.y;
            }
        });
        
        // Calculate average X position
        let sumX = 0;
        landmarks.forEach(landmark => {
            sumX += landmark.x;
        });
        const avgX = sumX / landmarks.length;
        
        // Display gesture name
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        
        const text = `${handedness === 'Left' ? 'Right' : 'Left'} Hand: ${gesture.description}`;
        const textWidth = this.ctx.measureText(text).width;
        
        const x = avgX * this.canvas.width - textWidth / 2;
        const y = minY * this.canvas.height - 20;
        
        this.ctx.strokeText(text, x, y);
        this.ctx.fillText(text, x, y);
    }
    
    /**
     * Update UI with finger information
     */
    updateFingerInfo(hand, fingerInfo) {
        const countElement = document.getElementById(`${hand}-fingers-count`);
        const listElement = document.getElementById(`${hand}-fingers-list`);
        
        if (!countElement || !listElement) return;
        
        countElement.textContent = fingerInfo.count;
        
        // Clear previous finger list
        listElement.innerHTML = '';
        
        // Add each finger status to the list
        Object.entries(fingerInfo.list).forEach(([finger, isRaised]) => {
            const fingerElement = document.createElement('div');
            fingerElement.classList.add('finger');
            
            if (isRaised) {
                fingerElement.classList.add('raised');
                fingerElement.textContent = `${this.fingerDisplayNames[finger]}: Raised`;
            } else {
                fingerElement.classList.add('lowered');
                fingerElement.textContent = `${this.fingerDisplayNames[finger]}: Lowered`;
            }
            
            listElement.appendChild(fingerElement);
        });
    }
    
    /**
     * Update combined count display with description
     */
    updateCombinedCountDisplay(leftHandFingers, rightHandFingers) {
        // Calculate combined count
        const combinedCount = leftHandFingers.count + rightHandFingers.count;
        this.combinedCountElement.textContent = combinedCount;
        
        // Create a detailed description of raised fingers
        let combinedDescription = [];
        
        // Helper function to add hand description
        const addHandDescription = (handInfo, handName) => {
            if (handInfo.count > 0) {
                let desc = `${handName} hand: `;
                let raisedFingerNames = [];
                
                Object.entries(handInfo.list).forEach(([finger, isRaised]) => {
                    if (isRaised) {
                        raisedFingerNames.push(this.fingerDisplayNames[finger]);
                    }
                });
                
                desc += raisedFingerNames.join(", ");
                combinedDescription.push(desc);
            }
        };
        
        // Add descriptions for both hands
        addHandDescription(rightHandFingers, 'Right');
        addHandDescription(leftHandFingers, 'Left');
        
        // If no fingers are raised, add a default message
        if (combinedDescription.length === 0) {
            combinedDescription.push("No fingers raised");
        }
        
        // Update the combined info with the description
        const combinedInfoElement = document.getElementById('combined-info');
        
        // Remove any previous description
        const previousDescription = combinedInfoElement.querySelector('.combined-description');
        if (previousDescription) {
            previousDescription.remove();
        }
        
        // Add new description
        const descriptionElement = document.createElement('div');
        descriptionElement.classList.add('combined-description');
        descriptionElement.innerHTML = combinedDescription.join('<br>');
        combinedInfoElement.appendChild(descriptionElement);
    }
    
    /**
     * Show debug information on screen
     */
    showDebugInfo() {
        // Display FPS
        this.ctx.font = '16px monospace';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`FPS: ${Math.round(this.performanceMetrics.frameRate)}`, 10, 20);
        
        // Display processing time
        this.ctx.fillText(`Processing time: ${Math.round(this.performanceMetrics.avgProcessingTime)} ms`, 10, 40);
        
        // Display frame count
        this.ctx.fillText(`Frames: ${this.performanceMetrics.frameCount}`, 10, 60);
        
        // Display settings
        this.ctx.fillText(`Detection confidence: ${this.settings.minDetectionConfidence}`, 10, 80);
        this.ctx.fillText(`Tracking confidence: ${this.settings.minTrackingConfidence}`, 10, 100);
        this.ctx.fillText(`Model complexity: ${this.settings.modelComplexity}`, 10, 120);
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.settings.isDebugMode = !this.settings.isDebugMode;
        return this.settings.isDebugMode;
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create gesture recognizer instance
    const gestureRecognizer = new HandGestureRecognizer();
    
    // Make it accessible from the console for debugging
    window.gestureRecognizer = gestureRecognizer;
});
