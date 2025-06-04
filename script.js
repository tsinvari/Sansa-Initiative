document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const container = document.querySelector('.card-circle-container');
    const languageSelector = document.getElementById('languageSelector');

    const detailPageContainer = document.getElementById('detailPageContainer');
    const detailPageTitle = document.getElementById('detailPageTitle');
    const detailPageParagraph = document.getElementById('detailPageParagraph');
    const detailPageTableContent = document.getElementById('detailPageTableContent');
    const detailPageListContent = document.getElementById('detailPageListContent');
    const detailPageBackButton = document.getElementById('detailPageBackButton');

    let allCards = [];
    const numTotalCards = 7;

    let currentRotationDurationMs = 12 * 1000; // Default to 12 seconds per rotation
    let currentRadius = 250;
    let slotTransforms = []; // Stores the base CSS transforms for each card's position
    let cardHoverStates = new Map();
    let isAnimationGloballyPaused = false;
    let focusedCardElement = null;

    let currentLangData = {}; // To store loaded language JSON
    const loadedLanguages = {}; // Cache for loaded language files

    let currentMovementType = 'centralCircle'; // Default movement type

    // --- Variables for Heartbeat Animation (Experimental) ---
    let heartbeatAnimationFrameId = null;
    let heartbeatStartTime = 0;
    const heartbeatAmplitude = 25;
    const heartbeatFrequency = 0.004;
    const heartbeatPhaseOffset = 0.5;

    // --- Variables for Grid Oscillation (Pragmatic - if it were just oscillation) ---
    let gridOscillationAnimationFrameId = null;
    let gridOscillationStartTime = 0;
    const gridOscillationAmplitude = 5;
    const gridOscillationFrequency = 0.0005;
    const gridOscillationPhaseOffset = 0.2;

    // --- Variables for Twinkle Animation (Pragmatic) ---
    let twinkleAnimationFrameId = null;
    let twinkleStartTime = 0;
    const twinkleMinOpacity = 0.2;
    const twinkleMaxOpacity = 1.0;
    const twinkleDurationMs = 2000;
    const twinklePhaseOffset = 0.3;

    // --- Variables for Mosaic Flow Animation (Sephorian) ---
    let mosaicFlowAnimationFrameId = null;
    let mosaicFlowStartTime = 0;
    const mosaicFlowTranslateAmplitude = 8;
    const mosaicFlowRotateAmplitude = 2;
    const mosaicFlowFrequency = 0.0003;
    const mosaicFlowPhaseOffset = 0.7;

    // --- NEW: Variable for Container Inclination ---
    let containerInclinationTransform = ''; // Stores the base X-rotation for the container
    // --- END NEW ---

    // --- Image Paths and Text Colors (Defined directly in script.js for local image setup) ---
    const languageImageStyles = {
        pragmatic: {
            text: '#FFFFFF', // Text color over image
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
            text: '#000000', // Example: Black text if images are very light
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

    // --- Helper function to convert Hex to RGB for rgba() CSS properties ---
    function hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return null;
        let r = 0, g = 0, b = 0;
        // Handle #RRGGBB or #RGB
        if (hex.length === 7) { // #RRGGBB
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        } else if (hex.length === 4) { // #RGB
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        }
        return { r, g, b };
    }

    // --- Language Data Loading ---
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
            loadedLanguages[langKey] = data; // Cache it
            updateUIWithLanguageData();
        }
        catch (error) {
            console.error("Error loading language data:", error);
            if (langKey !== 'pragmatic') {
                await loadLanguage('pragmatic'); // Try loading default
            } else {
                allCards.forEach(card => {
                    const front = card.querySelector('.card-front');
                    if (front) front.textContent = 'Language Error'; // Display error on card front if default fails
                });
            }
        }
    }

    function updateUIWithLanguageData() {
        if (!currentLangData || Object.keys(currentLangData).length === 0) {
            console.warn("No language data loaded to update UI.");
            return;
        }

        const oldMovementType = currentMovementType; // Store old type before updating

        // --- Apply Theme Styles ---
        const themeConfig = currentLangData.themeConfig;
        if (themeConfig) {
            document.body.style.fontFamily = themeConfig.fontFamily;
            if (themeConfig.backgroundImage) {
                document.body.style.backgroundImage = themeConfig.backgroundImage;
                document.body.style.backgroundColor = 'transparent'; // Ensure background color doesn't interfere
            } else {
                document.body.style.backgroundColor = themeConfig.backgroundColor;
                document.body.style.backgroundImage = ''; // Clear any existing background image
            }

            // Set CSS Variables for colors (hex values)
            root.style.setProperty('--theme-primary-color', themeConfig.primaryColor);
            root.style.setProperty('--theme-secondary-color', themeConfig.secondaryColor);
            root.style.setProperty('--theme-text-color', themeConfig.textColor);
            root.style.setProperty('--theme-header-color', themeConfig.headerColor);
            root.style.setProperty('--theme-card-back-color', themeConfig.cardBackColor || '#1e293b');

            // Set RGB variables for use with rgba()
            const primaryRgb = hexToRgb(themeConfig.primaryColor);
            const secondaryRgb = hexToRgb(themeConfig.secondaryColor);
            if (primaryRgb) root.style.setProperty('--theme-primary-color-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
            if (secondaryRgb) root.style.setProperty('--theme-secondary-color-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);

            currentMovementType = themeConfig.movementType || 'centralCircle'; // Default to centralCircle
        }

        updateCardAppearance(languageSelector.value); // Pass the current language key
        initializeCardPositions(); // Re-initialize card positions to apply new movement type

        // --- Manage continuous animations start/stop on theme change ---
        // Stop all continuous animations first
        if (heartbeatAnimationFrameId) { cancelAnimationFrame(heartbeatAnimationFrameId); heartbeatAnimationFrameId = null; }
        if (gridOscillationAnimationFrameId) { cancelAnimationFrame(gridOscillationAnimationFrameId); gridOscillationAnimationFrameId = null; }
        if (twinkleAnimationFrameId) { cancelAnimationFrame(twinkleAnimationFrameId); twinkleAnimationFrameId = null; }
        if (mosaicFlowAnimationFrameId) { cancelAnimationFrame(mosaicFlowAnimationFrameId); mosaicFlowAnimationFrameId = null; }

        // Start the new continuous animation if applicable
        if (currentMovementType === 'horizontalHeartbeat') {
            heartbeatStartTime = performance.now();
            startHeartbeatAnimation();
        } else if (currentMovementType === 'structuredGrid') {
            gridOscillationStartTime = performance.now();
            startGridOscillationAnimation();
        } else if (currentMovementType === 'twinkle') {
            twinkleStartTime = performance.now();
            startTwinkleAnimation();
        } else if (currentMovementType === 'mosaicFlow') {
            mosaicFlowStartTime = performance.now();
            startMosaicFlowAnimation();
        }

        // --- NEW: Set container inclination based on movement type ---
        if (currentMovementType === 'circularOrbit') {
            containerInclinationTransform = 'rotateX(45deg)'; // Apply 45-degree tilt for orbit
        } else {
            containerInclinationTransform = ''; // No tilt for other types
        }
        // Apply initial container transform (combining inclination and current rotation)
        container.style.transform = `${containerInclinationTransform} rotate(${parseFloat(container.dataset.currentRotation || 0)}deg)`;
        // --- END NEW ---
    }

    function createCards() {
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

            backFace.appendChild(backH3);
            backFace.appendChild(backP);
            backFace.appendChild(learnMoreLink);

            flipper.appendChild(frontFace);
            flipper.appendChild(backFace);
            card.appendChild(flipper);
            container.appendChild(card);
            allCards.push(card);
            cardHoverStates.set(card, false);
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('learn-more-link')) {
                    e.stopPropagation();
                    const cardId = parseInt(e.target.dataset.cardId, 10);
                    showDetailPage(cardId);
                } else {
                    handleCardClick(card);
                }
            });
        }
    }

    function updateCardAppearance(languageKey) {
        if (!currentLangData || Object.keys(currentLangData).length === 0 || !currentLangData.cardFrontTexts || !currentLangData.cardBackContents) {
             console.warn("Missing language data for card appearance update.");
             return;
        }

        const frontTexts = currentLangData.cardFrontTexts;
        const backContent = currentLangData.cardBackContents;
        const imageStyleInfo = languageImageStyles[languageKey] || languageImageStyles.pragmatic;
        const learnMoreText = currentLangData.learnMoreLinkText;

        allCards.forEach((card, index) => {
            const cardId = parseInt(card.dataset.id, 10);
            const frontFace = card.querySelector('.card-front');
            const backFace = card.querySelector('.card-back');
            // --- FIX START ---
            // Corrected variable queries for backH3, backP, link
            const actualBackH3 = backFace ? backFace.querySelector('h3') : null;
            const actualBackP = backFace ? backFace.querySelector('p') : null;
            const actualLink = backFace ? backFace.querySelector('.learn-more-link') : null;
            // --- FIX END ---

            const cardIdText = frontTexts[cardId - 1] || `Card ${cardId}`;

            if (frontFace) {
                frontFace.textContent = cardIdText;
                frontFace.style.color = imageStyleInfo.text;

                if (imageStyleInfo.imagePaths && imageStyleInfo.imagePaths[index]) {
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
            // --- FIX START ---
            // Use the actual queried elements here
            if (actualBackH3 && actualBackP && cardId > 0 && cardId <= backContent.length) {
                actualBackH3.textContent = backContent[cardId - 1].title;
                actualBackP.textContent = backContent[cardId - 1].p;
            }
            if (actualLink) actualLink.textContent = learnMoreText;
            // --- FIX END ---
        });
    }

    // --- Movement Type Layout Functions ---
    function layoutCentralCircle(radius) {
        const transforms = [`translateX(0px) translateY(0px)`];
        const numOuterSlots = 6;
        for (let i = 0; i < numOuterSlots; i++) {
            const angle = (360 / numOuterSlots) * i;
            transforms.push(`rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)`);
        }
        return transforms;
    }

    function layoutHorizontalHeartbeat(radius) {
        const transforms = [];
        const cardWidth = 150;
        const spacing = 30;
        const totalWidth = (numTotalCards * cardWidth) + ((numTotalCards - 1) * spacing);
        const startX = -totalWidth / 2 + cardWidth / 2;

        for (let i = 0; i < numTotalCards; i++) {
            const x = startX + (i * (cardWidth + spacing));
            transforms.push(`translateX(${x}px) translateY(0px)`);
        }
        return transforms;
    }

    function layoutCircularOrbit(radius) {
        const transforms = [];
        for (let i = 0; i < numTotalCards; i++) {
            const angle = (360 / numTotalCards) * i;
            transforms.push(`rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)`);
        }
        return transforms;
    }

    function layoutStructuredGrid(radius) {
        const transforms = [];
        const cardWidth = 150;
        const cardHeight = 220;
        const gapX = 40;
        const gapY = 40;

        const gridPositions = [
            `translateX(-${cardWidth + gapX}px) translateY(-${cardHeight + gapY}px)`,
            `translateX(0px) translateY(-${cardHeight + gapY}px)`,
            `translateX(${cardWidth + gapX}px) translateY(-${cardHeight + gapY}px)`,

            `translateX(-${cardWidth + gapX}px) translateY(0px)`,
            `translateX(0px) translateY(0px)`,
            `translateX(${cardWidth + gapX}px) translateY(0px)`,

            `translateX(0px) translateY(${cardHeight + gapY}px)`
        ];

        for (let i = 0; i < numTotalCards; i++) {
            transforms.push(gridPositions[i] || `translateX(0px) translateY(0px)`);
        }
        return transforms;
    }

    function layoutUnfoldingScroll(radius) {
        const transforms = [];
        const cardHeight = 220;
        const overlap = 80;
        const totalStackHeight = numTotalCards * (cardHeight - overlap) + overlap;
        const startY = -totalStackHeight / 2 + cardHeight / 2;

        for (let i = 0; i < numTotalCards; i++) {
            const y = startY + i * (cardHeight - overlap);
            transforms.push(`translateX(0px) translateY(${y}px)`);
        }
        return transforms;
    }

    function layoutMosaicFlow(radius) {
        const transforms = [];
        const cardWidth = 150;
        const cardHeight = 220;
        const baseOffset = 100;

        const mosaicPositions = [
            `translateX(-${baseOffset * 1.5}px) translateY(-${baseOffset}px)`,
            `translateX(${baseOffset * 0.5}px) translateY(-${baseOffset * 1.8}px)`,
            `translateX(${baseOffset * 1.5}px) translateY(-${baseOffset * 0.5}px)`,
            `translateX(-${baseOffset * 0.8}px) translateY(${baseOffset * 0.7}px)`,
            `translateX(${baseOffset * 0.8}px) translateY(${baseOffset * 0.7}px)`,
            `translateX(-${baseOffset * 0.5}px) translateY(${baseOffset * 1.5}px)`,
            `translateX(${baseOffset * 1.5}px) translateY(${baseOffset * 1.5}px)`
        ];

        for (let i = 0; i < numTotalCards; i++) {
            transforms.push(mosaicPositions[i] || `translateX(0px) translateY(0px)`);
        }
        return transforms;
    }

    // --- MODIFIED: updateSlotTransforms to dispatch based on currentMovementType ---
    function updateSlotTransforms() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) { currentRadius = 120; }
        else if (screenWidth <= 768) { currentRadius = 180; }
        else { currentRadius = 250; }

        let effectiveRadius = currentRadius;
        if (currentMovementType === 'circularOrbit') {
            effectiveRadius = currentRadius + 50;
        }

        switch (currentMovementType) {
            case 'centralCircle':
                slotTransforms = layoutCentralCircle(effectiveRadius);
                break;
            case 'horizontalHeartbeat':
                slotTransforms = layoutHorizontalHeartbeat(effectiveRadius);
                break;
            case 'circularOrbit':
                slotTransforms = layoutCircularOrbit(effectiveRadius);
                break;
            case 'structuredGrid':
                slotTransforms = layoutStructuredGrid(effectiveRadius);
                break;
            case 'unfoldingScroll':
                slotTransforms = layoutUnfoldingScroll(effectiveRadius);
                break;
            case 'mosaicFlow':
                slotTransforms = layoutMosaicFlow(effectiveRadius);
                break;
            default:
                console.warn(`Unknown movement type: ${currentMovementType}. Falling back to centralCircle.`);
                slotTransforms = layoutCentralCircle(effectiveRadius);
                break;
        }
        if (currentMovementType !== 'centralCircle' && currentMovementType !== 'circularOrbit') {
            container.style.transform = 'rotate(0deg)';
            container.dataset.currentRotation = "0";
        }
    }

    function applyCardBaseTransformsAndHover(containerCurrentAngle = 0) {
        if (isAnimationGloballyPaused && focusedCardElement && detailPageContainer.classList.contains('hidden')) {
            allCards.forEach(card => {
                if (card === focusedCardElement) return;
                const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
                card.classList.remove('is-hovered');
                card.style.transform = `${baseTransform} rotate(${-containerCurrentAngle}deg)`;
            });
            return;
        }
        if (!detailPageContainer.classList.contains('hidden')) return;
        allCards.forEach((card, index) => {
            const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
            let hoverEffectTransform = cardHoverStates.get(card) ? ' translateY(-15px) scale(1.05)' : '';
            const rotationTransform = (currentMovementType === 'centralCircle' || currentMovementType === 'circularOrbit') ? `rotate(${-containerCurrentAngle}deg)` : '';

            let heartbeatOffset = 0;
            if (currentMovementType === 'horizontalHeartbeat') {
                const time = (performance.now() - heartbeatStartTime) * heartbeatFrequency;
                heartbeatOffset = heartbeatAmplitude * Math.sin(time + index * heartbeatPhaseOffset);
            }
            let gridOscillationOffset = 0;
            if (currentMovementType === 'structuredGrid') {
                const time = (performance.now() - gridOscillationStartTime) * gridOscillationFrequency;
                gridOscillationOffset = gridOscillationAmplitude * Math.sin(time + index * gridOscillationPhaseOffset);
            }
            let twinkleOpacityOffset = 0;
            if (currentMovementType === 'twinkle') {
                const time = (performance.now() - twinkleStartTime) / twinkleDurationMs * Math.PI * 2;
                const normalizedOscillation = (Math.cos(time + index * twinklePhaseOffset) + 1) / 2;
                twinkleOpacityOffset = twinkleMinOpacity + (twinkleMaxOpacity - twinkleMinOpacity) * normalizedOscillation;
            }
            let mosaicFlowTranslateOffset = { x: 0, y: 0 };
            let mosaicFlowRotateOffset = 0;
            if (currentMovementType === 'mosaicFlow') {
                const time = (performance.now() - mosaicFlowStartTime) * mosaicFlowFrequency;
                mosaicFlowTranslateOffset.x = mosaicFlowTranslateAmplitude * Math.sin(time + index * mosaicFlowPhaseOffset);
                mosaicFlowTranslateOffset.y = mosaicFlowTranslateAmplitude * Math.cos(time + index * mosaicFlowPhaseOffset);
                mosaicFlowRotateOffset = mosaicFlowRotateAmplitude * Math.sin(time + index * mosaicFlowPhaseOffset * 1.5);
            }

            card.classList.remove('is-hovered');
            if (cardHoverStates.get(card)) card.classList.add('is-hovered');

            card.style.transform = `${baseTransform} ${rotationTransform} translateY(${heartbeatOffset + gridOscillationOffset + mosaicFlowTranslateOffset.y}px) translateX(${mosaicFlowTranslateOffset.x}px) rotate(${mosaicFlowRotateOffset}deg) ${hoverEffectTransform}`;
            if (currentMovementType === 'twinkle') {
                card.style.opacity = twinkleOpacityOffset;
            } else {
                card.style.opacity = 1;
            }
        });
    }

    async function initializeCardPositions() {
        updateSlotTransforms();
        const currentContainerAngle = parseFloat(container.dataset.currentRotation) || 0;
        allCards.forEach((card, index) => {
            card.dataset.slotTransform = slotTransforms[index % numTotalCards];
        });
        applyCardBaseTransformsAndHover(currentContainerAngle);
        await loadLanguage(languageSelector.value);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function repositionAllCards() {
        return new Promise(resolve => {
            shuffleArray(allCards);
            allCards.forEach((card, index) => {
                card.style.transition = 'transform 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                card.dataset.slotTransform = slotTransforms[index];
            });
            setTimeout(() => {
                allCards.forEach(card => {
                    card.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease, background-color 0.4s ease, color 0.4s ease';
                });
                applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0));
                resolve();
            }, 700);
        });
    }

    languageSelector.addEventListener('change', async (event) => {
        await loadLanguage(event.target.value);
    });

    function showDetailPage(cardId) {
        if (!focusedCardElement) { return; }

        detailPageParagraph.classList.add('hidden');
        detailPageTableContent.classList.add('hidden');
        detailPageListContent.classList.add('hidden');
        detailPageContainer.style.display = 'flex';

        if (!currentLangData.detailPageContent || !currentLangData.detailPageContent[cardId - 1]) {
            console.error(`Detail page content not found for card ID: ${cardId}`);
            detailPageTitle.textContent = `Details for Card ${cardId}`;
            detailPageParagraph.textContent = "Content loading or unavailable.";
            detailPageParagraph.classList.remove('hidden');
        } else {
            const cardDetail = currentLangData.detailPageContent[cardId - 1];

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
                    break;
                default:
                    console.warn(`Unknown detail page type: ${cardDetail.type} for card ID: ${cardId}`);
                    break;
            }
        }

        if (currentLangData.detailPageBackButtonText) {
            detailPageBackButton.textContent = currentLangData.detailPageBackButtonText;
        }

        detailPageContainer.classList.remove('hidden');
        container.style.display = 'none';
        if (focusedCardElement) focusedCardElement.style.display = 'none';
        document.querySelector('.language-menu').style.display = 'none';
        isAnimationGloballyPaused = true;
        // Stop all continuous animations if active
        if (heartbeatAnimationFrameId) { cancelAnimationFrame(heartbeatAnimationFrameId); heartbeatAnimationFrameId = null; }
        if (gridOscillationAnimationFrameId) { cancelAnimationFrame(gridOscillationAnimationFrameId); gridOscillationAnimationFrameId = null; }
        if (twinkleAnimationFrameId) { cancelAnimationFrame(twinkleAnimationFrameId); twinkleAnimationFrameId = null; }
        if (mosaicFlowAnimationFrameId) { cancelAnimationFrame(mosaicFlowAnimationFrameId); mosaicFlowAnimationFrameId = null; }
    }

    function populateTable(tableData) {
        const table = detailPageTableContent.querySelector('table');
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

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

    function populateList(listItems) {
        const ul = detailPageListContent.querySelector('ul');
        if (!ul) return;

        ul.innerHTML = '';

        if (listItems && listItems.length > 0) {
            listItems.forEach(itemText => {
                const li = document.createElement('li');
                li.textContent = itemText;
                ul.appendChild(li);
            });
        }
    }

    function hideDetailPage() {
        detailPageContainer.classList.add('hidden');
        detailPageContainer.style.display = '';

        container.style.display = 'flex';
        if (focusedCardElement) focusedCardElement.style.display = 'flex';
        document.querySelector('.language-menu').style.display = 'block';
        unfocusCard();

        detailPageParagraph.classList.add('hidden');
        detailPageTableContent.classList.add('hidden');
        detailPageListContent.classList.add('hidden');

        detailPageTitle.textContent = '';
        detailPageParagraph.textContent = '';
        detailPageTableContent.querySelector('thead').innerHTML = '';
        detailPageTableContent.querySelector('tbody').innerHTML = '';
        detailPageListContent.querySelector('ul').innerHTML = '';

        // Restart continuous animations if applicable
        if (currentMovementType === 'horizontalHeartbeat' && !heartbeatAnimationFrameId) {
            heartbeatStartTime = performance.now();
            startHeartbeatAnimation();
        }
        if (currentMovementType === 'structuredGrid' && !gridOscillationAnimationFrameId) {
            gridOscillationStartTime = performance.now();
            startGridOscillationAnimation();
        }
        if (currentMovementType === 'twinkle' && !twinkleAnimationFrameId) {
            twinkleStartTime = performance.now();
            startTwinkleAnimation();
        }
        if (currentMovementType === 'mosaicFlow' && !mosaicFlowAnimationFrameId) {
            mosaicFlowStartTime = performance.now();
            startMosaicFlowAnimation();
        }
    }
    detailPageBackButton.addEventListener('click', hideDetailPage);

    function handleCardClick(cardElement) {
        if (!detailPageContainer.classList.contains('hidden')) return;
        if (focusedCardElement && focusedCardElement !== cardElement) return;
        if (focusedCardElement === cardElement) {
            unfocusCard();
        } else {
            focusCard(cardElement);
        }
    }
    function focusCard(cardElement) {
        if (isAnimationGloballyPaused && focusedCardElement) return;
        isAnimationGloballyPaused = true;
        focusedCardElement = cardElement;
        cardElement.classList.add('card-focused');
        const currentContainerAngle = parseFloat(container.dataset.currentRotation) || 0;
        const rotationZ = (currentMovementType === 'centralCircle' || currentMovementType === 'circularOrbit') ? `rotateZ(${-currentContainerAngle}deg)` : '';
        cardElement.style.transform = `${rotationZ} translate(0px, 0px) scale(1.8) rotateY(0deg)`;
        setTimeout(() => {
            if (focusedCardElement === cardElement) {
               cardElement.classList.add('is-flipped');
            }
        }, 50);
    }
    function unfocusCard() {
        if (!focusedCardElement) return;
        const cardToUnfocus = focusedCardElement;
        cardToUnfocus.classList.remove('is-flipped');
        setTimeout(() => {
            cardToUnfocus.classList.remove('card-focused');
            const currentContainerAngle = parseFloat(container.dataset.currentRotation) || 0;
            const baseTransform = cardToUnfocus.dataset.slotTransform || 'translateX(0px) translateY(0px)';
            const rotationTransform = (currentMovementType === 'centralCircle' || currentMovementType === 'circularOrbit') ? `rotate(${-currentContainerAngle}deg)` : '';
            cardToUnfocus.style.transform = `${baseTransform} ${rotationTransform}`;
            if (focusedCardElement === cardToUnfocus) {
               focusedCardElement = null;
               isAnimationGloballyPaused = false;
            }
        }, 300);
    }

    function startTwinkleAnimation() {
        if (twinkleAnimationFrameId) cancelAnimationFrame(twinkleAnimationFrameId);
        twinkleStartTime = performance.now();
        function animateTwinkle(currentTime) {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'twinkle') {
                twinkleAnimationFrameId = null;
                allCards.forEach(card => card.style.opacity = 1);
                return;
            }
            applyCardBaseTransformsAndHover(0);
            twinkleAnimationFrameId = requestAnimationFrame(animateTwinkle);
        }
        twinkleAnimationFrameId = requestAnimationFrame(animateTwinkle);
    }

    function startHeartbeatAnimation() {
        if (heartbeatAnimationFrameId) cancelAnimationFrame(heartbeatAnimationFrameId);
        heartbeatStartTime = performance.now();
        function animateHeartbeat(currentTime) {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'horizontalHeartbeat') {
                heartbeatAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            heartbeatAnimationFrameId = requestAnimationFrame(animateHeartbeat);
        }
        heartbeatAnimationFrameId = requestAnimationFrame(animateHeartbeat);
    }
    function startGridOscillationAnimation() {
        if (gridOscillationAnimationFrameId) cancelAnimationFrame(gridOscillationAnimationFrameId);
        gridOscillationStartTime = performance.now();
        function animateGridOscillation(currentTime) {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'structuredGrid') {
                gridOscillationAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            gridOscillationAnimationFrameId = requestAnimationFrame(animateGridOscillation);
        }
        gridOscillationAnimationFrameId = requestAnimationFrame(animateGridOscillation);
    }
    function startMosaicFlowAnimation() {
        if (mosaicFlowAnimationFrameId) cancelAnimationFrame(mosaicFlowAnimationFrameId);
        mosaicFlowStartTime = performance.now();
        function animateMosaicFlow(currentTime) {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || currentMovementType !== 'mosaicFlow') {
                mosaicFlowAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            mosaicFlowAnimationFrameId = requestAnimationFrame(animateMosaicFlow);
        }
        mosaicFlowAnimationFrameId = requestAnimationFrame(animateMosaicFlow);
    }

    async function animateContainerRotation(targetRotationDegrees, durationMs) {
        return new Promise(resolve => {
            const startAngle = parseFloat(container.dataset.currentRotation || 0);
            const startTime = performance.now();
            let animationFrameId;

            function step(currentTime) {
                if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden')) {
                    cancelAnimationFrame(animationFrameId);
                    resolve();
                    return;
                }

                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / durationMs, 1);

                if (currentMovementType === 'centralCircle' || currentMovementType === 'circularOrbit') {
                    const currentAngle = startAngle + (targetRotationDegrees - startAngle) * progress;
                    container.style.transform = `${containerInclinationTransform} rotate(${currentAngle}deg)`;
                    container.dataset.currentRotation = currentAngle;
                    applyCardBaseTransformsAndHover(currentAngle);
                } else {
                    applyCardBaseTransformsAndHover(0);
                }

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(step);
                } else {
                    if (currentMovementType === 'centralCircle' || currentMovementType === 'circularOrbit') {
                        container.style.transform = `${containerInclinationTransform} rotate(${targetRotationDegrees}deg)`;
                        container.dataset.currentRotation = targetRotationDegrees % 360;
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

    async function animationSequence() {
        createCards();

        allCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!isAnimationGloballyPaused) cardHoverStates.set(card, true);
            });
            card.addEventListener('mouseleave', () => {
                if (!isAnimationGloballyPaused) cardHoverStates.set(card, false);
            });
        });

        await initializeCardPositions();
        await repositionAllCards();
        await new Promise(r => setTimeout(r, 100));

        // --- Start initial continuous animation if applicable ---
        if (currentMovementType === 'horizontalHeartbeat') {
            heartbeatStartTime = performance.now();
            startHeartbeatAnimation();
        } else if (currentMovementType === 'structuredGrid') {
            gridOscillationStartTime = performance.now();
            startGridOscillationAnimation();
        } else if (currentMovementType === 'twinkle') {
            twinkleStartTime = performance.now();
            startTwinkleAnimation();
        } else if (currentMovementType === 'mosaicFlow') {
            mosaicFlowStartTime = performance.now();
            startMosaicFlowAnimation();
        }
        // --- END NEW ---

        while (true) {
            if (isAnimationGloballyPaused) {
                // Stop all continuous animations if paused
                if (heartbeatAnimationFrameId) {
                    cancelAnimationFrame(heartbeatAnimationFrameId);
                    heartbeatAnimationFrameId = null;
                }
                if (gridOscillationAnimationFrameId) {
                    cancelAnimationFrame(gridOscillationAnimationFrameId);
                    gridOscillationAnimationFrameId = null;
                }
                if (twinkleAnimationFrameId) {
                    cancelAnimationFrame(twinkleAnimationFrameId);
                    twinkleAnimationFrameId = null;
                    allCards.forEach(card => card.style.opacity = 1);
                }
                if (mosaicFlowAnimationFrameId) {
                    cancelAnimationFrame(mosaicFlowAnimationFrameId);
                    mosaicFlowAnimationFrameId = null;
                }
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (!isAnimationGloballyPaused) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
                // Restart continuous animations if they were active and we just unpaused
                if (currentMovementType === 'horizontalHeartbeat' && !heartbeatAnimationFrameId) {
                    heartbeatStartTime = performance.now();
                    startHeartbeatAnimation();
                } else if (currentMovementType === 'structuredGrid' && !gridOscillationAnimationFrameId) {
                    gridOscillationStartTime = performance.now();
                    startGridOscillationAnimation();
                } else if (currentMovementType === 'twinkle' && !twinkleAnimationFrameId) {
                    twinkleStartTime = performance.now();
                    startTwinkleAnimation();
                } else if (currentMovementType === 'mosaicFlow' && !mosaicFlowAnimationFrameId) {
                    mosaicFlowStartTime = performance.now();
                    startMosaicFlowAnimation();
                }
            }

            applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0));

            const cycleDuration = currentRotationDurationMs;

            if (currentMovementType === 'centralCircle' || currentMovementType === 'circularOrbit') {
                const randomDirection = Math.random() < 0.5 ? 1 : -1;
                let currentAngle = parseFloat(container.dataset.currentRotation || 0);
                const targetAngle = currentAngle + (360 * randomDirection);
                await animateContainerRotation(targetAngle, cycleDuration);
            } else if (currentMovementType === 'horizontalHeartbeat') {
                await new Promise(r => setTimeout(r, cycleDuration));
                if (heartbeatAnimationFrameId) {
                    cancelAnimationFrame(heartbeatAnimationFrameId);
                    heartbeatAnimationFrameId = null;
                }
            } else if (currentMovementType === 'structuredGrid') {
                await new Promise(r => setTimeout(r, cycleDuration));
                if (gridOscillationAnimationFrameId) {
                    cancelAnimationFrame(gridOscillationAnimationFrameId);
                    gridOscillationAnimationFrameId = null;
                }
            } else if (currentMovementType === 'twinkle') {
                await new Promise(r => setTimeout(r, cycleDuration));
                if (twinkleAnimationFrameId) {
                    cancelAnimationFrame(twinkleAnimationFrameId);
                    twinkleAnimationFrameId = null;
                    allCards.forEach(card => card.style.opacity = 1);
                }
            } else if (currentMovementType === 'mosaicFlow') {
                mosaicFlowStartTime = performance.now();
                startMosaicFlowAnimation();
                await new Promise(r => setTimeout(r, cycleDuration));
                if (mosaicFlowAnimationFrameId) {
                    cancelAnimationFrame(mosaicFlowAnimationFrameId);
                    mosaicFlowAnimationFrameId = null;
                }
            } else {
                await new Promise(r => setTimeout(r, cycleDuration));
            }

            if (isAnimationGloballyPaused) continue;

            if (currentMovementType === 'centralCircle' || currentMovementType === 'circularOrbit') {
                container.style.transition = 'none';
                container.style.transform = `${containerInclinationTransform} rotate(0deg)`; // Apply inclination on reset
                container.dataset.currentRotation = "0";
                applyCardBaseTransformsAndHover(0);
                await new Promise(r => setTimeout(r, 50));
            }

            if (isAnimationGloballyPaused) continue;

            await repositionAllCards();
            await new Promise(r => setTimeout(r, 500));
        }
    }

    window.addEventListener('resize', () => {
        initializeCardPositions();
        repositionAllCards();
    });

    animationSequence();
});
