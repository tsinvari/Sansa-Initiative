document.addEventListener('DOMContentLoaded', async () => {
    const root = document.documentElement;
    const container = document.querySelector('.card-circle-container');
    const languageSelector = document.getElementById('languageSelector');
    const headerTitleElement = document.querySelector('.title');
    const faqButton = document.getElementById('faqButton'); // NEW: FAQ Button reference

    const detailPageContainer = document.getElementById('detailPageContainer');
    const detailPageTitle = document.getElementById('detailPageTitle');
    const detailPageParagraph = document.getElementById('detailPageParagraph');
    const detailPageTableContent = document.getElementById('detailPageTableContent');
    const detailPageListContent = document.getElementById('detailPageListContent');
    const detailPageBackButton = document.getElementById('detailPageBackButton');
    const languageMenu = document.querySelector('.header-container .language-menu');

    const initialDialogOverlay = document.getElementById('initialDialogOverlay');
    const initialDialogContent = document.getElementById('initialDialogContent');
    const enterButton = document.getElementById('enterButton');
    const initialLanguageSelector = document.getElementById('initialLanguageSelector');
    const initialDialogTitle = initialDialogContent.querySelector('h1');
    const initialDialogParagraph = initialDialogContent.querySelector('p');

    const validationDialogOverlay = document.getElementById('validationDialogOverlay');
    const validationDialogContent = document.getElementById('validationDialogContent');
    const validationYesButton = document.getElementById('validationYesButton');
    const validationNoButton = document.getElementById('validationNoButton');
    const validationDialogTitle = validationDialogContent.querySelector('h2');
    const validationDialogYesButton = validationDialogContent.querySelector('#validationYesButton');
    const validationDialogNoButton = validationDialogContent.querySelector('#validationNoButton');
    let cardToFlipAfterValidation = null;

    // NEW: FAQ Page Elements
    const faqPageContainer = document.getElementById('faqPageContainer');
    const faqTitleElement = document.getElementById('faqTitle');
    const faqQuestionsAnswersContainer = document.getElementById('faqQuestionsAnswers');
    const faqBackButton = document.getElementById('faqBackButton');
    // END NEW

    let allCards = [];
    const numTotalCards = 7;
    const cardsRequiringValidation = [5, 6, 7];
    let currentRotationDurationMs = 12 * 1000;
    let currentRadius = 250;
    let slotTransforms = [];
    let cardHoverStates = new Map();
    let isAnimationGloballyPaused = true;
    let focusedCardElement = null;

    let currentLangData = {};
    const loadedLanguages = {};

    let currentMovementType = 'centralCircle';

    // NEW: Variables to store previous theme state for FAQ page return
    let lastThemeFontFamily = '';
    let lastThemeBackgroundColor = '';
    let lastThemeBackgroundImage = '';
    let lastThemeBackgroundPosition = '';
    let lastThemeMovementType = 'centralCircle'; // Stores the movement type to resume
    let faqData = null; // Stores loaded FAQ content
    let faqLoaded = false; // Flag to ensure FAQ data is loaded only once
    // END NEW

    let heartbeatAnimationFrameId = null;
    let heartbeatStartTime = 0;
    const heartbeatAmplitude = 25;
    const heartbeatFrequency = 0.004;
    const heartbeatPhaseOffset = 0.5;

    let twinkleAnimationFrameId = null;
    let twinkleStartTime = 0;
    const twinkleMinOpacity = 0.2;
    const twinkleMaxOpacity = 1.0;
    const twinkleDurationMs = 2000;
    const twinklePhaseOffset = 0.3;

    let spiralingAnimationFrameId = null;
    let spiralingStartTime = 0;
    const spiralingSpeed = 0.0000625;
    const spiralingRadiusStartFactor = 1.0;
    const spiralingRadiusEndFactor = 0.2;
    const spiralingTurns = 2;
    const spiralingMinScale = 1.0;
    const spiralingMinOpacity = 1.0;

    let randomWiggleAnimationFrameId = null;
    let randomWiggleStartTime = 0;
    const randomWiggleTranslateAmplitude = 10;
    const randomWiggleRotateAmplitude = 5;
    const randomWiggleFrequency = 0.001;
    const randomWigglePhaseOffset = 1;

    let containerInclinationTransform = '';

    // Lorderian Animation Variables (reverted to simpler version for now)
    let lorderianSchedulerTimeoutId = null;
    const lorderianCardTimers = new Map();
    const minLorderianVisibleCards = 2;
    const maxLorderianVisibleCards = 5;
    const lorderianCardDisplayDuration = 4000;
    const lorderianStaggerDelay = 300;
    const lorderianStaggerRandomness = 400;


    const languageOptions = [
        { value: "pragmatic", text: "Pragmatic" },
        { value: "talmudic", text: "Aggadic" },
        { value: "zoharian", text: "Zoharian" },
        { value: "sephorian", text: "Sephorian" },
        { value: "lorderian", text: "Lorderian" },
        { value: "experimental", text: "Experiential" }
    ];

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
        lorderian: {
            text: '#FFFFFF',
            imagePaths: [
                'images/lorderian/card1.jpeg', 'images/lorderian/card2.jpeg', 'images/lorderian/card1.jpeg',
                'images/lorderian/card2.jpeg', 'images/lorderian/card1.jpeg', 'images/lorderian/card2.jpeg', 'images/lorderian/card1.jpeg'
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
            text: '#FFFFFF',
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

    function hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return null;
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return { r, g, b };
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function stopAllContinuousAnimations() {
        if (heartbeatAnimationFrameId) { cancelAnimationFrame(heartbeatAnimationFrameId); heartbeatAnimationFrameId = null; }
        if (twinkleAnimationFrameId) { cancelAnimationFrame(twinkleAnimationFrameId); twinkleAnimationFrameId = null; }
        if (spiralingAnimationFrameId) { cancelAnimationFrame(spiralingAnimationFrameId); spiralingAnimationFrameId = null; }
        if (randomWiggleAnimationFrameId) { cancelAnimationFrame(randomWiggleAnimationFrameId); randomWiggleAnimationFrameId = null; }
        if (lorderianSchedulerTimeoutId) { clearTimeout(lorderianSchedulerTimeoutId); lorderianSchedulerTimeoutId = null; }
        lorderianCardTimers.forEach(timerId => clearTimeout(timerId)); // Clear all individual card timers
        lorderianCardTimers.clear();
        // END NEW
        
        // Reset all cards to hidden/non-interactive state for Lorderian, unless they are focused
        allCards.forEach(card => {
            if (card === focusedCardElement && card.classList.contains('card-focused')) {
                // Keep focused card as is, its visibility is managed by focusCard/unfocusCard
            } else {
                card.style.opacity = 0; // Set to 0 for a fade-in if Lorderian starts next
                card.style.pointerEvents = 'none';
                card.classList.remove('is-flipped', 'card-focused'); // Ensure other cards are unflipped
            }
        });
        // For non-Lorderian animations, ensure cards revert to full opacity and interactivity
        if (currentMovementType !== 'randomAppearDisappear') {
            allCards.forEach(card => {
                if (card !== focusedCardElement) { // Don't touch focused card
                    card.style.opacity = 1;
                    card.style.pointerEvents = 'auto';
                }
            });
        }
    }

    // NEW: Lorderian-specific animation logic (staggered appearances/disappearances)
    function startRandomAppearDisappearAnimation() {
        stopAllContinuousAnimations(); // Clean slate, hides all cards first

        // Ensure all cards start hidden (excluding focused card)
        allCards.forEach(card => {
            if (card !== focusedCardElement) {
                card.style.opacity = 0;
                card.style.pointerEvents = 'none';
            }
        });

        const minLorderianVisibleCards = 2; // Always keep at least 2 visible
        const maxLorderianVisibleCards = 5; // At most 5 visible

        const manageCardVisibilityCycle = () => {
            // Stop if paused or dialog is open
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden')) {
                lorderianSchedulerTimeoutId = null;
                return;
            }

            // Filter cards that are part of the Lorderian pool (not focused)
            const activeCards = allCards.filter(card => card !== focusedCardElement);
            let currentlyVisibleCards = activeCards.filter(card => parseFloat(card.style.opacity) > 0);
            let currentlyHiddenCards = activeCards.filter(card => parseFloat(card.style.opacity) === 0);

            let actionTaken = false;

            // Prioritize showing cards if below minimum
            if (currentlyVisibleCards.length < minLorderianVisibleCards && currentlyHiddenCards.length > 0) {
                const cardToShow = currentlyHiddenCards[Math.floor(Math.random() * currentlyHiddenCards.length)];
                cardToShow.style.opacity = 1;
                cardToShow.style.pointerEvents = 'auto';
                actionTaken = true;

                // Schedule this card to disappear
                lorderianCardTimers.set(cardToShow, setTimeout(() => {
                    if (parseFloat(cardToShow.style.opacity) > 0 && cardToShow !== focusedCardElement) { // Only hide if still visible and not focused
                        cardToShow.style.opacity = 0;
                        cardToShow.style.pointerEvents = 'none';
                    }
                    lorderianCardTimers.delete(cardToShow);
                }, lorderianCardDisplayDuration));
            }
            // If at minimum, but below maximum, and there are hidden cards, randomly show one
            else if (currentlyVisibleCards.length < maxLorderianVisibleCards && currentlyHiddenCards.length > 0 && Math.random() < 0.6) { // 60% chance to show another
                const cardToShow = currentlyHiddenCards[Math.floor(Math.random() * currentlyHiddenCards.length)];
                cardToShow.style.opacity = 1;
                cardToShow.style.pointerEvents = 'auto';
                actionTaken = true;

                // Schedule this card to disappear
                lorderianCardTimers.set(cardToShow, setTimeout(() => {
                    if (parseFloat(cardToShow.style.opacity) > 0 && cardToShow !== focusedCardElement) { // Only hide if still visible and not focused
                        cardToShow.style.opacity = 0;
                        cardToShow.style.pointerEvents = 'none';
                    }
                    lorderianCardTimers.delete(cardToShow);
                }, lorderianCardDisplayDuration));
            }
            // If at maximum visible cards, and there are cards that can be hidden, randomly hide one
            else if (currentlyVisibleCards.length > maxLorderianVisibleCards && currentlyVisibleCards.length > minLorderianVisibleCards && Math.random() < 0.6) { // Try to hide if above max, and still more than min
                const cardToHide = currentlyVisibleCards[Math.floor(Math.random() * currentlyVisibleCards.length)];
                cardToHide.style.opacity = 0;
                cardToHide.style.pointerEvents = 'none';
                actionTaken = true;
            }
            // If we're in the desired range and no specific action was taken this tick, just wait for next scheduled action or timer expiry
            else {
                // No action needed this precise tick, just wait for next scheduled action or timer expiry
            }

            // Schedule the next check/action with a random stagger delay
            const randomDelay = Math.random() * lorderianStaggerRandomness + lorderianStaggerDelay;
            lorderianSchedulerTimeoutId = setTimeout(manageCardVisibilityCycle, randomDelay);
        };

        // Initial burst to get to minimum visible cards
        const cardsToInitiallyShow = [];
        const shuffledAllCards = [...allCards].filter(card => card !== focusedCardElement); // Copy and exclude focused
        shuffleArray(shuffledAllCards);

        for(let i = 0; i < minLorderianVisibleCards && shuffledAllCards.length > 0; i++) {
            const card = shuffledAllCards.pop();
            cardsToInitiallyShow.push(card);
        }

        cardsToInitiallyShow.forEach(card => {
            card.style.opacity = 1;
            card.style.pointerEvents = 'auto';
            lorderianCardTimers.set(card, setTimeout(() => {
                if (parseFloat(card.style.opacity) > 0 && card !== focusedCardElement) { // Only hide if still visible and not focused
                    card.style.opacity = 0;
                    card.style.pointerEvents = 'none';
                }
                lorderianCardTimers.delete(card);
            }, lorderianCardDisplayDuration));
        });

        // Start the continuous scheduling after initial burst
        const initialStagger = Math.random() * lorderianStaggerRandomness + lorderianStaggerDelay;
        lorderianSchedulerTimeoutId = setTimeout(manageCardVisibilityCycle, initialStagger);
    }
    // END NEW

    function startCurrentContinuousAnimation() {
        stopAllContinuousAnimations();
        if (currentMovementType === 'horizontalHeartbeat') {
            heartbeatStartTime = performance.now();
            startHeartbeatAnimation();
        } else if (currentMovementType === 'twinkle') {
            twinkleStartTime = performance.now();
            startTwinkleAnimation();
        } else if (currentMovementType === 'spiraling') {
            spiralingStartTime = performance.now();
            startSpiralingAnimation();
        } else if (currentMovementType === 'randomAppearDisappear') {
            startRandomAppearDisappearAnimation();
        } else if (currentMovementType === 'randomWiggle') {
            randomWiggleStartTime = performance.now();
            startRandomWiggleAnimation();
        }
    }

    async function loadLanguage(langKey) {
        if (loadedLanguages[langKey]) {
            currentLangData = loadedLanguages[langKey];
            updateUIWithLanguageData(langKey);
            return;
        }

        try {
            const response = await fetch(`lang/${langKey}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: lang/${langKey}.json (status: ${response.status})`);
            }
            const data = await response.json();
            currentLangData = data;
            loadedLanguages[langKey] = data;
            updateUIWithLanguageData(langKey);
        } catch (error) {
            console.error("Error loading language data:", error);
            allCards.forEach(card => {
                const front = card.querySelector('.card-front');
                if (front) front.textContent = 'Language Error';
            });
        }
    }

    function updateUIWithLanguageData(currentLoadedLangKey, targetElement = document.body, isFaqPage = false) {
        if (!currentLangData || Object.keys(currentLangData).length === 0) {
            console.warn("No language data loaded to update UI.");
            return;
        }

        // Only store current theme properties when NOT transitioning to FAQ page
        if (!isFaqPage) {
            lastThemeFontFamily = document.body.style.fontFamily;
            lastThemeBackgroundColor = document.body.style.backgroundColor;
            lastThemeBackgroundImage = document.body.style.backgroundImage;
            lastThemeBackgroundPosition = root.style.getPropertyValue('--theme-background-position');
            lastThemeMovementType = currentMovementType; // Store the previous movement type
        }

        const themeConfig = isFaqPage && faqData && faqData.themeConfig ? faqData.themeConfig : currentLangData.themeConfig;
        
        if (themeConfig) {
            targetElement.style.fontFamily = themeConfig.fontFamily;
            if (headerTitleElement) { // Only apply to headerTitleElement if it exists in the current context
                headerTitleElement.style.fontFamily = themeConfig.headerFontFamily || 'inherit';
            }

            if (themeConfig.backgroundImage) {
                targetElement.style.backgroundImage = themeConfig.backgroundImage;
                targetElement.style.backgroundColor = 'transparent';
            } else {
                targetElement.style.backgroundColor = themeConfig.backgroundColor;
                targetElement.style.backgroundImage = '';
            }

            // Apply CSS variables to the root element, which will cascade
            root.style.setProperty('--theme-primary-color', themeConfig.primaryColor);
            root.style.setProperty('--theme-secondary-color', themeConfig.secondaryColor);
            root.style.setProperty('--theme-text-color', themeConfig.textColor);
            root.style.setProperty('--theme-header-color', themeConfig.headerColor);
            root.style.setProperty('--theme-card-back-color', themeConfig.cardBackColor || '#1e293b');
            root.style.setProperty('--theme-background-position', themeConfig.backgroundPosition || 'center center'); // Set dynamic background position

            const primaryRgb = hexToRgb(themeConfig.primaryColor);
            const secondaryRgb = hexToRgb(themeConfig.secondaryColor);
            if (primaryRgb) root.style.setProperty('--theme-primary-color-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
            if (secondaryRgb) root.style.setProperty('--theme-secondary-color-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);

            // Only update currentMovementType if not on FAQ page, as FAQ doesn't have card animation
            if (!isFaqPage) {
                currentMovementType = themeConfig.movementType || 'centralCircle';
            }
            containerInclinationTransform = '';

            const initialDialogData = themeConfig.initialDialog;
            if (initialDialogData && (!initialDialogOverlay.classList.contains('hidden') || initialDialogOverlay.style.display === '')) {
                if (initialDialogTitle) initialDialogTitle.textContent = initialDialogData.title || "Welcome";
                if (initialDialogParagraph) initialDialogParagraph.textContent = initialDialogData.paragraph || "Please select your preferred language to continue:";
                if (enterButton) enterButton.textContent = initialDialogData.enterButtonText || "Enter";
            }

            const validationDialogData = themeConfig.validationDialog;
            if (validationDialogData) {
                if (validationDialogTitle) validationDialogTitle.textContent = validationDialogData.title || "Are you done with the first 4 cards?";
                if (validationDialogYesButton) validationDialogYesButton.textContent = validationDialogData.yesButtonText || "Yes";
                if (validationDialogNoButton) validationDialogNoButton.textContent = validationDialogData.noButtonText || "No";
            }
        }

        // Only update card appearance if not on the FAQ page
        if (!isFaqPage) {
            const cardFrontTextColor = themeConfig.cardFrontTextColor || '#FFFFFF';
            const cardFrontOverlayColor = themeConfig.cardFrontOverlayColor || 'rgba(0, 0, 0, 0.4)';
            updateCardAppearance(currentLoadedLangKey, cardFrontTextColor, cardFrontOverlayColor);
            updateSlotTransforms();
            applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0));
        }
    }

    function createCards() {
        if (allCards.length > 0) return;
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
            const learnMoreButton = document.createElement('button');
            learnMoreButton.classList.add('learn-more-button');
            learnMoreButton.dataset.cardId = i;

            backFace.append(backH3, backP, learnMoreButton);
            flipper.append(frontFace, backFace);
            card.appendChild(flipper);
            container.appendChild(card);
            allCards.push(card);
            cardHoverStates.set(card, false);

            card.addEventListener('click', (e) => {
                if (e.target.closest('.learn-more-button')) {
                    e.stopPropagation();
                    const cardId = parseInt(e.target.closest('.learn-more-button').dataset.cardId, 10);
                    showDetailPage(cardId);
                } else {
                    const clickedCardId = parseInt(card.dataset.id, 10);
                    if (cardsRequiringValidation.includes(clickedCardId) && !card.dataset.validated) {
                        cardToFlipAfterValidation = card;
                        validationDialogOverlay.classList.remove('hidden');
                        isAnimationGloballyPaused = true;
                        stopAllContinuousAnimations();
                        return;
                    } else {
                        handleCardClick(card);
                    }
                }
            });
        }
    }

    function updateCardAppearance(languageKey, cardFrontTextColor, cardFrontOverlayColor) {
        if (!currentLangData || !currentLangData.cardFrontTexts || !currentLangData.cardBackContents) {
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
            const actualBackH3 = backFace?.querySelector('h3');
            const actualBackP = backFace?.querySelector('p');
            const actualButton = backFace?.querySelector('.learn-more-button');

            const cardIdText = frontTexts[cardId - 1] || `Card ${cardId}`;

            if (frontFace) {
                frontFace.textContent = cardIdText;
                frontFace.style.color = cardFrontTextColor;

                if (imageStyleInfo.imagePaths?.[index]) {
                    frontFace.style.backgroundImage = `linear-gradient(${cardFrontOverlayColor}, ${cardFrontOverlayColor}), url('${imageStyleInfo.imagePaths[index]}')`;
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
            if (actualButton) actualButton.textContent = learnMoreText;
        });
    }

    function layoutCentralCircle(radius) {
        const transforms = [`translateX(0px) translateY(0px)`];
        const numOuterSlots = numTotalCards - 1;
        if (numOuterSlots > 0) {
            for (let i = 0; i < numOuterSlots; i++) {
                const angle = (360 / numOuterSlots) * i;
                transforms.push(`rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)`);
            }
        }
        return transforms;
    }

    function layoutHorizontalHeartbeat(radius) {
        const transforms = [];
        const cardWidth = allCards.length > 0 ? allCards[0].offsetWidth : 150;
        const containerWidth = container.offsetWidth || 600;

        let gap = 0;
        const minOverlap = cardWidth * 0.1;
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

    function layoutSpiraling(radius) {
        const transforms = [];
        const baseRadius = radius * 0.8;
        const turns = spiralingTurns;
        const angleStep = (2 * Math.PI * turns) / numTotalCards;
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

    function layoutRandomWiggle(radius) {
        const transforms = [];
        const containerWidth = container.offsetWidth || 600;
        const containerHeight = container.offsetHeight || 600;

        const cardWidth = allCards.length > 0 ? allCards[0].offsetWidth : 150;
        const cardHeight = allCards.length > 0 ? allCards[0].offsetHeight : 220;

        if (cardWidth <= 0 || cardHeight <= 0) {
            console.warn("Card dimensions are zero or negative, falling back to basic random positioning.");
            for (let i = 0; i < numTotalCards; i++) {
                const randomX = Math.random() * (containerWidth - 150) - (containerWidth / 2 - 75);
                const randomY = Math.random() * (containerHeight - 220) - (containerHeight / 2 - 110);
                transforms.push(`translateX(${randomX}px) translateY(${randomY}px)`);
            }
            return transforms;
        }

        const safePadding = 30;
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
                    const x = c * actualCellWidth + actualCellWidth / 2 - containerWidth / 2;
                    const y = r * actualCellHeight + actualCellHeight / 2 - containerHeight / 2;
                    possibleSlots.push({ x, y });
                }
            }
        }

        if (possibleSlots.length < numTotalCards) {
            console.warn(`Not enough non-overlapping slots (${possibleSlots.length}) for ${numTotalCards} cards in Random Wiggle. Cards might overlap.`);
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

    function updateSlotTransforms() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) { currentRadius = 120; }
        else if (screenWidth <= 768) { currentRadius = 180; }
        else { currentRadius = 250; }

        let effectiveRadius = currentRadius;

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
            case 'randomAppearDisappear':
                slotTransforms = layoutRandomWiggle(effectiveRadius);
                break;
            default:
                console.warn(`Unknown movement type: ${currentMovementType}. Falling back to centralCircle.`);
                slotTransforms = layoutCentralCircle(effectiveRadius);
                break;
        }

        if (currentMovementType !== 'centralCircle') {
            container.style.transform = '';
            container.dataset.currentRotation = "0";
        }
    }

    function applyCardBaseTransformsAndHover(containerCurrentAngle = 0) {
        // If animation is globally paused AND a card is focused (and no dialogs are open),
        // we only apply transforms to non-focused cards to keep them out of the way.
        if (isAnimationGloballyPaused && focusedCardElement && detailPageContainer.classList.contains('hidden') && validationDialogOverlay.classList.contains('hidden') && faqPageContainer.classList.contains('hidden')) {
            allCards.forEach(card => {
                if (card === focusedCardElement) return; // Skip focused card
                card.classList.remove('is-hovered'); // Ensure hover state is removed
                const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
                card.style.transform = `${baseTransform} rotate(${-containerCurrentAngle}deg)`;
            });
            return;
        }

        // If any dialog is open, or if the global animation is paused for other reasons
        // and there's no focused card (e.g., Lorderian initially hiding all),
        // we stop applying dynamic transforms.
        if (!detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden') || (isAnimationGloballyPaused && !focusedCardElement)) {
             return;
        }


        allCards.forEach((card, index) => {
            // Skip focused card as its transform is managed by focusCard/unfocusCard
            if (card === focusedCardElement) {
                card.classList.remove('is-hovered');
                return;
            }

            const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
            const rotationTransform = (currentMovementType === 'centralCircle') ? `rotate(${-containerCurrentAngle}deg)` : '';

            let heartbeatOffset = 0;
            if (currentMovementType === 'horizontalHeartbeat') {
                const time = (performance.now() - heartbeatStartTime) * heartbeatFrequency;
                heartbeatOffset = heartbeatAmplitude * Math.sin(time + index * heartbeatPhaseOffset);
            }

            let twinkleOpacityOffset = 1;
            if (currentMovementType === 'twinkle') {
                const time = (performance.now() - twinkleStartTime) / twinkleDurationMs * Math.PI * 2;
                const normalizedOscillation = (Math.cos(time + index * twinklePhaseOffset) + 1) / 2;
                twinkleOpacityOffset = twinkleMinOpacity + (twinkleMaxOpacity - twinkleMinOpacity) * normalizedOscillation;
            }

            let spiralingOffsetTransform = '';
            let finalScale = 1;
            let finalOpacity = 1;

            if (currentMovementType === 'spiraling') {
                const time = (performance.now() - spiralingStartTime) * spiralingSpeed;
                const currentAngle = time + index * (2 * Math.PI / numTotalCards);
                const progressIntoSpiral = (time % (2 * Math.PI)) / (2 * Math.PI);
                const animatedRadius = currentRadius * (spiralingRadiusStartFactor - (spiralingRadiusStartFactor - spiralingRadiusEndFactor) * progressIntoSpiral);

                const x = animatedRadius * Math.cos(currentAngle);
                const y = animatedRadius * Math.sin(currentAngle);
                spiralingOffsetTransform = `translateX(${x}px) translateY(${y}px)`;

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

            card.classList.toggle('is-hovered', cardHoverStates.get(card));

            if (cardHoverStates.get(card)) {
                finalScale *= 1.05;
            }

            card.style.transform = `
                ${baseTransform}
                ${rotationTransform}
                translateX(${heartbeatOffset + randomWiggleTranslateOffset.x}px)
                translateY(${heartbeatOffset + randomWiggleTranslateOffset.y}px)
                rotate(${randomWiggleRotateOffset}deg)
                ${spiralingOffsetTransform}
                scale(${finalScale})
            `.replace(/\s+/g, ' ').trim();

            // Handle opacity/visibility based on movement type
            if (currentMovementType === 'randomAppearDisappear') {
                 // Lorderian visibility (opacity and pointer-events) is managed EXCLUSIVELY by startRandomAppearDisappearAnimation
                 // We only set the transition here to ensure smooth fades from the Lorderian scheduler.
                 card.style.transition = 'opacity 0.5s ease-in-out, transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            } else if (currentMovementType === 'twinkle') {
                card.style.opacity = twinkleOpacityOffset;
                card.style.pointerEvents = 'auto'; // Ensure interactive
            } else if (currentMovementType === 'spiraling') {
                card.style.opacity = finalOpacity;
                card.style.pointerEvents = 'auto'; // Ensure interactive
            } else {
                card.style.opacity = 1;
                card.style.pointerEvents = 'auto'; // Ensure interactive
            }
        });
    }

    async function initializeCardPositions() {
        updateSlotTransforms();
        const currentContainerAngle = parseFloat(container.dataset.currentRotation || 0);
        allCards.forEach((card, index) => {
            card.dataset.slotTransform = slotTransforms[index % numTotalCards];
        });
        applyCardBaseTransformsAndHover(currentContainerAngle);
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

    function showDetailPage(cardId) {
        detailPageParagraph.classList.add('hidden');
        detailPageTableContent.classList.add('hidden');
        detailPageListContent.classList.add('hidden');
        detailPageContainer.style.display = 'flex';

        const cardDetail = currentLangData.detailPageContent?.[cardId - 1];
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
                    break;
                default:
                    console.warn(`Unknown detail page type: ${cardDetail.type} for card ID: ${cardId}`);
                    break;
            }
        }

        detailPageBackButton.textContent = currentLangData.detailPageBackButtonText || "Back";

        detailPageContainer.classList.remove('hidden');
        container.style.display = 'none';
        if (focusedCardElement) focusedCardElement.style.display = 'none';
        languageMenu.style.display = 'none';
        isAnimationGloballyPaused = true;
        stopAllContinuousAnimations();
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
        languageMenu.style.display = 'block';
        unfocusCard();

        detailPageParagraph.classList.add('hidden');
        detailPageTableContent.classList.add('hidden');
        detailPageListContent.classList.add('hidden');
        detailPageTitle.textContent = '';
        detailPageParagraph.textContent = '';
        detailPageTableContent.querySelector('thead').innerHTML = '';
        detailPageTableContent.querySelector('tbody').innerHTML = '';
        detailPageListContent.querySelector('ul').innerHTML = '';

        startCurrentContinuousAnimation();
    }

    function handleCardClick(cardElement) {
        if (!detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden')) return;
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
        const currentContainerAngle = parseFloat(container.dataset.currentRotation || 0);
        const rotationZ = (currentMovementType === 'centralCircle') ? `rotateZ(${-currentContainerAngle}deg)` : '';
        cardElement.style.transform = `${rotationZ} translate(0px, 0px) scale(1.8) rotateY(0deg)`;
        
        // Ensure this specific card is visible and interactive while focused
        cardElement.style.opacity = 1;
        cardElement.style.pointerEvents = 'auto';

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
            const currentContainerAngle = parseFloat(container.dataset.currentRotation || 0);
            const baseTransform = cardToUnfocus.dataset.slotTransform || 'translateX(0px) translateY(0px)';
            const rotationTransform = (currentMovementType === 'centralCircle') ? `rotate(${-currentContainerAngle}deg)` : '';
            cardToUnfocus.style.transform = `${baseTransform} ${rotationTransform}`;

            if (focusedCardElement === cardToUnfocus) {
               focusedCardElement = null;
               isAnimationGloballyPaused = false; // Resume main animation loop
            }
            // IMPORTANT: Let startCurrentContinuousAnimation (which means Lorderian if active)
            // manage visibility of this card again after unfocus.
            startCurrentContinuousAnimation();
        }, 300);
    }

    function startTwinkleAnimation() {
        if (twinkleAnimationFrameId) cancelAnimationFrame(twinkleAnimationFrameId);
        twinkleStartTime = performance.now();

        function animateTwinkle() {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden')) {
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

        function animateHeartbeat() {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden')) {
                heartbeatAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            heartbeatAnimationFrameId = requestAnimationFrame(animateHeartbeat);
        }
        heartbeatAnimationFrameId = requestAnimationFrame(animateHeartbeat);
    }

    function startSpiralingAnimation() {
        if (spiralingAnimationFrameId) cancelAnimationFrame(spiralingAnimationFrameId);
        spiralingStartTime = performance.now();

        function animateSpiraling() {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden')) {
                spiralingAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            spiralingAnimationFrameId = requestAnimationFrame(animateSpiraling);
        }
        spiralingAnimationFrameId = requestAnimationFrame(animateSpiraling);
    }

    function startRandomWiggleAnimation() {
        if (randomWiggleAnimationFrameId) cancelAnimationFrame(randomWiggleAnimationFrameId);
        randomWiggleStartTime = performance.now();

        function animateRandomWiggle() {
            if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden')) {
                randomWiggleAnimationFrameId = null;
                return;
            }
            applyCardBaseTransformsAndHover(0);
            randomWiggleAnimationFrameId = requestAnimationFrame(animateRandomWiggle);
        }
        randomWiggleAnimationFrameId = requestAnimationFrame(animateRandomWiggle);
    }

    async function animateContainerRotation(targetRotationDegrees, durationMs) {
        return new Promise(resolve => {
            const startAngle = parseFloat(container.dataset.currentRotation || 0);
            const startTime = performance.now();
            let animationFrameId;

            function step(currentTime) {
                if (isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden') || !validationDialogOverlay.classList.contains('hidden') || !faqPageContainer.classList.contains('hidden')) {
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
                    applyCardBaseTransformsAndHover(0);
                }

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(step);
                } else {
                    if (currentMovementType === 'centralCircle') {
                        container.style.transform = `${containerInclinationTransform} rotate(${targetRotationDegrees}deg)`;
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

    async function animationSequence() {
        if (allCards.length > 0 && !allCards[0].dataset.listenersAttached) {
            allCards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    if (!isAnimationGloballyPaused && validationDialogOverlay.classList.contains('hidden') && faqPageContainer.classList.contains('hidden')) cardHoverStates.set(card, true);
                });
                card.addEventListener('mouseleave', () => {
                    if (!isAnimationGloballyPaused && validationDialogOverlay.classList.contains('hidden')) cardHoverStates.set(card, false);
                });
                card.dataset.listenersAttached = 'true';
            });
        }

        while (true) {
            if (isAnimationGloballyPaused) {
                stopAllContinuousAnimations();
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (!isAnimationGloballyPaused && validationDialogOverlay.classList.contains('hidden') && initialDialogOverlay.classList.contains('hidden') && faqPageContainer.classList.contains('hidden')) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
                startCurrentContinuousAnimation();
            }

            applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0));

            const cycleDuration = currentRotationDurationMs;

            if (currentMovementType === 'centralCircle') {
                const randomDirection = Math.random() < 0.5 ? 1 : -1;
                let currentAngle = parseFloat(container.dataset.currentRotation || 0);
                const targetAngle = currentAngle + (360 * randomDirection);
                await animateContainerRotation(targetAngle, cycleDuration);

                if (!isAnimationGloballyPaused && validationDialogOverlay.classList.contains('hidden') && initialDialogOverlay.classList.contains('hidden') && faqPageContainer.classList.contains('hidden')) {
                    container.style.transition = 'none';
                    container.style.transform = `${containerInclinationTransform} rotate(0deg)`;
                    container.dataset.currentRotation = "0";
                    applyCardBaseTransformsAndHover(0);
                    await new Promise(r => setTimeout(r, 50));
                    await repositionAllCards();
                }
            } else if (currentMovementType === 'randomAppearDisappear') {
                await new Promise(r => setTimeout(r, 50));
            }
            else {
                await new Promise(r => setTimeout(r, 50));
            }
        }
    }

    // NEW: Function to load FAQ data from JSON
    async function loadFaqData() {
        if (faqLoaded && faqData) return; // Prevent re-loading

        try {
            const response = await fetch('lang/faq.json'); // Changed path to directly access lang/faq.json
            if (!response.ok) {
                throw new Error(`Failed to load FAQ file: lang/faq.json (status: ${response.status})`);
            }
            faqData = await response.json();
            faqLoaded = true;

            // Populate FAQ content
            if (faqTitleElement) faqTitleElement.textContent = faqData.faqTitle || "FAQ";
            if (faqBackButton) faqBackButton.textContent = faqData.faqBackButtonText || "Back";
            
            faqQuestionsAnswersContainer.innerHTML = ''; // Clear previous content
            faqData.questionsAndAnswers.forEach(qa => {
                const h4 = document.createElement('h4');
                h4.textContent = qa.letter;
                const h3 = document.createElement('h3');
                h3.textContent = qa.question;
                const p = document.createElement('p');
                p.textContent = qa.answer;
                faqQuestionsAnswersContainer.append(h4, h3, p);
            });

        } catch (error) {
            console.error("Error loading FAQ data:", error);
            if (faqQuestionsAnswersContainer) faqQuestionsAnswersContainer.innerHTML = '<p>Failed to load FAQ content.</p>';
        }
    }

    // NEW: Function to show the FAQ page
    async function showFaqPage() {
        // Save current theme state
        lastThemeFontFamily = document.body.style.fontFamily;
        lastThemeBackgroundColor = document.body.style.backgroundColor;
        lastThemeBackgroundImage = document.body.style.backgroundImage;
        lastThemeBackgroundPosition = root.style.getPropertyValue('--theme-background-position');
        lastThemeMovementType = currentMovementType;

        // Load FAQ data (only once)
        await loadFaqData();

        // Pause main application
        isAnimationGloballyPaused = true;
        stopAllContinuousAnimations();

        // Hide main content
        document.querySelector('.header-container').classList.add('hidden');
        container.classList.add('hidden');
        detailPageContainer.classList.add('hidden');
        languageMenu.style.display = 'none';

        // Apply FAQ page specific theme from faqData.themeConfig
        if (faqData && faqData.themeConfig) {
            const faqThemeConfig = faqData.themeConfig;
            
            // Apply theme properties directly to the body and root CSS variables
            document.body.style.fontFamily = faqThemeConfig.fontFamily || 'Inter, sans-serif';
            document.body.style.backgroundColor = faqThemeConfig.backgroundColor || '#ffffff';
            document.body.style.backgroundImage = faqThemeConfig.backgroundImage || 'none';
            root.style.setProperty('--theme-background-position', faqThemeConfig.backgroundPosition || 'center center');

            root.style.setProperty('--theme-primary-color', faqThemeConfig.primaryColor);
            root.style.setProperty('--theme-secondary-color', faqThemeConfig.secondaryColor);
            root.style.setProperty('--theme-text-color', faqThemeConfig.textColor);
            root.style.setProperty('--theme-header-color', faqThemeConfig.headerColor);
            root.style.setProperty('--theme-card-back-color', faqThemeConfig.cardBackColor || '#1e293b');
            
            const primaryRgb = hexToRgb(faqThemeConfig.primaryColor);
            const secondaryRgb = hexToRgb(faqThemeConfig.secondaryColor);
            if (primaryRgb) root.style.setProperty('--theme-primary-color-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
            if (secondaryRgb) root.style.setProperty('--theme-secondary-color-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
        } else {
            console.warn("FAQ data or themeConfig not found, applying default/previous theme to FAQ page.");
            // Fallback to current/default theme if lang/faq.json doesn't have themeConfig
            // This case should ideally not happen if lang/faq.json is properly formatted
            document.body.style.fontFamily = lastThemeFontFamily;
            document.body.style.backgroundColor = lastThemeBackgroundColor;
            document.body.style.backgroundImage = lastThemeBackgroundImage;
            root.style.setProperty('--theme-background-position', lastThemeBackgroundPosition);
        }

        // Show FAQ page
        faqPageContainer.classList.remove('hidden');
    }

    // NEW: Function to hide the FAQ page
    async function hideFaqPage() {
        faqPageContainer.classList.add('hidden');

        // Restore previous theme to body
        document.body.style.fontFamily = lastThemeFontFamily;
        document.body.style.backgroundColor = lastThemeBackgroundColor;
        document.body.style.backgroundImage = lastThemeBackgroundImage;
        root.style.setProperty('--theme-background-position', lastThemeBackgroundPosition);
        
        // Reload the previous full theme to apply all theme variables correctly
        await loadLanguage(languageSelector.value); // languageSelector.value holds the current main language

        // Show main content
        document.querySelector('.header-container').classList.remove('hidden');
        container.classList.remove('hidden');
        languageMenu.style.display = 'block';

        // Resume animations
        isAnimationGloballyPaused = false;
        startCurrentContinuousAnimation();
    }
    // END NEW FAQ PAGE LOGIC


    languageSelector.addEventListener('change', async (event) => {
        stopAllContinuousAnimations();
        await loadLanguage(event.target.value);
        await repositionAllCards();
    });

    initialLanguageSelector.addEventListener('change', async (event) => {
        await loadLanguage(event.target.value);
        languageSelector.value = event.target.value;
    });

    enterButton.addEventListener('click', async () => {
        initialDialogOverlay.classList.add('hidden');
        document.querySelector('.header-container').classList.remove('hidden');
        container.classList.remove('hidden');
        languageMenu.classList.remove('hidden');

        isAnimationGloballyPaused = false;
        startCurrentContinuousAnimation();
        await repositionAllCards();
    });

    // NEW: FAQ Button Click Listener
    faqButton.addEventListener('click', showFaqPage);
    // END NEW

    validationYesButton.addEventListener('click', () => {
        validationDialogOverlay.classList.add('hidden');
        isAnimationGloballyPaused = false;
        startCurrentContinuousAnimation();
        if (cardToFlipAfterValidation) {
            cardToFlipAfterValidation.dataset.validated = 'true';
            handleCardClick(cardToFlipAfterValidation);
            cardToFlipAfterValidation = null;
        }
    });

    validationNoButton.addEventListener('click', () => {
        validationDialogOverlay.classList.add('hidden');
        isAnimationGloballyPaused = false;
        startCurrentContinuousAnimation();
        cardToFlipAfterValidation = null;
    });

    detailPageBackButton.addEventListener('click', hideDetailPage);

    faqBackButton.addEventListener('click', hideFaqPage); // Ensure FAQ back button is handled

    window.addEventListener('resize', () => {
        if (allCards.length === 0) {
            createCards();
        }
        initializeCardPositions();
        repositionAllCards();
    });

    createCards();
    initializeCardPositions();
    
    languageOptions.forEach(lang => {
        const option1 = document.createElement('option');
        option1.value = lang.value;
        option1.textContent = lang.text;
        initialLanguageSelector.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = lang.value;
        option2.textContent = lang.text;
        languageSelector.appendChild(option2);
    });

    languageSelector.value = initialLanguageSelector.value;

    // Load initial theme for the main app
    await loadLanguage(initialLanguageSelector.value);
    await loadFaqData(); // Load FAQ data on initial page load


    document.querySelector('.header-container').classList.add('hidden');
    document.querySelector('.card-circle-container').classList.add('hidden');
    detailPageContainer.classList.add('hidden');
    faqPageContainer.classList.add('hidden'); // Ensure FAQ is hidden initially

    animationSequence();
});
