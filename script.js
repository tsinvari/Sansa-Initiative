document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const container = document.querySelector('.card-circle-container');
    const languageSelector = document.getElementById('languageSelector');
    const speedSlider = document.getElementById('speedSlider');
    const speedValueDisplay = document.getElementById('speedValueDisplay');
    const detailPageContainer = document.getElementById('detailPageContainer');
    const detailPageTitle = document.getElementById('detailPageTitle');
    const detailPageParagraph = document.getElementById('detailPageParagraph'); // Renamed from detailPageQuote
    const detailPageTableContent = document.getElementById('detailPageTableContent'); // New ref
    const detailPageListContent = document.getElementById('detailPageListContent');   // New ref
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
                'images/pragmatic/card7.jpeg', 'images/pragmatic/card4.jpeg', 'images/pragmatic/card7.jpeg',
                'images/pragmatic/card4.jpeg', 'images/pragmatic/card7.jpeg', 'images/pragmatic/card4.jpeg', 'images/pragmatic/card7.jpeg'
            ]
        },
        talmudic: {
            text: '#FFFFFF',
            imagePaths: [
                'images/talmudic/card7.jpeg', 'images/talmudic/card4.jpeg', 'images/talmudic/card7.jpeg',
                'images/talmudic/card4.jpeg', 'images/talmudic/card7.jpeg', 'images/talmudic/card4.jpeg', 'images/talmudic/card7.jpeg'
            ]
        },
        zoharian: {
            text: '#FFFFFF',
            imagePaths: [
                'images/zoharian/card7.jpeg', 'images/zoharian/card4.jpeg', 'images/zoharian/card7.jpeg',
                'images/zoharian/card4.jpeg', 'images/zoharian/card7.jpeg', 'images/zoharian/card4.jpeg', 'images/zoharian/card7.jpeg'
            ]
        },
        sephorian: {
            text: '#000000', // Example: Black text if images are very light
            imagePaths: [
                'images/sephorian/card7.jpeg', 'images/sephorian/card4.jpeg', 'images/sephorian/card7.jpeg',
                'images/sephorian/card4.jpeg', 'images/sephorian/card7.jpeg', 'images/sephorian/card4.jpeg', 'images/sephorian/card7.jpeg'
            ]
        },
        experimental: {
            text: '#FFFFFF',
            imagePaths: [
                'images/experimental/card7.jpeg', 'images/experimental/card4.jpeg', 'images/experimental/card7.jpeg',
                'images/experimental/card4.jpeg', 'images/experimental/card7.jpeg', 'images/experimental/card4.jpeg', 'images/experimental/card7.jpeg'
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

         // --- NEW: Apply Theme Styles ---
        const themeConfig = currentLangData.themeConfig;
        if (themeConfig) {
            document.body.style.fontFamily = themeConfig.fontFamily;
            // Use backgroundImage if available, otherwise fallback to backgroundColor
            if (themeConfig.backgroundImage) {
                document.body.style.backgroundImage = themeConfig.backgroundImage;
                document.body.style.backgroundColor = 'transparent'; // Ensure background color doesn't interfere
            } else {
                document.body.style.backgroundColor = themeConfig.backgroundColor;
                document.body.style.backgroundImage = ''; // Clear any existing background image
            }

            // Set CSS Variables for colors
            root.style.setProperty('--theme-primary-color', themeConfig.primaryColor);
            root.style.setProperty('--theme-secondary-color', themeConfig.secondaryColor);
            root.style.setProperty('--theme-text-color', themeConfig.textColor);
            root.style.setProperty('--theme-header-color', themeConfig.headerColor);
            root.style.setProperty('--theme-card-back-color', themeConfig.cardBackColor || '#1e293b');
        }
        // --- END NEW THEME APPLICATION ---f
        updateCardAppearance(languageSelector.value); // Pass the current language key
        // Update other potential UI elements if they were moved to JSON
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

    function updateCardAppearance(languageKey) { // Added languageKey param to select image styles
        if (!currentLangData || !currentLangData.cardFrontTexts || !currentLangData.cardBackContents) return;

        const frontTexts = currentLangData.cardFrontTexts;
        const backContent = currentLangData.cardBackContents;
        const imageStyleInfo = languageImageStyles[languageKey] || languageImageStyles.pragmatic; // Use new object for images
        const learnMoreText = currentLangData.learnMoreLinkText;

        allCards.forEach((card, index) => {
            const cardId = parseInt(card.dataset.id, 10);
            const frontFace = card.querySelector('.card-front');
            const frontTextContainer = frontFace ? frontFace.querySelector('.card-front-text-overlay') : null; // <--- NEW: Get reference to the new div
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
                        frontFace.style.backgroundSize = 'cover';
                        frontFace.style.backgroundRepeat = 'no-repeat';
                        frontFace.style.backgroundPosition = 'center';
                    } else {
                        frontFace.style.backgroundImage = 'none';
                        frontFace.style.backgroundColor = '#4A5568'; // Fallback color if image path is missing
                    }
                }
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
        if (isAnimationGloballyPaused && focusedCardElement && detailPageContainer.classList.contains('hidden')) {
            allCards.forEach(card => {
                if (card === focusedCardElement) return;
                const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
                card.classList.remove('is-hovered');
                card.style.transform = `${baseTransform} rotate(${-containerCurrentAngle}deg)`;
            });
            return;
        }
        // Use classList.contains('hidden') instead of style.display
        if (!detailPageContainer.classList.contains('hidden')) return;
        allCards.forEach(card => {
            const baseTransform = card.dataset.slotTransform || 'translateX(0px) translateY(0px)';
            let hoverEffectTransform = cardHoverStates.get(card) ? ' translateY(-15px) scale(1.05)' : '';
            if (cardHoverStates.get(card)) card.classList.add('is-hovered'); else card.classList.remove('is-hovered');
            card.style.transform = `${baseTransform} rotate(${-containerCurrentAngle}deg)${hoverEffectTransform}`;
        });
    }

    async function initializeCardPositions() {
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

    languageSelector.addEventListener('change', async (event) => {
        await loadLanguage(event.target.value);
    });

    speedSlider.addEventListener('input', (event) => {
        currentRotationDurationMs = parseInt(event.target.value) * 1000;
        speedValueDisplay.textContent = `${event.target.value} seconds / rotation`;
    });

    // --- NEW / MODIFIED: showDetailPage Function ---
    function showDetailPage(cardId) {
        if (!focusedCardElement) { return; } // Ensure a card was focused before showing detail

        // Hide all specific content blocks first
        detailPageParagraph.classList.add('hidden'); // Ensure it's hidden if not used
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
            detailPageParagraph.classList.remove('hidden'); // Always show paragraph

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
                    // Just title and paragraph are shown, which are handled above.
                    // No other specific elements to show.
                    break;
                default:
                    console.warn(`Unknown detail page type: ${cardDetail.type} for card ID: ${cardId}`);
                    break;
            }
        }

        if (currentLangData.detailPageBackButtonText) {
            detailPageBackButton.textContent = currentLangData.detailPageBackButtonText;
        }

        detailPageContainer.classList.remove('hidden'); // Show the detail page
        container.style.display = 'none'; // Hide card circle container
        if (focusedCardElement) focusedCardElement.style.display = 'none'; // Hide the focused card itself
        document.querySelector('.speed-slider-container').style.display = 'none';
        document.querySelector('.language-menu').style.display = 'none';
        isAnimationGloballyPaused = true;
    }

    // --- NEW: Helper function to populate table ---
    function populateTable(tableData) {
        const table = detailPageTableContent.querySelector('table');
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // Clear existing content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Populate headers
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

        // Populate rows
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

    // --- NEW: Helper function to populate list ---
    function populateList(listItems) {
        const ul = detailPageListContent.querySelector('ul');
        if (!ul) return;

        // Clear existing items
        ul.innerHTML = '';

        // Add new items
        if (listItems && listItems.length > 0) {
            listItems.forEach(itemText => {
                const li = document.createElement('li');
                li.textContent = itemText;
                ul.appendChild(li);
            });
        }
    }

    function hideDetailPage() {
        detailPageContainer.classList.add('hidden'); // Hide the detail page
        container.style.display = 'flex'; // Show card circle container
        if (focusedCardElement) focusedCardElement.style.display = 'flex'; // Show the focused card itself
        document.querySelector('.speed-slider-container').style.display = 'block';
        document.querySelector('.language-menu').style.display = 'block';
        unfocusCard();

        // Ensure all specific content blocks are hidden when closing
        detailPageParagraph.classList.add('hidden');
        detailPageTableContent.classList.add('hidden');
        detailPageListContent.classList.add('hidden');
        detailPageContainer.style.display = '';
        
    }
    detailPageBackButton.addEventListener('click', hideDetailPage);

    function handleCardClick(cardElement) {
        if (!detailPageContainer.classList.contains('hidden')) return; // If detail page is open, ignore card clicks
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
                if(isAnimationGloballyPaused && focusedCardElement && detailPageContainer.classList.contains('hidden')) { resolve(); return; }
                if(!detailPageContainer.classList.contains('hidden')) {resolve(); return;} // Check for 'hidden' class
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / durationMs, 1);
                const currentAngle = startAngle + (targetRotationDegrees - startAngle) * progress;
                container.style.transform = `rotate(${currentAngle}deg)`;
                container.dataset.currentRotation = currentAngle;
                applyCardBaseTransformsAndHover(currentAngle);
                if (progress < 1) {
                    if (!isAnimationGloballyPaused || !detailPageContainer.classList.contains('hidden')) { // Check for 'hidden' class
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

        await initializeCardPositions();
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
        initializeCardPositions();
        repositionAllCards();
    });

    animationSequence();
});