async function fetchGravatarProfile(event) {
    /* 
    In deze functie fetchen wij de gravatar profile van de gebruiker. 
    Door de email te hashen en dan te fetchen van de gravatar api.
    Ik creer dan een key in de localstorage met de email van de gebruiker om later de scores op te slaan.
    als de gebruiker al een key heeft dan wordt er niks gedaan.
    */
    event.preventDefault();
    const email = document.querySelector('#email').value;

    /* 
     ik heb de crypto-js library niet geinstalleert want ik gebruik een cdn link in de html. 
     Maar het geeft mij een error daarom disable ik het met eslint maar de code werkt. 
     */
    // eslint-disable-next-line no-undef
    const emailHash = CryptoJS.MD5(email).toString();

    const response = await fetch(`https://gravatar.com/${emailHash}.json`);
    const data = await response.json();

    document.querySelector('#profileInfo').innerHTML = `
        <h2>Profile Info</h2>
        <div id="profileInfoContent">
            <div id="profileImage"><img src="${data.entry[0].thumbnailUrl}" alt="Profile Image"></div>
            <div>
                <h3 id="profileName">${data.entry[0].displayName}</h3>
                <p id="preferredUsername">${data.entry[0].preferredUsername}</p>
            </div>
        </div>
    `;

    document.querySelector('main').classList.remove('blur');

    const currentUser = email;
    if (!localStorage.getItem(currentUser)) {
        localStorage.setItem(currentUser, JSON.stringify([]));
    }
    displayPerformanceScores();
}
async function fetchRandomText() {
    /* 
    In deze functie fetchen wij random text van de chucknorris api.
    als de text kleiner is dan 50 dan wordt elke letter, spatie ne symbol in een spam gezet
    zodat wij het later kunnen verbeteren. En als de text groter is dan 50 dan wordt de functie opnieuw aangeroepen.
    En ik roep deze functie op in het begin zodat het gelijk een text heeft.
    */
    const response = await fetch('https://api.chucknorris.io/jokes/random');
    const data = await response.json();

    const text = data.value;
    const textLength = 50;

    // hier is het inplaats van (text.length < textLength) (text.length > textLength) 
    // maar ik wilde het verbetring makelijker maken voor jullie 
    // en textLength is nu 50 maar normal is het 100 of meer
    if (text.length < textLength) {
        const testTextarea = document.querySelector('#test-text');
        testTextarea.innerHTML = text.split('').map(char => `<span>${char}</span>`).join('');
    } else {
        fetchRandomText();
    }
}
fetchRandomText();
document.querySelector('#login-btn').addEventListener('click', fetchGravatarProfile);

const testInput = document.querySelector('#test-input');
const mistakesElement = document.querySelector('#mistakes');
const correctSound = new Audio('./sounds/correct.mp3');
const incorrectSound = new Audio('./sounds/wrong.mp3');

const timerElement = document.querySelector('#timer');
let timer;
let timeLeft = 30;
let mistakes = 0;

testInput.addEventListener('input', () => {
    /* 
    In deze event linster luisteren wij naar de input van de gebruiker.
    Als de gebruiker iets typt dan kijken wij of het gelijk is aan de text die wij hebben.
    Dan kleuren wij die groen en spelen wij een geluid af.
    Als het niet gelijk is dan kleuren wij die rood, wij telen 1 bij de mistakes en spelen wij een geluid af.
    */

    /*
    Als de timer nog niet is gestart dan starten wij die.
    Wij telen 1 van de timeLeft en updaten wij de timerElement. 
    */
    if (!timer) {
        timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft + 's';

            if (timeLeft <= 0) {
                clearInterval(timer);
                testInput.disabled = true;
            }
        }, 1000);
    }

    const textSpans = document.querySelector('#test-text').children;
    const userInput = testInput.value;

    if (userInput[userInput.length - 1] !== textSpans[userInput.length - 1].textContent) {
        mistakes++;
        mistakesElement.textContent = mistakes;
        textSpans[userInput.length - 1].style.color = 'red';

        // cloneNode is gegenereerd door GPT zodat de audio bij elke toets afspeelt en niet wacht tot de vorige klaar is.
        const cloneIncorrectSound = incorrectSound.cloneNode();
        cloneIncorrectSound.play();
    } else {
        textSpans[userInput.length - 1].style.color = 'green';

        // cloneNode is gegenereerd door GPT zodat de audio bij elke toets afspeelt en niet wacht tot de vorige klaar is.
        const cloneCorrectSound = correctSound.cloneNode();
        cloneCorrectSound.play();
    }

    /* 
    wij kijken of wat de gebruiker heeft getypt gelijk is aan de text die wij hebben.
    als het gelijk is dan stoppen wij de test en laten wij de resultaten zien.
    */
    if (userInput.length === textSpans.length) {
        stopTest(showResults());
        displayPerformanceScores();
    }
});

// Stop de test laat de resultaten zien als de gebruiker op stop klikt 
// of esc drukt dan stopt de test maar laaten wij de rusultaten niet zien.
let userStoppedTest = false;
const stopBtn = document.querySelector('#stop-btn');
function stopTest() {
    userStoppedTest = true;
    clearInterval(timer);
    testInput.disabled = true;
}

