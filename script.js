document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.card-circle-container');
    const languageSelector = document.getElementById('languageSelector');
    const speedSlider = document.getElementById('speedSlider');
    const speedValueDisplay = document.getElementById('speedValueDisplay');
    const detailPageContainer = document.getElementById('detailPageContainer');
    const detailPageTitle = document.getElementById('detailPageTitle');
    const detailPageQuote = document.getElementById('detailPageQuote');
    const detailPageBackButton = document.getElementById('detailPageBackButton');

    let allCards = []; 
    const numTotalCards = 7;

    let currentRotationDurationMs = parseInt(speedSlider.value) * 1000;
    let currentRadius = 250;
    let slotTransforms = []; 
    let cardHoverStates = new Map();
    let isAnimationGloballyPaused = false;
    let focusedCardElement = null;

    let currentLangData = {}; // To store loaded language JSON
    const loadedLanguages = {}; // Cache for loaded language files

    // --- Image Paths and Text Colors (Defined directly in script.js for local image setup) ---
    // IMPORTANT: Update these paths to match your actual image files and extensions.
    const languageImageStyles = {
        pragmatic: { 
            text: '#FFFFFF', 
            imagePaths: [
                'images/pragmatic/card1.png', 'images/pragmatic/card2.png', 'images/pragmatic/card3.png',
                'images/pragmatic/card4.png', 'images/pragmatic/card5.png', 'images/pragmatic/card6.png', 'images/pragmatic/card7.png'
            ]
        },
        talmudic: { 
            text: '#FFFFFF',
            imagePaths: [
                'images/talmudic/card1.png', 'images/talmudic/card2.png', 'images/talmudic/card3.png',
                'images/talmudic/card4.png', 'images/talmudic/card5.png', 'images/talmudic/card6.png', 'images/talmudic/card7.png'
            ]
        },
        zoharian: { 
            text: '#FFFFFF',
            imagePaths: [
                'images/zoharian/card1.png', 'images/zoharian/card2.png', 'images/zoharian/card3.png',
                'images/zoharian/card4.png', 'images/zoharian/card5.png', 'images/zoharian/card6.png', 'images/zoharian/card7.png'
            ]
        },
        sephorian: { 
            text: '#000000', // Example: Black text if images are very light
            imagePaths: [
                'images/sephorian/card1.png', 'images/sephorian/card2.png', 'images/sephorian/card3.png',
                'images/sephorian/card4.png', 'images/sephorian/card5.png', 'images/sephorian/card6.png', 'images/sephorian/card7.png'
            ]
        },
        experimental: { 
            text: '#FFFFFF', 
            imagePaths: [
                'images/experimental/card1.png', 'images/experimental/card2.png', 'images/experimental/card3.png',
                'images/experimental/card4.png', 'images/experimental/card5.png', 'images/experimental/card6.png', 'images/experimental/card7.png'
            ]
        }
    };

    // --- Language Data Loading ---
    async function loadLanguage(langKey) {
        if (loadedLanguages[langKey]) {
            currentLangData = loadedLanguages[langKey];
            updateUIWithLanguageData();
            return;
        }

        try {
            // Show some loading state if necessary, e.g., on cards
            allCards.forEach(card => {
                const front = card.querySelector('.card-front');
                if (front) front.textContent = 'Loading...';
            });

            const response = await fetch(`lang/${langKey}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${langKey}.json (status: ${response.status})`);
            }
            const data = await response.json();
            currentLangData = data;
            loadedLanguages[langKey] = data; // Cache it
            updateUIWithLanguageData();
        } catch (error) {
            console.error("Error loading language data:", error);
            // Fallback to English or show error message
            if (langKey !== 'pragmatic') { // Avoid infinite loop if pragmatic itself fails
                await loadLanguage('pragmatic'); // Try loading default
            } else {
                // Display a more prominent error if default fails
                allCards.forEach(card => {
                    const front = card.querySelector('.card-front');
                    if (front) front.textContent = 'Language Error';
                });
            }
        }
    }

    function updateUIWithLanguageData() {
        if (!currentLangData || Object.keys(currentLangData).length === 0) {
            console.warn("No language data loaded to update UI.");
            return;
        }
        updateCardAppearance(); // Update card content and styles
        // Update other potential UI elements if they were moved to JSON
        // e.g., speedValueDisplay.previousSibling.textContent = currentLangData.rotationSpeedLabel || "Rotation Speed";
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
                    const cardId = e.target.dataset.cardId;
                    showDetailPage(cardId); // Language is now from currentLangData
                } else {
                    handleCardClick(card);
                }
            });
        }
    }

    function updateCardAppearance() { // No languageKey param needed, uses currentLangData
        if (!currentLangData || !currentLangData.cardFrontTexts) return; // Ensure data is loaded

        const frontTexts = currentLangData.cardFrontTexts;
        const backContent = currentLangData.cardBackContents;
        const imageStyleInfo = languageImageStyles[languageKey] || languageImageStyles.pragmatic; // Use new object for imagess
        const learnMoreText = currentLangData.learnMoreLinkText;
        
        allCards.forEach(card => {
            const cardId = parseInt(card.dataset.id, 10);
            const frontFace = card.querySelector('.card-front');
            const backFace = card.querySelector('.card-back');
            const backH3 = backFace ? backFace.querySelector('h3') : null;
            const backP = backFace ? backFace.querySelector('p') : null;
            const link = backFace ? backFace.querySelector('.learn-more-link') : null;

            const cardIdText = frontTexts[cardId - 1] || `Card ${cardId}`;

            if (frontFace) {
                frontFace.textContent = cardIdText;
                if (imageStyleInfo) {
                    frontFace.style.color = imageStyleInfo.text; 
                    if (imageStyleInfo.imagePaths && imageStyleInfo.imagePaths[index]) {
                        frontFace.style.backgroundImage = `url('${imageStyleInfo.imagePaths[index]}')`;
                        frontFace.style.backgroundColor = 'transparent'; // Ensure no solid color behind image
                    } else {
                        frontFace.style.backgroundImage = 'none'; 
                        frontFace.style.backgroundColor = '#4A5568'; // Fallback color if image path is missing
                    }
                }
                frontFace.style.backgroundImage = 'none'; 
            }
            if (backH3 && backP && cardId > 0 && cardId <= backContent.length) {
                backH3.textContent = backContent[cardId - 1].title;
                backP.textContent = backContent[cardId - 1].p;
            }
            if (link) link.textContent = learnMoreText;
        });
    }

    function updateSlotTransforms() { 
        const screenWidth = window.innerWidth; 
        if (screenWidth <= 480) { currentRadius = 120; } 
        else if (screenWidth <= 768) { currentRadius = 180; } 
        else { currentRadius = 250; } 
        slotTransforms = [`translateX(0px) translateY(0px)`]; 
        const numOuterSlots = 6; 
        for (let i = 0; i < numOuterSlots; i++) { 
            const angle = (360 / numOuterSlots) * i; 
            slotTransforms.push(`rotate(${angle}deg) translateX(${currentRadius}px) rotate(-${angle}deg)`); 
        } 
    }

    function applyCardBaseTransformsAndHover(containerCurrentAngle = 0) { 
        if (isAnimationGloballyPaused && focusedCardElement && detailPageContainer.style.display === 'none') { 
            allCards.forEach(card => { 
                if (card === focusedCardElement) return; 
                const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)'; 
                card.classList.remove('is-hovered'); 
                card.style.transform = `${baseTransform} rotate(${-containerCurrentAngle}deg)`; 
            }); 
            return; 
        } 
        if (detailPageContainer.style.display === 'flex') return; 
        allCards.forEach(card => { 
            const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)'; 
            let hoverEffectTransform = cardHoverStates.get(card) ? ' translateY(-15px) scale(1.05)' : ''; 
            if (cardHoverStates.get(card)) card.classList.add('is-hovered'); else card.classList.remove('is-hovered'); 
            card.style.transform = `${baseTransform} rotate(${-containerCurrentAngle}deg)${hoverEffectTransform}`; 
        }); 
    }

    async function initializeCardPositions() { // Made async to await language loading
        updateSlotTransforms(); 
        const currentContainerAngle = parseFloat(container.dataset.currentRotation) || 0; 
        allCards.forEach((card, index) => { 
            card.dataset.slotTransform = slotTransforms[index % numTotalCards]; 
        }); 
        applyCardBaseTransformsAndHover(currentContainerAngle); 
        await loadLanguage(languageSelector.value); // Load initial language
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
    
    languageSelector.addEventListener('change', async (event) => { // Made async
        await loadLanguage(event.target.value);
    });

    speedSlider.addEventListener('input', (event) => { 
        currentRotationDurationMs = parseInt(event.target.value) * 1000; 
        speedValueDisplay.textContent = `${event.target.value} seconds / rotation`; 
    });
    
    function showDetailPage(cardId) { // Removed language param, uses currentLangData
        if (!focusedCardElement) { return; }
        if (!currentLangData.detailPageQuotes || !currentLangData.cardFrontTexts) {
            console.error("Detail page content not loaded.");
            detailPageTitle.textContent = `Details for Card ${cardId}`;
            detailPageQuote.textContent = "Content loading or unavailable.";
        } else {
            const quotes = currentLangData.detailPageQuotes; 
            const frontTexts = currentLangData.cardFrontTexts; 
            const selectedQuote = quotes[cardId - 1]; 
            const selectedCardTitle = frontTexts[cardId - 1]; 
            detailPageTitle.textContent = selectedCardTitle || `Details for Card ${cardId}`; 
            detailPageQuote.textContent = selectedQuote || "No quote available for this selection.";
        }
        if (currentLangData.detailPageBackButtonText) {
            detailPageBackButton.textContent = currentLangData.detailPageBackButtonText;
        }
        
        detailPageContainer.style.display = 'flex'; 
        container.style.display = 'none'; 
        if (focusedCardElement) focusedCardElement.style.display = 'none'; 
        document.querySelector('.speed-slider-container').style.display = 'none'; 
        document.querySelector('.language-menu').style.display = 'none'; 
        isAnimationGloballyPaused = true; 
    }
    function hideDetailPage() { 
        detailPageContainer.style.display = 'none'; 
        container.style.display = 'flex'; 
        if(focusedCardElement) focusedCardElement.style.display = 'flex'; 
        document.querySelector('.speed-slider-container').style.display = 'block'; 
        document.querySelector('.language-menu').style.display = 'block'; 
        unfocusCard(); 
    }
    detailPageBackButton.addEventListener('click', hideDetailPage);

    function handleCardClick(cardElement) { 
        if (detailPageContainer.style.display === 'flex') return; 
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
        cardElement.style.transform = `rotateZ(${-currentContainerAngle}deg) translate(0px, 0px) scale(1.8) rotateY(0deg)`; 
        setTimeout(() => { 
            if (focusedCardElement === cardElement) { 
               cardElement.classList.add('is-flipped'); 
            } 
        }, 150); 
    }
    function unfocusCard() { 
        if (!focusedCardElement) return; 
        const cardToUnfocus = focusedCardElement; 
        cardToUnfocus.classList.remove('is-flipped'); 
        setTimeout(() => { 
            cardToUnfocus.classList.remove('card-focused'); 
            const currentContainerAngle = parseFloat(container.dataset.currentRotation) || 0; 
            const baseTransform = cardToUnfocus.dataset.slotTransform || 'translateX(0px) translateY(0px)'; 
            cardToUnfocus.style.transform = `${baseTransform} rotate(${-currentContainerAngle}deg)`; 
            if (focusedCardElement === cardToUnfocus) { 
               focusedCardElement = null; 
               isAnimationGloballyPaused = false; 
            } 
        }, 600); 
    }
    
    async function animateContainerRotation(targetRotationDegrees, durationMs) { 
        return new Promise(resolve => { 
            const startAngle = parseFloat(container.dataset.currentRotation || 0); 
            const startTime = performance.now(); 
            function step(currentTime) { 
                if(isAnimationGloballyPaused && focusedCardElement && detailPageContainer.style.display === 'none') { resolve(); return; } 
                if(detailPageContainer.style.display === 'flex') {resolve(); return;} 
                const elapsedTime = currentTime - startTime; 
                const progress = Math.min(elapsedTime / durationMs, 1); 
                const currentAngle = startAngle + (targetRotationDegrees - startAngle) * progress; 
                container.style.transform = `rotate(${currentAngle}deg)`; 
                container.dataset.currentRotation = currentAngle; 
                applyCardBaseTransformsAndHover(currentAngle); 
                if (progress < 1) { 
                    if (!isAnimationGloballyPaused || detailPageContainer.style.display === 'flex') { 
                        requestAnimationFrame(step); 
                    } else { resolve(); }
                } else { 
                    container.style.transform = `rotate(${targetRotationDegrees}deg)`; 
                    container.dataset.currentRotation = targetRotationDegrees % 360; 
                    applyCardBaseTransformsAndHover(targetRotationDegrees); 
                    resolve();
                }
            }
            requestAnimationFrame(step);
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

        await initializeCardPositions(); // Wait for initial language to load
        await repositionAllCards(); 
        await new Promise(r => setTimeout(r, 100)); 

        while (true) {
            if (isAnimationGloballyPaused) {
                await new Promise(resolve => { 
                    const interval = setInterval(() => {
                        if (!isAnimationGloballyPaused) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            applyCardBaseTransformsAndHover(parseFloat(container.dataset.currentRotation || 0)); 

            const rotationDuration = currentRotationDurationMs; 
            const randomDirection = Math.random() < 0.5 ? 1 : -1;
            let currentAngle = parseFloat(container.dataset.currentRotation || 0);
            const targetAngle = currentAngle + (360 * randomDirection);
            
            await animateContainerRotation(targetAngle, rotationDuration);

            if (isAnimationGloballyPaused) continue; 

            container.style.transition = 'none'; 
            container.style.transform = 'rotate(0deg)'; 
            container.dataset.currentRotation = "0"; 
            applyCardBaseTransformsAndHover(0); 
            await new Promise(r => setTimeout(r, 50));

            if (isAnimationGloballyPaused) continue;

            await repositionAllCards();
            await new Promise(r => setTimeout(r, 500));
        }
    }
    
    window.addEventListener('resize', () => { 
        initializeCardPositions(); // This should reload language if needed or use cached
        repositionAllCards(); 
    });

    animationSequence();
});