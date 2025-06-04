document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const root = document.documentElement;
    const container = document.querySelector('.card-circle-container');
    const languageSelector = document.getElementById('languageSelector'); // Main header language selector

    const detailPageContainer = document.getElementById('detailPageContainer');
    const detailPageTitle = document.getElementById('detailPageTitle');
    const detailPageParagraph = document.getElementById('detailPageParagraph');
    const detailPageTableContent = document.getElementById('detailPageTableContent');
    const detailPageListContent = document.getElementById('detailPageListContent');
    const detailPageBackButton = document.getElementById('detailPageBackButton');
    const languageMenu = document.querySelector('.header-container .language-menu'); // Specific reference to header's language menu

    // --- NEW: Initial Dialog Elements ---
    const initialDialogOverlay = document.getElementById('initialDialogOverlay');
    const initialDialogContent = document.getElementById('initialDialogContent');
    const enterButton = document.getElementById('enterButton');
    const initialLanguageSelector = document.getElementById('initialLanguageSelector'); // New: Selector in the initial dialog
    // --- END NEW ---

    // --- Configuration & State Variables ---
    let allCards = [];
    const numTotalCards = 7;
    let currentRotationDurationMs = 12 * 1000; // Default to 12 seconds per rotation
    let currentRadius = 250; // Initial radius for card positioning
    let slotTransforms = []; // Stores the base CSS transforms for each card's position
    let cardHoverStates = new Map(); // Tracks hover state for each card
    let isAnimationGloballyPaused = true; // IMPORTANT: Start paused by default for the initial dialog
    let focusedCardElement = null; // Stores the currently focused card

    let currentLangData = {}; // To store loaded language JSON
    const loadedLanguages = {}; // Cache for loaded language files

    let currentMovementType = 'centralCircle'; // Default movement type

    // --- Animation Variables (grouped for clarity) ---
    // Heartbeat Animation (Experimental)
    let heartbeatAnimationFrameId = null;
    let heartbeatStartTime = 0;
    const heartbeatAmplitude = 25;
    const heartbeatFrequency = 0.004;
    const heartbeatPhaseOffset = 0.5;

    // Twinkle Animation (Pragmatic)
    let twinkleAnimationFrameId = null;
    let twinkleStartTime = 0;
    const twinkleMinOpacity = 0.2;
    const twinkleMaxOpacity = 1.0;
    const twinkleDurationMs = 2000;
    const twinklePhaseOffset = 0.3;

    // Spiraling Animation Parameters (now hardcoded in JS)
    let spiralingAnimationFrameId = null;
    let spiralingStartTime = 0;
    const spiralingSpeed = 0.0000625; // Base speed, consistent across spirals
    // Hardcoded values for a tighter spiral and no scaling down
    const spiralingRadiusStartFactor = 1.0; // Cards start closer to center
    const spiralingRadiusEndFactor = 0.2;   // Cards end closer to center
    const spiralingTurns = 2;             // Number of turns in the spiral
    const spiralingMinScale = 1.0;        // Prevent scaling down (set to 1.0 for no scaling)
    const spiralingMinOpacity = 1.0;      // Prevent opacity changes (set to 1.0 for no opacity changes)


    // Random Wiggle Animation (Sephorian)
    let randomWiggleAnimationFrameId = null;
    let randomWiggleStartTime = 0;
    const randomWiggleTranslateAmplitude = 10; // Max pixels to move
    const randomWiggleRotateAmplitude = 5; // Max degrees to rotate
    const randomWiggleFrequency = 0.001; // How fast the wiggle happens
    const randomWigglePhaseOffset = 1; // Stagger cards more

    // Container Inclination (for centralCircle)
    let containerInclinationTransform = '';

    // --- Image Paths and Text Colors (Defined directly for local image setup) ---
    // Consider moving this to a separate config file or directly into language JSON if it scales.
    const languageImageStyles = {
        pragmatic: {
            text: '#FFFFFF',
            imagePaths: [
                'images/pragmatic/card1.jpeg', 'images/pragmatic/card2.jpeg', 'images/pragmatic/card1.jpeg',
                'images/pragmatic/card2.jpeg', 'images/pragmatic/card1.jpeg', 'images/pragmatic/card2.jpeg', 'images/pragmatic/card1.jpeg'
            ]
        },
        talmudic: {
            text: '#FFFFFF',
            imagePaths: [
                'images/talmudic/card1.jpeg', 'images/talmudic/card2.jpeg', 'images/talmudic/card1.jpeg',
                'images/talmudic/card2.jpeg', 'images/talmudic/card1.jpeg', 'images/talmudic/card2.jpeg', 'images/talmudic/card1.jpeg'
            ]
        },
        zoharian: {
            text: '#FFFFFF',
            imagePaths: [
                'images/zoharian/card1.jpeg', 'images/zoharian/card2.jpeg', 'images/zoharian/card1.jpeg',
                'images/zoharian/card2.jpeg', 'images/zoharian/card1.jpeg', 'images/zoharian/card2.jpeg', 'images/zoharian/card1.jpeg'
            ]
        },
        sephorian: {
            text: '#000000',
            imagePaths: [
                'images/sephorian/card1.jpeg', 'images/sephorian/card2.jpeg', 'images/sephorian/card1.jpeg',
                'images/sephorian/card2.jpeg', 'images/sephorian/card1.jpeg', 'images/sephorian/card2.jpeg', 'images/sephorian/card1.jpeg'
            ]
        },
        experimental: {
            text: '#FFFFFF',
            imagePaths: [
                'images/experimental/card1.jpeg', 'images/experimental/card2.jpeg', 'images/experimental/card1.jpeg',
                'images/experimental/card2.jpeg', 'images/experimental/card1.jpeg', 'images/experimental/card2.jpeg', 'images/experimental/card1.jpeg'
            ]
        }
    };

    // --- Helper Functions ---

    /**
     * Converts a hexadecimal color string to an RGB object.
     * @param {string} hex - The hexadecimal color string (e.g., "#RRGGBB" or "#RGB").
     * @returns {object|null} An object with r, g, b properties, or null if invalid hex.
     */
    function hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return null;
        let r = 0, g = 0, b = 0;
        // Handle shorthand hex codes (e.g., #FFF)
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) { // Handle full hex codes (e.g., #FFFFFF)
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return { r, g, b };
    }

    /**
     * Shuffles an array in place using the Fisher-Yates (Knuth) algorithm.
     * @param {Array} array - The array to shuffle.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Stops all active continuous animation frame loops.
     */
    function stopAllContinuousAnimations() {
        if (heartbeatAnimationFrameId) { cancelAnimationFrame(heartbeatAnimationFrameId); heartbeatAnimationFrameId = null; }
        if (twinkleAnimationFrameId) { cancelAnimationFrame(twinkleAnimationFrameId); twinkleAnimationFrameId = null; }
        if (spiralingAnimationFrameId) { cancelAnimationFrame(spiralingAnimationFrameId); spiralingAnimationFrameId = null; }
        if (randomWiggleAnimationFrameId) { cancelAnimationFrame(randomWiggleAnimationFrameId); randomWiggleAnimationFrameId = null; }
        // Ensure opacity is reset if twinkle was active
        allCards.forEach(card => card.style.opacity = 1);
    }

    /**
     * Starts the continuous animation based on the currentMovementType.
     */
    function startCurrentContinuousAnimation() {
        stopAllContinuousAnimations(); // Ensure no other animation is running before starting a new one
        if (currentMovementType === 'horizontalHeartbeat') {
            heartbeatStartTime = performance.now();
            startHeartbeatAnimation();
        } else if (currentMovementType === 'twinkle') {
            twinkleStartTime = performance.now();
            startTwinkleAnimation();
        } else if (currentMovementType === 'spiraling') {
            spiralingStartTime = performance.now();
            startSpiralingAnimation();
        } else if (currentMovementType === 'randomWiggle') {
            randomWiggleStartTime = performance.now();
            startRandomWiggleAnimation();
        }
    }

    // --- Language Data Loading & UI Updates ---

    /**
     * Loads language data from a JSON file. Caches loaded languages.
     * Updates the UI once the language data is loaded.
     * @param {string} langKey - The key for the language (e.g., 'pragmatic').
     */
    async function loadLanguage(langKey) {
        if (loadedLanguages[langKey]) {
            currentLangData = loadedLanguages[langKey];
            updateUIWithLanguageData();
            return;
        }

        try {
            const response = await fetch(`lang/${langKey}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${langKey}.json (status: ${response.status})`);
            }
            const data = await response.json();
            currentLangData = data;
            loadedLanguages[langKey] = data;
            updateUIWithLanguageData();
        } catch (error) {
            console.error("Error loading language data:", error);
            // Fallback for card fronts if language loading fails
            allCards.forEach(card => {
                const front = card.querySelector('.card-front');
                if (front) front.textContent = 'Language Error';
            });
        }
    }

    /**
     * Updates various UI elements based on the loaded language data.
     */
    function updateUIWithLanguageData() {
        if (!currentLangData || Object.keys(currentLangData).length === 0) {
            console.warn("No language data loaded to update UI.");
            return;
        }

        const themeConfig = currentLangData.themeConfig;
        if (themeConfig) {
            document.body.style.fontFamily = themeConfig.fontFamily;
            if (themeConfig.backgroundImage) {
                document.body.style.backgroundImage = themeConfig.backgroundImage;
                document.body.style.backgroundColor = 'transparent';
            } else {
                document.body.style.backgroundColor = themeConfig.backgroundColor;
                document.body.style.backgroundImage = '';
            }

            root.style.setProperty('--theme-primary-color', themeConfig.primaryColor);
            root.style.setProperty('--theme-secondary-color', themeConfig.secondaryColor);
            root.style.setProperty('--theme-text-color', themeConfig.textColor);
            root.style.setProperty('--theme-header-color', themeConfig.headerColor);
            root.style.setProperty('--theme-card-back-color', themeConfig.cardBackColor || '#1e293b');

            const primaryRgb = hexToRgb(themeConfig.primaryColor);
            const secondaryRgb = hexToRgb(themeConfig.secondaryColor);
            if (primaryRgb) root.style.setProperty('--theme-primary-color-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
            if (secondaryRgb) root.style.setProperty('--theme-secondary-color-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);

            // Update movement type and handle container inclination
            currentMovementType = themeConfig.movementType || 'centralCircle';
            // No inclination for any movement type, including centralCircle
            containerInclinationTransform = '';
        }

        updateCardAppearance(languageSelector.value); // Use the main language selector's value for appearance
        updateSlotTransforms(); // Recalculate card positions for the new movement type
        applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0)); // Apply new transforms

        // Continuous animation is started later, after the initial dialog is dismissed
    }

    /**
     * Creates the initial card elements and attaches event listeners.
     */
    function createCards() {
        if (allCards.length > 0) return; // Prevent recreation if already called
        for (let i = 1; i <= numTotalCards; i++) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.id = i;

            const flipper = document.createElement('div');
            flipper.classList.add('card-flipper');

            const frontFace = document.createElement('div');
            frontFace.classList.add('card-face', 'card-front');

            const backFace = document.createElement('div');
            backFace.classList.add('card-face', 'card-back');

            const backH3 = document.createElement('h3');
            const backP = document.createElement('p');
            const learnMoreLink = document.createElement('a');
            learnMoreLink.classList.add('learn-more-link');
            learnMoreLink.href = "#";
            learnMoreLink.dataset.cardId = i;

            backFace.append(backH3, backP, learnMoreLink); // Use append for multiple elements
            flipper.append(frontFace, backFace);
            card.appendChild(flipper);
            container.appendChild(card);
            allCards.push(card);
            cardHoverStates.set(card, false);

            // Event listener for card clicks (handles both card focus and 'learn more' link)
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('learn-more-link')) {
                    e.stopPropagation(); // Prevent card click from also triggering focus/unfocus
                    const cardId = parseInt(e.target.dataset.cardId, 10);
                    showDetailPage(cardId);
                } else {
                    handleCardClick(card);
                }
            });
        }
    }

    /**
     * Updates the text content, images, and colors of all cards based on current language.
     * @param {string} languageKey - The key of the currently selected language.
     */
    function updateCardAppearance(languageKey) {
        if (!currentLangData || !currentLangData.cardFrontTexts || !currentLangData.cardBackContents) {
            console.warn("Missing language data for card appearance update.");
            return;
        }

        const frontTexts = currentLangData.cardFrontTexts;
        const backContent = currentLangData.cardBackContents;
        // Use default 'pragmatic' if the languageKey is not found in languageImageStyles
        const imageStyleInfo = languageImageStyles[languageKey] || languageImageStyles.pragmatic;
        const learnMoreText = currentLangData.learnMoreLinkText;

        allCards.forEach((card, index) => {
            const cardId = parseInt(card.dataset.id, 10);
            const frontFace = card.querySelector('.card-front');
            const backFace = card.querySelector('.card-back');
            const actualBackH3 = backFace?.querySelector('h3'); // Optional chaining for safer access
            const actualBackP = backFace?.querySelector('p');
            const actualLink = backFace?.querySelector('.learn-more-link');

            const cardIdText = frontTexts[cardId - 1] || `Card ${cardId}`; // Fallback text

            if (frontFace) {
                frontFace.textContent = cardIdText;
                frontFace.style.color = imageStyleInfo.text;

                if (imageStyleInfo.imagePaths?.[index]) { // Optional chaining for imagePaths
                    frontFace.style.backgroundImage = `url('${imageStyleInfo.imagePaths[index]}')`;
                    frontFace.style.backgroundColor = 'transparent';
                    frontFace.style.backgroundSize = 'cover';
                    frontFace.style.backgroundPosition = 'center';
                    frontFace.style.backgroundRepeat = 'no-repeat';
                } else {
                    frontFace.style.backgroundImage = 'none';
                    frontFace.style.backgroundColor = '#4A5568';
                }
            }
            if (actualBackH3 && actualBackP && cardId > 0 && cardId <= backContent.length) {
                actualBackH3.textContent = backContent[cardId - 1].title;
                actualBackP.textContent = backContent[cardId - 1].p;
            }
            if (actualLink) actualLink.textContent = learnMoreText;
        });
    }

    // --- Card Movement Type Layout Functions ---

    /**
     * Calculates transforms for cards in a central circle layout.
     * @param {number} radius - The radius of the circle.
     * @returns {string[]} An array of CSS transform strings.
     */
    function layoutCentralCircle(radius) {
        const transforms = [`translateX(0px) translateY(0px)`]; // Center card
        const numOuterSlots = numTotalCards - 1; // Assuming 1 center card
        if (numOuterSlots > 0) {
            for (let i = 0; i < numOuterSlots; i++) {
                const angle = (360 / numOuterSlots) * i;
                transforms.push(`rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)`);
            }
        }
        return transforms;
    }

    /**
     * Calculates transforms for cards in a horizontal heartbeat layout.
     * @param {number} radius - Not directly used, but kept for consistent signature.
     * @returns {string[]} An array of CSS transform strings.
     */
    function layoutHorizontalHeartbeat(radius) {
        const transforms = [];
        // Get actual card width from the first card, fallback to a default
        const cardWidth = allCards.length > 0 ? allCards[0].offsetWidth : 150;
        const containerWidth = container.offsetWidth || 600;

        let gap = 0;
        const minOverlap = cardWidth * 0.05;
        const maxGap = 50;

        if (numTotalCards > 1) {
            gap = (containerWidth - (numTotalCards * cardWidth)) / (numTotalCards - 1);
            if (gap < -minOverlap) {
                gap = -minOverlap;
            }
            if (gap > maxGap) {
                gap = maxGap;
            }
        }

        const effectiveStep = cardWidth + gap;
        const totalOccupiedWidth = (numTotalCards - 1) * effectiveStep + cardWidth;
        const startX = -totalOccupiedWidth / 2 + cardWidth / 2;

        for (let i = 0; i < numTotalCards; i++) {
            const x = startX + (i * effectiveStep);
            transforms.push(`translateX(${x}px) translateY(0px)`);
        }
        return transforms;
    }

    /**
     * Calculates transforms for cards in a spiraling layout.
     * Uses hardcoded spiralingTurns and spiralingRadiusEndFactor.
     * @param {number} radius - The base radius for the spiral.
     * @returns {string[]} An array of CSS transform strings.
     */
    function layoutSpiraling(radius) {
        const transforms = [];
        const baseRadius = radius * 0.8;
        const turns = spiralingTurns; // Use hardcoded turns
        const angleStep = (2 * Math.PI * turns) / numTotalCards;
        // Use hardcoded radius end factor
        const radiusStep = (baseRadius * (1 - spiralingRadiusEndFactor)) / numTotalCards;

        for (let i = 0; i < numTotalCards; i++) {
            const currentAngle = i * angleStep;
            const currentRadius = baseRadius - (i * radiusStep);
            const x = currentRadius * Math.cos(currentAngle);
            const y = currentRadius * Math.sin(currentAngle);
            transforms.push(`translateX(${x}px) translateY(${y}px)`);
        }
        return transforms;
    }

    /**
     * Calculates transforms for cards in a random wiggle layout, attempting non-overlapping placement.
     * Dynamically gets card dimensions for more accurate placement.
     * @param {number} radius - Not directly used, but kept for consistent signature.
     * @returns {string[]} An array of CSS transform strings.
     */
    function layoutRandomWiggle(radius) {
        const transforms = [];
        const containerWidth = container.offsetWidth || 600;
        const containerHeight = container.offsetHeight || 600;

        // --- IMPROVEMENT: Dynamically get card dimensions ---
        // Ensure allCards has at least one card before trying to get dimensions
        const cardWidth = allCards.length > 0 ? allCards[0].offsetWidth : 150; // Fallback if no cards yet
        const cardHeight = allCards.length > 0 ? allCards[0].offsetHeight : 220; // Fallback if no cards yet
        // --- END IMPROVEMENT ---

        const safePadding = 30; // This padding might still need adjustment based on overall design
        const effectiveWidth = containerWidth - 2 * safePadding;
        const effectiveHeight = containerHeight - 2 * safePadding;

        const gridCols = Math.max(1, Math.floor(effectiveWidth / cardWidth));
        const gridRows = Math.max(1, Math.floor(effectiveHeight / cardHeight));

        const possibleSlots = [];
        if (gridCols > 0 && gridRows > 0) {
            const actualCellWidth = effectiveWidth / gridCols;
            const actualCellHeight = effectiveHeight / gridRows;

            for (let r = 0; r < gridRows; r++) {
                for (let c = 0; c < gridCols; c++) {
                    // Calculate center of the cell relative to container's center
                    const x = c * actualCellWidth + actualCellWidth / 2 - containerWidth / 2;
                    const y = r * actualCellHeight + actualCellHeight / 2 - containerHeight / 2;
                    possibleSlots.push({ x, y });
                }
            }
        }

        if (possibleSlots.length < numTotalCards) {
            console.warn(`Not enough non-overlapping slots (${possibleSlots.length}) for ${numTotalCards} cards in Random Wiggle. Cards might overlap.`);
            // Fallback to purely random if not enough calculated slots
            for (let i = 0; i < numTotalCards; i++) {
                const randomX = Math.random() * (containerWidth - cardWidth) - (containerWidth / 2 - cardWidth / 2);
                const randomY = Math.random() * (containerHeight - cardHeight) - (containerHeight / 2 - cardHeight / 2);
                transforms.push(`translateX(${randomX}px) translateY(${randomY}px)`);
            }
        } else {
            shuffleArray(possibleSlots);
            const selectedSlots = possibleSlots.slice(0, numTotalCards);
            selectedSlots.forEach(slot => {
                transforms.push(`translateX(${slot.x}px) translateY(${slot.y}px)`);
            });
        }
        return transforms;
    }

    /**
     * Determines the current radius based on screen width and dispatches to the correct layout function.
     * Updates `slotTransforms` based on the current movement type.
     */
    function updateSlotTransforms() {
        const screenWidth = window.innerWidth;
        // Adjust radius based on screen size for responsiveness
        if (screenWidth <= 480) { currentRadius = 120; }
        else if (screenWidth <= 768) { currentRadius = 180; }
        else { currentRadius = 250; }

        let effectiveRadius = currentRadius; // Can be modified by specific layouts if needed

        // Choose layout function based on currentMovementType
        switch (currentMovementType) {
            case 'centralCircle':
                slotTransforms = layoutCentralCircle(effectiveRadius);
                break;
            case 'horizontalHeartbeat':
                slotTransforms = layoutHorizontalHeartbeat(effectiveRadius);
                break;
            case 'spiraling':
                slotTransforms = layoutSpiraling(effectiveRadius);
                break;
            case 'randomWiggle':
                slotTransforms = layoutRandomWiggle(effectiveRadius);
                break;
            default:
                console.warn(`Unknown movement type: ${currentMovementType}. Falling back to centralCircle.`);
                slotTransforms = layoutCentralCircle(effectiveRadius);
                break;
        }

        // Reset container rotation if not centralCircle
        if (currentMovementType !== 'centralCircle') {
            container.style.transform = ''; // Clear previous transform
            container.dataset.currentRotation = "0";
        }
    }

    /**
     * Applies the base transforms and hover effects to all cards.
     * Also applies active continuous animation offsets.
     * @param {number} [containerCurrentAngle=0] - The current rotation angle of the container.
     */
    function applyCardBaseTransformsAndHover(containerCurrentAngle = 0) {
        // If animation is globally paused and a card is focused, only apply transforms to non-focused cards
        // to keep them out of the way, and exit.
        if (isAnimationGloballyPaused && focusedCardElement && detailPageContainer.classList.contains('hidden')) {
            allCards.forEach(card => {
                if (card === focusedCardElement) return; // Skip focused card
                card.classList.remove('is-hovered'); // Ensure hover state is removed
                const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
                // Reapply base transform with inverse container rotation
                card.style.transform = `${baseTransform} rotate(${-containerCurrentAngle}deg)`;
            });
            return; // Exit as focused card logic will handle its own transform
        }

        // If detail page is open, no card animations should run
        if (!detailPageContainer.classList.contains('hidden')) return;

        allCards.forEach((card, index) => {
            if (card === focusedCardElement) { // Skip focused card as it's handled by focusCard()
                card.classList.remove('is-hovered'); // Ensure hover state is removed
                return;
            }

            const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
            const rotationTransform = (currentMovementType === 'centralCircle') ? `rotate(${-containerCurrentAngle}deg)` : '';

            let heartbeatOffset = 0;
            if (currentMovementType === 'horizontalHeartbeat') {
                const time = (performance.now() - heartbeatStartTime) * heartbeatFrequency;
                heartbeatOffset = heartbeatAmplitude * Math.sin(time + index * heartbeatPhaseOffset);
            }

            let twinkleOpacityOffset = 1; // Default to full opacity
            if (currentMovementType === 'twinkle') {
                const time = (performance.now() - twinkleStartTime) / twinkleDurationMs * Math.PI * 2;
                const normalizedOscillation = (Math.cos(time + index * twinklePhaseOffset) + 1) / 2; // 0 to 1
                twinkleOpacityOffset = twinkleMinOpacity + (twinkleMaxOpacity - twinkleMinOpacity) * normalizedOscillation;
            }

            let spiralingOffsetTransform = '';
            let finalScale = 1; // Default scale for all cards
            let finalOpacity = 1; // Default opacity for all cards

            if (currentMovementType === 'spiraling') {
                const time = (performance.now() - spiralingStartTime) * spiralingSpeed;
                const currentAngle = time + index * (2 * Math.PI / numTotalCards);
                const progressIntoSpiral = (time % (2 * Math.PI)) / (2 * Math.PI);
                const animatedRadius = currentRadius * (spiralingRadiusStartFactor - (spiralingRadiusStartFactor - spiralingRadiusEndFactor) * progressIntoSpiral);

                const x = animatedRadius * Math.cos(currentAngle);
                const y = animatedRadius * Math.sin(currentAngle);
                spiralingOffsetTransform = `translateX(${x}px) translateY(${y}px)`;

                // Apply spiraling specific scale and opacity
                finalScale = spiralingMinScale + (1 - spiralingMinScale) * (1 - progressIntoSpiral);
                finalOpacity = spiralingMinOpacity + (1 - spiralingMinOpacity) * (1 - progressIntoSpiral);
            }

            let randomWiggleTranslateOffset = { x: 0, y: 0 };
            let randomWiggleRotateOffset = 0;
            if (currentMovementType === 'randomWiggle') {
                const time = (performance.now() - randomWiggleStartTime) * randomWiggleFrequency;
                randomWiggleTranslateOffset.x = randomWiggleTranslateAmplitude * Math.sin(time + index * randomWigglePhaseOffset);
                randomWiggleTranslateOffset.y = randomWiggleTranslateAmplitude * Math.cos(time + index * randomWigglePhaseOffset * 1.2);
                randomWiggleRotateOffset = randomWiggleRotateAmplitude * Math.sin(time + index * randomWigglePhaseOffset * 0.8);
            }

            // Apply hover class (managed by map, but ensure class is set/removed)
            card.classList.toggle('is-hovered', cardHoverStates.get(card));

            // Apply hover scale if card is hovered
            if (cardHoverStates.get(card)) {
                finalScale *= 1.05; // Apply hover scale on top of any other scale
            }

            // Combine all transforms
            card.style.transform = `
                ${baseTransform}
                ${rotationTransform}
                translateX(${heartbeatOffset + randomWiggleTranslateOffset.x}px)
                translateY(${heartbeatOffset + randomWiggleTranslateOffset.y}px)
                rotate(${randomWiggleRotateOffset}deg)
                ${spiralingOffsetTransform}
                scale(${finalScale})
            `.replace(/\s+/g, ' ').trim(); // Clean up extra spaces

            // Apply opacity based on movement type
            if (currentMovementType === 'twinkle') {
                card.style.opacity = twinkleOpacityOffset;
            } else if (currentMovementType === 'spiraling') {
                card.style.opacity = finalOpacity; // Use finalOpacity for spiraling
            } else {
                card.style.opacity = 1; // Ensure full opacity for other movement types
            }
        });
    }

    /**
     * Initializes card positions and loads initial language data.
     */
    async function initializeCardPositions() {
        updateSlotTransforms(); // Determine base positions for cards
        const currentContainerAngle = parseFloat(container.dataset.currentRotation || 0);
        allCards.forEach((card, index) => {
            // Assign base transform from calculated slots
            card.dataset.slotTransform = slotTransforms[index % numTotalCards];
        });
        applyCardBaseTransformsAndHover(currentContainerAngle); // Apply initial transforms
    }

    /**
     * Repositions all cards, potentially shuffling them and animating the move.
     * @returns {Promise<void>} A promise that resolves when repositioning animation is complete.
     */
    function repositionAllCards() {
        return new Promise(resolve => {
            shuffleArray(allCards); // Shuffle the array of card elements
            allCards.forEach((card, index) => {
                // Apply a temporary, faster transition for the repositioning
                card.style.transition = 'transform 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                // Assign new slot transform after shuffle
                card.dataset.slotTransform = slotTransforms[index];
            });
            // After a short delay, apply the base transforms, which will trigger the transition
            setTimeout(() => {
                allCards.forEach(card => {
                    // Revert to the default transition for subsequent animations/hovers
                    card.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease, background-color 0.4s ease, color 0.4s ease';
                });
                applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0));
                resolve();
            }, 700); // Match this delay with the transition duration
        });
    }

    // --- Detail Page Management ---

    /**
     * Displays the detail page for a given card ID.
     * Pauses main animations and hides main card container.
     * @param {number} cardId - The ID of the card to display details for.
     */
    function showDetailPage(cardId) {
        detailPageParagraph.classList.add('hidden');
        detailPageTableContent.classList.add('hidden');
        detailPageListContent.classList.add('hidden');
        detailPageContainer.style.display = 'flex'; // Ensure container is flex for layout

        // Populate detail page content
        const cardDetail = currentLangData.detailPageContent?.[cardId - 1]; // Optional chaining for safer access
        if (!cardDetail) {
            console.error(`Detail page content not found for card ID: ${cardId}`);
            detailPageTitle.textContent = `Details for Card ${cardId}`;
            detailPageParagraph.textContent = "Content loading or unavailable.";
            detailPageParagraph.classList.remove('hidden');
        } else {
            detailPageTitle.textContent = cardDetail.title || `Details for Card ${cardId}`;
            detailPageParagraph.textContent = cardDetail.paragraph || "No detailed paragraph available.";
            detailPageParagraph.classList.remove('hidden');

            switch (cardDetail.type) {
                case 'table':
                    detailPageTableContent.classList.remove('hidden');
                    populateTable(cardDetail.tableData);
                    break;
                case 'list':
                    detailPageListContent.classList.remove('hidden');
                    populateList(cardDetail.listItems);
                    break;
                case 'text':
                    // Text is handled by detailPageParagraph already
                    break;
                default:
                    console.warn(`Unknown detail page type: ${cardDetail.type} for card ID: ${cardId}`);
                    break;
            }
        }

        // Update back button text
        detailPageBackButton.textContent = currentLangData.detailPageBackButtonText || "Back";

        detailPageContainer.classList.remove('hidden');
        container.style.display = 'none'; // Hide main card container
        // Only hide focused card if it exists and is not the current detail page itself
        if (focusedCardElement) focusedCardElement.style.display = 'none';
        languageMenu.style.display = 'none'; // Hide language selector
        isAnimationGloballyPaused = true; // Pause all main animations
        stopAllContinuousAnimations(); // Explicitly stop active continuous animations
    }

    /**
     * Populates the detail page table with provided data.
     * @param {object} tableData - Object containing headers and rows.
     */
    function populateTable(tableData) {
        const table = detailPageTableContent.querySelector('table');
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = ''; // Clear previous content
        tbody.innerHTML = ''; // Clear previous content

        if (tableData.headers && tableData.headers.length > 0) {
            const headerRow = document.createElement('tr');
            tableData.headers.forEach(headerText => {
                const th = document.createElement('th');
                th.classList.add('border', 'border-gray-300', 'p-2', 'text-left');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
        }

        if (tableData.rows && tableData.rows.length > 0) {
            tableData.rows.forEach(rowData => {
                const tr = document.createElement('tr');
                rowData.forEach(cellData => {
                    const td = document.createElement('td');
                    td.classList.add('border', 'border-gray-300', 'p-2');
                    td.textContent = cellData;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
    }

    /**
     * Populates the detail page list with provided items.
     * @param {string[]} listItems - An array of list item strings.
     */
    function populateList(listItems) {
        const ul = detailPageListContent.querySelector('ul');
        if (!ul) return;

        ul.innerHTML = ''; // Clear previous content

        if (listItems && listItems.length > 0) {
            listItems.forEach(itemText => {
                const li = document.createElement('li');
                li.textContent = itemText;
                ul.appendChild(li);
            });
        }
    }

    /**
     * Hides the detail page and restores the main card view.
     * Restarts continuous animations.
     */
    function hideDetailPage() {
        detailPageContainer.classList.add('hidden');
        detailPageContainer.style.display = ''; // Revert display style

        container.style.display = 'flex'; // Show main container
        if (focusedCardElement) focusedCardElement.style.display = 'flex'; // Show the previously focused card
        languageMenu.style.display = 'block'; // Show language selector (now always visible)
        unfocusCard(); // Unfocus the card

        // Clear detail page content for next use
        detailPageParagraph.classList.add('hidden');
        detailPageTableContent.classList.add('hidden');
        detailPageListContent.classList.add('hidden');
        detailPageTitle.textContent = '';
        detailPageParagraph.textContent = '';
        detailPageTableContent.querySelector('thead').innerHTML = '';
        detailPageTableContent.querySelector('tbody').innerHTML = '';
        detailPageListContent.querySelector('ul').innerHTML = '';

        // Restart the appropriate continuous animation
        startCurrentContinuousAnimation();
    }

    // --- Card Focus/Unfocus Logic ---

    /**
     * Handles a click event on a card, toggling its focused state.
     * @param {HTMLElement} cardElement - The card element that was clicked.
     */
    function handleCardClick(cardElement) {
        if (!detailPageContainer.classList.contains('hidden')) return; // Ignore clicks if detail page is open
        if (focusedCardElement && focusedCardElement !== cardElement) return; // Ignore clicks on other cards if one is already focused

        if (focusedCardElement === cardElement) {
            unfocusCard(); // Unfocus if clicking the same card again
        } else {
            focusCard(cardElement); // Focus the clicked card
        }
    }

    /**
     * Focuses a specific card, scaling it up and flipping it.
     * Pauses global animation.
     * @param {HTMLElement} cardElement - The card element to focus.
     */
    function focusCard(cardElement) {
        if (isAnimationGloballyPaused && focusedCardElement) return; // Prevent focusing if already paused and focused
        isAnimationGloballyPaused = true; // Pause main animation loop
        focusedCardElement = cardElement; // Set the focused card

        cardElement.classList.add('card-focused'); // Apply focused styles
        // Calculate rotation for centralCircle to keep focused card upright
        const currentContainerAngle = parseFloat(container.dataset.currentRotation || 0);
        const rotationZ = (currentMovementType === 'centralCircle') ? `rotateZ(${-currentContainerAngle}deg)` : '';
        cardElement.style.transform = `${rotationZ} translate(0px, 0px) scale(1.8) rotateY(0deg)`; // Apply focus transform

        // Flip the card after a short delay for visual effect
        setTimeout(() => {
            if (focusedCardElement === cardElement) { // Ensure the same card is still focused
                cardElement.classList.add('is-flipped');
            }
        }, 50);
    }

    /**
     * Unfocuses the currently focused card, reverting it to its original state.
     * Resumes global animation.
     */
    function unfocusCard() {
        if (!focusedCardElement) return; // Nothing to unfocus

        const cardToUnfocus = focusedCardElement;
        cardToUnfocus.classList.remove('is-flipped'); // Unflip the card

        // Revert card styles after unflip animation
        setTimeout(() => {
            cardToUnfocus.classList.remove('card-focused'); // Remove focused styles
            const currentContainerAngle = parseFloat(container.dataset.currentRotation || 0);
            const baseTransform = cardToUnfocus.dataset.slotTransform || 'translateX(0px) translateY(0px)';
            const rotationTransform = (currentMovementType === 'centralCircle') ? `rotate(${-currentContainerAngle}deg)` : '';
            cardToUnfocus.style.transform = `${baseTransform} ${rotationTransform}`; // Reapply base position

            // Only clear focusedCardElement and unpause if this was the last focused card
            if (focusedCardElement === cardToUnfocus) {
                focusedCardElement = null;
                isAnimationGloballyPaused = false; // Resume main animation loop
            }
        }, 300); // Match this delay with the unflip transition duration
    }

    // --- Continuous Animation Loop Functions ---

    /**
     * Starts the Twinkle animation loop for card opacity.
     */
    function startTwinkleAnimation() {
        if (twinkleAnimationFrameId) cancelAnimationFrame(twinkleAnimationFrameId); // Clear any existing loop
        twinkleStartTime = performance.now(); // Reset start time for animation calculation

        function animateTwinkle() {
            // Stop condition: paused, detail page open, or movement type changed
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'twinkle') {
                twinkleAnimationFrameId = null;
                allCards.forEach(card => card.style.opacity = 1); // Reset opacity when stopped
                return;
            }
            applyCardBaseTransformsAndHover(0); // Update transforms (specifically opacity)
            twinkleAnimationFrameId = requestAnimationFrame(animateTwinkle);
        }
        twinkleAnimationFrameId = requestAnimationFrame(animateTwinkle);
    }

    /**
     * Starts the Heartbeat animation loop for vertical card movement.
     */
    function startHeartbeatAnimation() {
        if (heartbeatAnimationFrameId) cancelAnimationFrame(heartbeatAnimationFrameId);
        heartbeatStartTime = performance.now();

        function animateHeartbeat() {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'horizontalHeartbeat') {
                heartbeatAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            heartbeatAnimationFrameId = requestAnimationFrame(animateHeartbeat);
        }
        heartbeatAnimationFrameId = requestAnimationFrame(animateHeartbeat);
    }

    /**
     * Starts the Spiraling animation loop for card position, scale, and opacity.
     */
    function startSpiralingAnimation() {
        if (spiralingAnimationFrameId) cancelAnimationFrame(spiralingAnimationFrameId);
        spiralingStartTime = performance.now();

        function animateSpiraling() {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'spiraling') {
                spiralingAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            spiralingAnimationFrameId = requestAnimationFrame(animateSpiraling);
        }
        spiralingAnimationFrameId = requestAnimationFrame(animateSpiraling);
    }

    /**
     * Starts the Random Wiggle animation loop for card translation and rotation.
     */
    function startRandomWiggleAnimation() {
        if (randomWiggleAnimationFrameId) cancelAnimationFrame(randomWiggleAnimationFrameId);
        randomWiggleStartTime = performance.now();

        function animateRandomWiggle() {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'randomWiggle') {
                randomWiggleAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            randomWiggleAnimationFrameId = requestAnimationFrame(animateRandomWiggle);
        }
        randomWiggleAnimationFrameId = requestAnimationFrame(animateRandomWiggle);
    }

    /**
     * Animates the main container's rotation (used for centralCircle).
     * @param {number} targetRotationDegrees - The target rotation angle in degrees.
     * @param {number} durationMs - The duration of the animation in milliseconds.
     * @returns {Promise<void>} A promise that resolves when the animation is complete.
     */
    async function animateContainerRotation(targetRotationDegrees, durationMs) {
        return new Promise(resolve => {
            const startAngle = parseFloat(container.dataset.currentRotation || 0);
            const startTime = performance.now();
            let animationFrameId;

            function step(currentTime) {
                // Stop condition: paused or detail page open
                if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden')) {
                    cancelAnimationFrame(animationFrameId);
                    resolve();
                    return;
                }

                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / durationMs, 1);

                if (currentMovementType === 'centralCircle') {
                    const currentAngle = startAngle + (targetRotationDegrees - startAngle) * progress;
                    container.style.transform = `${containerInclinationTransform} rotate(${currentAngle}deg)`;
                    container.dataset.currentRotation = currentAngle;
                    applyCardBaseTransformsAndHover(currentAngle);
                } else {
                    // If movement type changes during rotation, ensure cards are updated
                    applyCardBaseTransformsAndHover(0);
                }

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(step);
                } else {
                    // Final state ensures exact target rotation is hit
                    if (currentMovementType === 'centralCircle') {
                        container.style.transform = `${containerInclinationTransform} rotate(${targetRotationDegrees}deg)`;
                        // Store angle normalized to 0-360 for consistency
                        container.dataset.currentRotation = (targetRotationDegrees % 360 + 360) % 360;
                        applyCardBaseTransformsAndHover(targetRotationDegrees);
                    } else {
                        applyCardBaseTransformsAndHover(0);
                    }
                    resolve();
                }
            }
            animationFrameId = requestAnimationFrame(step);
        });
    }

    // --- Main Animation Sequence Loop ---

    /**
     * The main animation loop that orchestrates card movements and theme cycles.
     */
    async function animationSequence() {
        // Attach hover event listeners (ensure this is only done once)
        if (allCards.length > 0 && !allCards[0].dataset.listenersAttached) { // Simple flag to prevent re-attaching
            allCards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    if (!isAnimationGloballyPaused) cardHoverStates.set(card, true);
                });
                card.addEventListener('mouseleave', () => {
                    if (!isAnimationGloballyPaused) cardHoverStates.set(card, false);
                });
                card.dataset.listenersAttached = 'true'; // Mark as attached
            });
        }

        // The infinite animation loop
        while (true) {
            // Handle global pause state
            if (isAnimationGloballyPaused) {
                stopAllContinuousAnimations(); // Stop any active continuous animation
                // Wait until unpaused
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (!isAnimationGloballyPaused) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
                startCurrentContinuousAnimation(); // Restart if applicable after unpause
            }

            // Always apply base transforms and hover effects
            applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0));

            const cycleDuration = currentRotationDurationMs;

            // Perform animation cycle based on movement type
            if (currentMovementType === 'centralCircle') {
                const randomDirection = Math.random() < 0.5 ? 1 : -1;
                let currentAngle = parseFloat(container.dataset.currentRotation || 0);
                const targetAngle = currentAngle + (360 * randomDirection);
                await animateContainerRotation(targetAngle, cycleDuration);
            } else {
                // For continuous animations not managed by animateContainerRotation,
                // just wait for the cycle duration before repositioning.
                // The animation frame loops (e.g., heartbeat, twinkle) will continue
                // updating card transforms within this wait period.
                await new Promise(r => setTimeout(r, cycleDuration));
            }

            if (isAnimationGloballyPaused) continue; // Skip repositioning if paused during the cycle

            // Reset container rotation for centralCircle before repositioning
            if (currentMovementType === 'centralCircle') {
                container.style.transition = 'none'; // Disable transition for instant reset
                container.style.transform = `${containerInclinationTransform} rotate(0deg)`;
                container.dataset.currentRotation = "0";
                applyCardBaseTransformsAndHover(0);
                await new Promise(r => setTimeout(r, 50)); // Small delay for browser repaint
            }

            if (isAnimationGloballyPaused) continue; // Skip if paused after reset

            await repositionAllCards(); // Shuffle and reposition cards
            await new Promise(r => setTimeout(r, 500)); // Small pause before next cycle
        }
    }

    // --- Event Listeners ---

    // Main header language selector change
    languageSelector.addEventListener('change', async (event) => {
        // Stop any currently running animations before loading new language which will start relevant ones
        stopAllContinuousAnimations();
        await loadLanguage(event.target.value);
        // Force immediate layout update for the new language
        await repositionAllCards();
    });

    // Back button on detail page
    detailPageBackButton.addEventListener('click', hideDetailPage);

    // Window resize handler
    window.addEventListener('resize', () => {
        // Recalculate and reapply card positions on resize
        // Ensure cards are created before attempting to initialize positions on resize
        if (allCards.length === 0) {
            createCards();
        }
        initializeCardPositions();
        repositionAllCards();
    });

    // --- Initial Setup on DOMContentLoaded ---
    createCards(); // Create cards first so they exist for layout calculations

    // Populate the initial dialog's language selector with options from the main one
    // This ensures consistency and avoids hardcoding options twice.
    Array.from(languageSelector.options).forEach(option => {
        initialLanguageSelector.add(option.cloneNode(true));
    });

    // Hide main app elements initially
    document.querySelector('.header-container').classList.add('hidden');
    document.querySelector('.card-circle-container').classList.add('hidden');
    detailPageContainer.classList.add('hidden'); // Ensure detail page is hidden at load

    // Add event listener for the new Enter button
    enterButton.addEventListener('click', async () => {
        initialDialogOverlay.classList.add('hidden'); // Hide the initial dialog
        document.querySelector('.header-container').classList.remove('hidden'); // Show header
        container.classList.remove('hidden'); // Show card container
        languageMenu.classList.remove('hidden'); // Show the header's language menu

        // Load the language selected in the initial dialog
        await loadLanguage(initialLanguageSelector.value);

        // Set the main language selector to match the initial dialog's selection
        languageSelector.value = initialLanguageSelector.value;

        isAnimationGloballyPaused = false; // Ensure animation is not paused
        startCurrentContinuousAnimation(); // Start the specific animation for the loaded language
        await repositionAllCards(); // Ensure cards are positioned correctly for the chosen animation
    });

    // Start the animation sequence. It will be effectively paused
    // until the initial dialog is dismissed by the user.
    animationSequence();
});