// esc stopt de test
stopBtn.addEventListener('click', stopTest);
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        stopTest();
        displayPerformanceScores();
    }
});


// Backspace is uitgeschakeld tot wanneer de gebruiker het inschakelt. 

const enableBackspace = document.querySelector('#enable-backspace');
testInput.addEventListener('keydown', (event) => {
    if (!enableBackspace.checked && event.keyCode === 8) {
        event.preventDefault();
    }
});

function calculatePerformanceScore(totalTime, errorPercentage) {
    // Deze calcualtie is gemaakt door GPT
    // Zijn idee om errorPercetage te gebruiken.
    return (100 - errorPercentage) / totalTime;
}

function showResults() {
    /* 
    In deze functie laten wij de resultaten zien van de gebruiker. 
    Wanneer de gebruiker op stop klikt dan gaan wij uit deze functie en laten wij de resultaten niet zien.
    */
    if (userStoppedTest) {
        userStoppedTest = false;
        return;
    }

    const totalCharacters = testInput.value.length;
    const errorPercentage = (mistakes / totalCharacters) * 100;
    const totalSeconds = 30;
    const totalTime = totalSeconds - timeLeft;
    const performanceScore = calculatePerformanceScore(totalTime, errorPercentage);

    savePerformanceScore(performanceScore);
    displayPerformanceScores();

    const resultsElement = document.querySelector('#results');
    resultsElement.innerHTML = `
        <p>Mistakes: ${mistakes}</p>
        <p>Total time: ${totalTime}s</p>
        <p>Score: ${performanceScore.toFixed(2)}</p>
    `;
}

stopBtn.addEventListener('click', () => {
    stopTest();
    showResults();
});

function savePerformanceScore(score) {
    /* 
        Wij nemen eerst de email van de user.
        Wij nemen de email en wij gebruiken .trim()
        Wij plaatsen de score in de localstorage als een value van de KEY of EMAIL.
        Wij pushen de score en en de tijd met de datum van de score.
        Wij zetten het in de localstorage onder de KEY of EMAIL van de gebruiker.
    */
    const emailElement = document.querySelector('#email');

    let currentUser = emailElement.value;
    currentUser = currentUser.trim();

    let currentUserScores = localStorage.getItem(currentUser);
    currentUserScores = JSON.parse(currentUserScores);

    const newScore = { score: score, timestamp: new Date().toISOString() };
    currentUserScores.push(newScore);

    const updatedScoresJson = JSON.stringify(currentUserScores);
    localStorage.setItem(currentUser, updatedScoresJson);
}

function displayPerformanceScores() {
    /* 
        Wij nemen de email van de user.
        Wij nemen de opgeslagen scores van de gebruiker uit de localstorage als er geen is dan gaat de score in een lege array
        Wij rangschikken de scores van hoog naar laag.
        Wij nemen de top 3 scores
        Wij platsen een li in de ul met de score en de datum en de tijd van de score.
        Wij delen de li in meerdere spans zodat het gemakklijker is om te stylen.
    */
    const currentUser = document.querySelector('#email').value;
    const scores = JSON.parse(localStorage.getItem(currentUser)) || [];

    scores.sort((a, b) => b.score - a.score);

    const topScores = scores.slice(0, 3);

    const scoresList = document.querySelector('#performance');
    scoresList.innerHTML = '';
    topScores.forEach((entry, index) => {
        const scoreItem = document.createElement('li');

        const scoreIndex = document.createElement('span');
        scoreIndex.classList.add('score-index');
        scoreIndex.textContent = `Score ${index + 1}: `;
        scoreItem.appendChild(scoreIndex);

        const formattedScore = document.createElement('span');
        formattedScore.classList.add('score');
        formattedScore.textContent = parseFloat(entry.score).toFixed(2);
        scoreItem.appendChild(formattedScore);

        const scoreDate = document.createElement('span');
        scoreDate.classList.add('score-date');
        scoreDate.textContent = ` (${new Date(entry.timestamp).toLocaleString()})`;
        scoreItem.appendChild(scoreDate);

        scoresList.appendChild(scoreItem);
    });
}

const resetBtn = document.querySelector('#reset-btn');

function resetTest() {
    // Als de gebruiker op reset klikt dan reseten wij de timer.
    clearInterval(timer);
    const totalSeconds = 30;
    timer = null;
    timeLeft = totalSeconds;
    timerElement.textContent = timeLeft + 's';

    // Wij reseten de mistakes.
    mistakes = 0;
    mistakesElement.textContent = mistakes;

    // Wij reseten de textarea.
    testInput.value = '';

    // Wij fetchen een nieuwe text.
    fetchRandomText();

    // Wij zetten de input weer aan.
    testInput.disabled = false;

    // Wij reseten de resultaten.
    const resultsElement = document.querySelector('#results');
    resultsElement.innerHTML = '';

    // Wij tonen de rusultaat van de nieuwe test.
    showResults();
}

// Luisteren of de gebruiker op de reset knop klikt.
resetBtn.addEventListener('click', resetTest);