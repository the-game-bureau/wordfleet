        var dictionaryWords = {};

        function generateRandomCodes() {
            var codes = [];
            for (var i = 0; i < 5; i++) {
                codes.push(Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
            }
            document.getElementById('stampCodes').textContent = codes.join(' ');
        }

        function updateBattleTrackerTitle() {
            var battleTrackerElement = document.getElementById('battleTracker');
            
            // Try to get fleet name from URL params first (for direct links)
            var urlParams = new URLSearchParams(window.location.search);
            var fleetName = urlParams.get('fleet');
            
            if (fleetName) {
                var decodedFleetName = decodeURIComponent(fleetName.replace(/\+/g, ' '));
                battleTrackerElement.textContent = decodedFleetName.toUpperCase() + ' BATTLE TRACKER';
            } else {
                battleTrackerElement.textContent = 'BATTLE TRACKER';
            }
        }

        function loadWordsFromPost() {
            // For POST data, we need to check if we came from a form submission
            // This is a simplified approach since browsers don't expose POST data to JavaScript
            var urlParams = new URLSearchParams(window.location.search);
            var hasManualWords = false;
            
            // Check for manual words in URL (fallback method)
            var word5 = urlParams.get('word5');
            var word4 = urlParams.get('word4');
            var word3a = urlParams.get('word3a');
            var word3b = urlParams.get('word3b');
            var word2 = urlParams.get('word2');
            
            // If we have words, use them
            if (word5 && word4 && word3a && word3b && word2) {
                document.getElementById('ship5').textContent = word5.toUpperCase();
                document.getElementById('ship4').textContent = word4.toUpperCase();
                document.getElementById('ship3a').textContent = word3a.toUpperCase();
                document.getElementById('ship3b').textContent = word3b.toUpperCase();
                document.getElementById('ship2').textContent = word2.toUpperCase();
                hasManualWords = true;
            }
            
            if (hasManualWords) {
                updateDefenseManifest();
                return true;
            }
            
            return false; // No manual words found, need auto-generation
        }

        function updateDefenseManifest() {
            var ships = [
                document.getElementById('ship5').textContent,
                document.getElementById('ship4').textContent,
                document.getElementById('ship3a').textContent,
                document.getElementById('ship3b').textContent,
                document.getElementById('ship2').textContent
            ];

            var letterCounts = {};
            for (var i = 65; i <= 90; i++) {
                letterCounts[String.fromCharCode(i)] = 0;
            }

            ships.forEach(function(ship) {
                if (ship && ship !== '__' && ship !== '___' && ship !== '____' && ship !== '_____') {
                    for (var j = 0; j < ship.length; j++) {
                        var letter = ship[j];
                        if (letter >= 'A' && letter <= 'Z') {
                            letterCounts[letter]++;
                        }
                    }
                }
            });

            var defenseCountElements = document.querySelectorAll('.defense-manifest-count');
            var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            
            defenseCountElements.forEach(function(element, index) {
                element.style.display = 'block';
                var letter = letters[index];
                element.textContent = letterCounts[letter];
            });
        }

        function getWordOfLength(length) {
            if (dictionaryWords[length] && dictionaryWords[length].length > 0) {
                return dictionaryWords[length][Math.floor(Math.random() * dictionaryWords[length].length)];
            }
            return null;
        }

        function generateRandomWords() {
            var ship5 = getWordOfLength(5);
            var ship4 = getWordOfLength(4);
            var ship3a = getWordOfLength(3);
            var ship3b = getWordOfLength(3);
            var ship2 = getWordOfLength(2);

            if (ship5) document.getElementById('ship5').textContent = ship5;
            if (ship4) document.getElementById('ship4').textContent = ship4;
            if (ship3a) document.getElementById('ship3a').textContent = ship3a;
            if (ship3b) document.getElementById('ship3b').textContent = ship3b;
            if (ship2) document.getElementById('ship2').textContent = ship2;

            updateDefenseManifest();
        }

        function loadDictionary() {
            var possiblePaths = [
                'dictionaries/words.xml',
                'dictionary/words.xml', 
                'words.xml'
            ];

            function tryPath(pathIndex) {
                if (pathIndex >= possiblePaths.length) {
                    console.log('Dictionary not found - ships will show as underscores');
                    return;
                }

                var path = possiblePaths[pathIndex];
                fetch(path)
                    .then(function(response) {
                        if (!response.ok) {
                            return tryPath(pathIndex + 1);
                        }
                        return response.text();
                    })
                    .then(function(xmlText) {
                        if (!xmlText) {
                            return tryPath(pathIndex + 1);
                        }

                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                        
                        var wordLengthElements = xmlDoc.getElementsByTagName('WordLength');
                        if (wordLengthElements.length === 0) {
                            return tryPath(pathIndex + 1);
                        }
                        
                        for (var i = 0; i < wordLengthElements.length; i++) {
                            var wordLengthElement = wordLengthElements[i];
                            var length = parseInt(wordLengthElement.getAttribute('length'));
                            var wordElements = wordLengthElement.getElementsByTagName('Word');
                            
                            if (!dictionaryWords[length]) {
                                dictionaryWords[length] = [];
                            }
                            
                            for (var j = 0; j < wordElements.length; j++) {
                                var wordElement = wordElements[j];
                                var word = wordElement.textContent.trim().toUpperCase();
                                dictionaryWords[length].push(word);
                            }
                        }
                        
                        generateRandomWords();
                    })
                    .catch(function(error) {
                        tryPath(pathIndex + 1);
                    });
            }

            tryPath(0);
        }

        // UNIFIED PRINT FUNCTION - Detects desktop vs mobile
// Replace your existing handlePrint function with this enhanced version
function handlePrint() {
    if (typeof domtoimage === 'undefined') {
        alert('Print functionality is loading. Please try again in a moment.');
        return;
    }

    const printBtn = document.querySelector('button[onclick="handlePrint()"]');
    const originalText = printBtn.textContent;
    printBtn.textContent = 'PRINTING...';
    printBtn.disabled = true;

    function resetButton() {
        printBtn.textContent = originalText;
        printBtn.disabled = false;
    }

    // More comprehensive shadow removal for print mode
    const tempStyle = document.createElement('style');
    tempStyle.innerHTML = `
        .print-mode .launch-codes-stamp,
        .launch-codes-stamp {
            box-shadow: none !important;
            filter: none !important;
            -webkit-filter: none !important;
        }
        .print-mode .launch-codes-stamp::before,
        .launch-codes-stamp::before {
            display: none !important;
            box-shadow: none !important;
            background: none !important;
        }
        .print-mode .stamp-text,
        .stamp-text {
            text-shadow: none !important;
        }
        .print-mode .stamp-codes,
        .stamp-codes {
            text-shadow: none !important;
        }
    `;
    document.head.appendChild(tempStyle);

    // Add print-mode class to body for additional targeting
    document.body.classList.add('print-mode');

    setTimeout(() => {
        const pageElement = document.querySelector('.page');

        domtoimage.toPng(pageElement, {
            quality: 1.0,
            bgcolor: 'white',
            width: pageElement.offsetWidth * 2,
            height: pageElement.offsetHeight * 2,
            style: {
                transform: 'scale(2)',
                transformOrigin: 'top left',
                width: pageElement.offsetWidth + 'px',
                height: pageElement.offsetHeight + 'px'
            }
        }).then(dataUrl => {
            // Clean up
            document.head.removeChild(tempStyle);
            document.body.classList.remove('print-mode');
            
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                showMobileOverlay(dataUrl);
            } else {
                openDesktopPrint(dataUrl);
            }
            resetButton();
        }).catch(error => {
            console.error('Print generation failed:', error);
            // Clean up on error
            document.head.removeChild(tempStyle);
            document.body.classList.remove('print-mode');
            resetButton();
            alert('Print generation failed: ' + error.message + '. Please try again.');
        });
    }, 200); // Slightly longer delay to ensure styles apply
}        function showMobileOverlay(dataUrl) {
            var overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            
            var content = document.createElement('div');
            content.className = 'mobile-overlay-content';
            
            var title = document.createElement('h2');
            title.className = 'mobile-overlay-title';
            title.textContent = 'Save Your Battle Tracker';
            
            var img = document.createElement('img');
            img.className = 'mobile-overlay-image';
            img.src = dataUrl;
            
            var instructions = document.createElement('div');
            instructions.className = 'mobile-overlay-instructions';
            instructions.innerHTML = '<p><strong>📱 To Save & Print:</strong></p><p>1. Long press the image above</p><p>2. Select "Save to Photos"</p><p>3. Open your Photos app</p><p>4. Find the image and tap share</p><p>5. Select "Print"</p>';
            
            var closeBtn = document.createElement('button');
            closeBtn.className = 'mobile-overlay-close';
            closeBtn.textContent = 'Close';
            closeBtn.onclick = function() {
                document.body.removeChild(overlay);
            };
            
            content.appendChild(title);
            content.appendChild(img);
            content.appendChild(instructions);
            content.appendChild(closeBtn);
            overlay.appendChild(content);
            document.body.appendChild(overlay);
        }

        function openDesktopPrint(dataUrl) {
            var printWindow = window.open('', '_blank', 'width=800,height=600');
            var htmlContent = '<!DOCTYPE html><html><head><title>Word Fleet Battle Tracker - Print</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { margin: 0; padding: 0; background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; } img { max-width: 100vw; max-height: 100vh; width: auto; height: auto; object-fit: contain; } @media print { @page { size: letter; margin: 0.25in; } body { margin: 0; padding: 0; background: white; width: 100%; height: 100vh; display: flex; justify-content: center; align-items: center; } img { width: 100% !important; height: auto !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; } }</style></head><body><img src="' + dataUrl + '" alt="Word Fleet Battle Tracker" onload="window.focus(); setTimeout(function() { window.print(); }, 1000);" /></body></html>';
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        }

        window.addEventListener('load', function() {
            generateRandomCodes();
            updateBattleTrackerTitle();
            
            // Try to load words from POST/URL parameters first
            var wordsLoaded = loadWordsFromPost();
            
            // Only auto-generate if no words were provided
            if (!wordsLoaded) {
                loadDictionary();
            }
        });

        // Handle form submissions from other pages
        window.addEventListener('pageshow', function(event) {
            // Check if we came from a form submission
            if (event.persisted) {
                var wordsLoaded = loadWordsFromPost();
                if (!wordsLoaded) {
                    loadDictionary();
                }
            }
        });

        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                handlePrint();
            }
        });