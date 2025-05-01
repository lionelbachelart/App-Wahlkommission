function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
  loadFromSession();
  showMainView();
  const title = sessionStorage.getItem('customTitle');
  const defaultTime = sessionStorage.getItem('defaultTime');
  const quickTime = sessionStorage.getItem('quickTime');

  if (title) document.querySelector("header h1").textContent = title;
  if (defaultTime) document.getElementById("settingsDefaultTime").value = defaultTime;
  if (quickTime) document.getElementById("settingsQuickTime").value = quickTime;

  document.getElementById("timerDuration").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      createTimer();
    }
  });
});

let questions = [];
let names = [];
let currentQuestionIndex = -1;
let selectedNames = new Set(names);
let quickNames = [];
let quickIndex = -1;
let quickInterval = null;
let quickRemaining = 60;
let quickCircle = null;
let quickCircumference = 0;
const debateTimers = {};

function addQuestions() {
  const input = document.getElementById("questionInput").value;
  const newQuestions = input.split("\n").map(q => q.trim()).filter(q => q.length > 0);
  questions = questions.concat(newQuestions);
  updateSessionStorage();
  displayQuestions();
  document.getElementById('questionInputSection').classList.remove('active');
  document.getElementById('questionInput').value = '';
}

function addNames() {
  setTimeout(() => {
    const input = document.getElementById("nameInput").value;
    const newNames = input.split("\n").map(n => n.trim()).filter(n => n.length > 0);
    names = names.concat(newNames);
    updateSessionStorage();
    displayNames();
    selectedNames = new Set(names);
    document.getElementById('nameInputSection').classList.remove('active');
    document.getElementById('nameInput').value = '';
    newNames.forEach(name => createTimer(name, 10));
  }, 500);
}

function displayQuestions() {
  const questionList = document.getElementById("questionList");
  questionList.innerHTML = '';
  questions.forEach((question, index) => {
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = question;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = 'icon-delete';
    deleteBtn.onclick = () => {
      questions.splice(index, 1);
      updateSessionStorage();
      displayQuestions();
    };

    li.appendChild(text);
    li.appendChild(deleteBtn);
    li.classList.add('selected');
    questionList.appendChild(li);
  });
}

function displayNames() {
  const nameList = document.getElementById("nameList");
  nameList.innerHTML = '';
  names.forEach((name, index) => {
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = name;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = 'icon-delete';
    deleteBtn.onclick = () => {
      names.splice(index, 1);
      selectedNames.delete(name);
      updateSessionStorage();
      displayNames();
    };

    li.appendChild(text);
    li.appendChild(deleteBtn);
    li.classList.add('selected');
    li.onclick = (e) => {
      if (e.target !== deleteBtn) toggleNameSelection(li, name);
    };
    nameList.appendChild(li);
  });
}

function toggleNameSelection(li, name) {
  if (li.classList.contains('not-selected')) {
    li.classList.remove('not-selected');
    li.classList.add('selected');
    selectedNames.add(name);
  } else if (li.classList.contains('selected')) {
    li.classList.remove('selected');
    li.classList.add('not-selected');
    selectedNames.delete(name);
  }
}

function getRandomAndRemove(arr) {
  if (arr.length === 0) return "Keine Elemente mehr übrig!";
  const index = Math.floor(Math.random() * arr.length);
  return arr.splice(index, 1)[0];
}

function animateHighlight(listId, arr, callback) {
  let count = 0;
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    document.querySelectorAll(`#${listId} li`).forEach(li => li.classList.remove('highlight'));
    document.querySelectorAll(`#${listId} li`)[randomIndex].classList.add('highlight');
    count++;
    if (count > 15) {
      clearInterval(interval);
      document.querySelectorAll(`#${listId} li`).forEach(li => li.classList.remove('highlight'));
      callback(randomIndex);
    }
  }, 100);
}

function spinQuestion() {
  if (questions.length === 0) return alert("Keine Fragen geladen.");
  animateHighlight('questionList', questions, index => {
    currentQuestionIndex = index;
    const result = questions[index];
    document.getElementById("questionResult").textContent = result;
    document.getElementById("nextQuestionButton").style.display = 'inline-block';
    document.getElementById("spinQuestionButton").style.display = 'none';
  });
}

function nextQuestion() {
  if (currentQuestionIndex !== -1) {
    questions.splice(currentQuestionIndex, 1);
    displayQuestions();
    document.getElementById("questionResult").textContent = '';
    document.getElementById("nameResult").textContent = "";
    document.getElementById("nextQuestionButton").style.display = 'none';
    currentQuestionIndex = -1;
    document.querySelectorAll('#nameList li').forEach(li => {
      li.classList.remove('drawn');
      li.classList.add('selected');
    });
    selectedNames = new Set(names);
    document.getElementById("spinQuestionButton").style.display = 'inline-block';
  }
}

function spinName() {
  if (selectedNames.size === 0) return alert("Keine Namen ausgewählt.");
  const selectedNamesArray = Array.from(selectedNames);
  animateHighlight('nameList', selectedNamesArray, index => {
    const result = selectedNamesArray[index];
    document.getElementById("nameResult").textContent = result;
    document.querySelectorAll('#nameList li.selected').forEach(li => {
      if (li.textContent === result) {
        li.classList.remove('selected');
        li.classList.add('drawn');
      }
    });
    selectedNames.delete(result);
  });
}

function createTimer(nameArg = null, minutesArg = null) {
  const defaultMinutes = parseInt(sessionStorage.getItem('defaultTime')) || 10;
  const minutes = minutesArg !== null ? minutesArg : defaultMinutes;
  const name = nameArg !== null ? nameArg : document.getElementById("timerName").value;
  const list = document.getElementById("timerList");

  if (!name || isNaN(minutes) || minutes <= 0) {
    alert("Bitte Name und Zeit angeben!");
    return;
  }

  const duration = Math.round(minutes * 60);
  let remaining = duration;

  const li = document.createElement("li");
  const label = document.createElement("span");
  const timeDisplay = document.createElement("span");
  const statusDisplay = document.createElement("strong");
  const toggleBtn = document.createElement("button");
  const deleteBtn = document.createElement("button");
  const { svg, circle, circumference } = createTimerSVG();

  label.textContent = `${name}: `;
  timeDisplay.textContent = formatTime(remaining);
  statusDisplay.innerHTML = '<i class="fas fa-pause-circle"></i> Pausiert';
  toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.className = 'icon-delete';

  li.appendChild(svg);
  li.appendChild(label);
  li.appendChild(timeDisplay);
  li.appendChild(document.createTextNode(" – "));
  li.appendChild(statusDisplay);
  li.appendChild(document.createTextNode(" "));
  li.appendChild(toggleBtn);
  li.appendChild(deleteBtn);
  list.appendChild(li);

  let intervalId = null;
  let active = false;

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateDisplay() {
    timeDisplay.textContent = formatTime(remaining);
    const progress = (remaining / duration) * circumference;
    circle.setAttribute("stroke-dashoffset", progress);
  }

  function animateTimer(timestamp) {
    if (!li.startTime) li.startTime = timestamp;
    const elapsed = (timestamp - li.startTime) / 1000;
    const left = Math.max(duration - elapsed, 0);
    remaining = Math.ceil(left);

    updateDisplay();

    if (remaining > 0) {
      intervalId = requestAnimationFrame(animateTimer);
    } else {
      active = false;
      toggleBtn.disabled = true;
      statusDisplay.innerHTML = '<i class="fas fa-check-circle"></i> Fertig!';
      circle.setAttribute("stroke", "#f44336");
    }
  }

  toggleBtn.onclick = () => {
    if (active) {
      cancelAnimationFrame(intervalId);
      active = false;
      statusDisplay.innerHTML = '<i class="fas fa-pause-circle"></i> Pausiert';
      toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      startTime = null;
      remainingTime = parseFloat(timeDisplay.textContent.split(':')[0]) * 60 +
                      parseFloat(timeDisplay.textContent.split(':')[1]);
      interval = requestAnimationFrame(animateDebateTimer);;
      active = true;
      statusDisplay.innerHTML = '<i class="fas fa-play-circle"></i> Läuft';
      toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
  };

  deleteBtn.onclick = () => {
    cancelAnimationFrame(intervalId);
    li.remove();
  };

  updateDisplay();
}

function createTimerSVG() {
  const svgNS = "http://www.w3.org/2000/svg";

  const inQuickRound = document.getElementById("quickRoundView")?.style.display !== "none";
  const inDebateView = document.getElementById("debateView")?.style.display !== "none";

  let radius = 20;
  let strokeWidth = 7.5;

  if (inQuickRound) {
    radius = 40;
    strokeWidth = 15;
  } else if (inDebateView) {
    radius = 40;
    strokeWidth = 15;
  }

  const size = radius * 2 + strokeWidth + 4;
  const circumference = 2 * Math.PI * radius;

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);

  const circleBg = document.createElementNS(svgNS, "circle");
  circleBg.setAttribute("cx", size / 2);
  circleBg.setAttribute("cy", size / 2);
  circleBg.setAttribute("r", radius);
  circleBg.setAttribute("fill", "none");
  circleBg.setAttribute("stroke", "#e0d6f0");
  circleBg.setAttribute("stroke-width", strokeWidth);

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", size / 2);
  circle.setAttribute("cy", size / 2);
  circle.setAttribute("r", radius);
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "#502379");
  circle.setAttribute("stroke-width", strokeWidth);
  circle.setAttribute("stroke-dasharray", circumference);
  circle.setAttribute("stroke-dashoffset", circumference);
  circle.setAttribute("stroke-linecap", "round");
  circle.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
  circle.style.transition = "stroke-dashoffset 0.5s ease-out";

  svg.appendChild(circleBg);
  svg.appendChild(circle);

  return { svg, circle, circumference };
}



function showMainView() {
  document.getElementById('mainView').style.display = 'block';
  document.getElementById('quickRoundView').style.display = 'none';
  document.getElementById('debateView').style.display = 'none';
  setActiveNav("Fragen & Antworten");
  cancelAllTimers();
}

function showQuickRound() {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('quickRoundView').style.display = 'block';
  document.getElementById('debateView').style.display = 'none';
  setActiveNav("Schnelle Runde");

  quickNames = shuffle([...names]);
  quickIndex = -1;

  const nameBox = document.getElementById('quickRoundName');
  nameBox.textContent = "Noch kein Name gezogen";
  nameBox.classList.add("result-box");

  const { svg, circle, circumference } = createTimerSVG(50);
  quickCircle = circle;
  quickCircumference = circumference;

  const timerHolder = document.getElementById('quickTimerCircle');
  timerHolder.innerHTML = '';
  timerHolder.appendChild(svg);

  document.getElementById('quickSecondsDisplay').textContent = "";
}


function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function startQuickRound() {
  if (quickIndex < 0 || quickIndex >= quickNames.length) return;

  const duration = parseInt(sessionStorage.getItem("quickTime")) || 60;
  let startTime = null;
  let remainingTime = debateTime;

  function animateQuickTimer(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    const remaining = Math.max(duration - elapsed, 0);

    const progress = (remaining / duration) * quickCircumference;
    quickCircle.setAttribute("stroke-dashoffset", progress);
    document.getElementById('quickSecondsDisplay').textContent = Math.ceil(remaining);

    if (remaining > 0) {
      quickInterval = requestAnimationFrame(animateQuickTimer);
    } else {
      quickCircle.setAttribute("stroke", "#f44336");
      document.getElementById('quickSecondsDisplay').textContent = "0";
    }
  }

  if (quickInterval) {
    cancelAnimationFrame(quickInterval);
  }

  quickInterval = requestAnimationFrame(animateQuickTimer);
}

function updateQuickDisplay() {
  const progress = (quickRemaining / 60) * quickCircumference;
  quickCircle.setAttribute("stroke-dashoffset", progress);
  document.getElementById('quickSecondsDisplay').textContent = `${quickRemaining}s`;
}

function nextQuick() {
  clearInterval(quickInterval);
  quickInterval = null;

  if (quickIndex + 1 >= quickNames.length) {
    alert("Schnelldurchlauf abgeschlossen!");
    return;
  }

  quickIndex++;
  const name = quickNames[quickIndex];
  document.getElementById('quickRoundName').textContent = name;
  document.getElementById('quickRoundName').classList.add("result-box");

  quickRemaining = parseInt(sessionStorage.getItem('quickTime')) || 60;

  if (quickCircle && quickCircumference) {
    quickCircle.setAttribute("stroke-dashoffset", quickCircumference);
  }

  document.getElementById('quickSecondsDisplay').textContent = '';
}

function showSettings() {
  const modal = document.getElementById("settingsModal");
  modal.classList.add("show");
  document.getElementById("settingsTitle").value = sessionStorage.getItem("customTitle") || '';
  document.getElementById("settingsDefaultTime").value = sessionStorage.getItem("defaultTime") || 10;
  document.getElementById("settingsQuickTime").value = sessionStorage.getItem("quickTime") || 60;
  document.getElementById("settingsDebateTime").value = sessionStorage.getItem("debateTime") || 10;
  document.getElementById("settingsDebateTopic").value = sessionStorage.getItem("debateTopic") || '';
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

window.onclick = function(event) {
  const modal = document.getElementById("settingsModal");
  if (event.target === modal) {
    modal.classList.remove("show");
  }
}

function saveSettings() {
  const title = document.getElementById("settingsTitle").value.trim();
  const defaultTime = parseInt(document.getElementById("settingsDefaultTime").value, 10);
  const quickTime = parseInt(document.getElementById("settingsQuickTime").value, 10);
  const debateTime = parseInt(document.getElementById("settingsDebateTime").value, 10);
  const debateTopic = document.getElementById("settingsDebateTopic").value.trim();

  if (title) {
    sessionStorage.setItem('customTitle', title);
    document.querySelector("header h1").textContent = title;
  }
  if (!isNaN(defaultTime)) sessionStorage.setItem('defaultTime', defaultTime);
  if (!isNaN(quickTime)) sessionStorage.setItem('quickTime', quickTime);
  if (!isNaN(debateTime)) sessionStorage.setItem('debateTime', debateTime);
  if (debateTopic) sessionStorage.setItem('debateTopic', debateTopic);

  closeSettings();
  alert("Einstellungen gespeichert!");
}

function updateSessionStorage() {
  sessionStorage.setItem('questions', JSON.stringify(questions));
  sessionStorage.setItem('names', JSON.stringify(names));
}

function loadFromSession() {
  const storedQuestions = JSON.parse(sessionStorage.getItem('questions'));
  const storedNames = JSON.parse(sessionStorage.getItem('names'));

  if (storedQuestions) questions = storedQuestions;
  if (storedNames) {
    names = storedNames;
    storedNames.forEach(name => {
      if (!document.querySelector(`#timerList li span`)?.textContent.includes(name)) {
        createTimer(name, 10);
      }
    });
    selectedNames = new Set(names);
  }

  displayQuestions();
  displayNames();
}

function clearQuestions() {
  if (confirm("Alle Fragen wirklich löschen?")) {
    questions = [];
    updateSessionStorage();
    displayQuestions();
  }
}

function clearNames() {
  if (confirm("Alle Namen wirklich löschen?")) {
    names = [];
    selectedNames.clear();
    updateSessionStorage();
    displayNames();
  }
}

function showDebateView(topic = "Diskussionsthema") {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('quickRoundView').style.display = 'none';
  const settingsView = document.getElementById('settingsView');
  if (settingsView) settingsView.style.display = 'none';
  document.getElementById('debateView').style.display = 'block';
  const savedTopic = sessionStorage.getItem('debateTopic') || topic;
  document.getElementById('debateTopic').textContent = savedTopic;
  generateDebateTimers();
  setActiveNav("Diskussion");
}

function generateDebateTimers() {
  const list = document.getElementById("debateTimerList");
  list.innerHTML = '';
  const debateTime = (parseInt(sessionStorage.getItem('debateTime')) || 10) * 60;

  names.forEach((name, index) => {
    const id = `debate-${index}`;
    const card = document.createElement("div");
    card.className = "debate-card";

    const title = document.createElement("h3");
    title.textContent = name;

    const timeDisplay = document.createElement("div");
    timeDisplay.id = `${id}-time`;
    timeDisplay.textContent = formatTime(debateTime);
    timeDisplay.className = "debate-time";

    const btn = document.createElement("button");
    btn.innerHTML = '<i class="fas fa-play"></i>';
    btn.className = 'icon-delete';
    btn.title = `Taste ${index + 1}`;

    const { svg, circle, circumference } = createTimerSVG();
    const svgHolder = document.createElement("div");
    svgHolder.className = "circle-holder";
    svgHolder.appendChild(svg);

    card.appendChild(title);
    card.appendChild(svgHolder);
    card.appendChild(timeDisplay);
    card.appendChild(btn);
    list.appendChild(card);

    let startTime = null;
    let interval = null;
    let active = false;
    let remainingTime = debateTime;

    function animateDebateTimer(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const remaining = Math.max(remainingTime - elapsed, 0);

      const progress = (remaining / debateTime) * circumference;
      circle.setAttribute("stroke-dashoffset", progress);
      timeDisplay.textContent = formatTime(remaining);

      if (remaining > 0) {
        interval = requestAnimationFrame(animateDebateTimer);
      } else {
        circle.setAttribute("stroke", "#f44336");
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-check-circle"></i>';
      }
    }

    btn.onclick = () => {
      if (active) {
        cancelAnimationFrame(interval);
        active = false;
        const [min, sec] = timeDisplay.textContent.split(":").map(Number);
        remainingTime = min * 60 + sec;
        btn.innerHTML = '<i class="fas fa-play"></i>';
      } else {
        startTime = null;
        interval = requestAnimationFrame(animateDebateTimer);
        active = true;
        btn.innerHTML = '<i class="fas fa-pause"></i>';
      }
    };
  });
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

document.addEventListener("keydown", (e) => {
  const number = parseInt(e.key);
  if (!isNaN(number) && number >= 1 && number <= 9) {
    const id = `debate-timer-${number - 1}`;
    if (debateTimers[id]) debateTimers[id]();
  }
});

// Set active state on navigation buttons
function setActiveNav(label) {
  document.querySelectorAll('.main-nav button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('aria-label') === label) {
      btn.classList.add('active');
    }
  });
}

// Hook into existing view-switching functions
const originalShowMainView = showMainView;
showMainView = function() {
  originalShowMainView();
  setActiveNav("Fragen & Antworten");
};

const originalShowQuickRound = showQuickRound;
showQuickRound = function() {
  originalShowQuickRound();
  setActiveNav("Schnelle Runde");
};

const originalShowDebateView = showDebateView;
showDebateView = function(topic) {
  originalShowDebateView(topic);
  setActiveNav("Diskussion");
};

function clearAllTimers() {
  if (confirm("Alle Timer wirklich löschen?")) {
    const list = document.getElementById("timerList");
    list.innerHTML = '';
  }
}

function resetQuickRound() {
  quickNames = [];
  quickIndex = -1;
  cancelAnimationFrame(quickInterval);
  quickInterval = null;
  quickCircle?.setAttribute("stroke-dashoffset", quickCircumference);
  document.getElementById("quickRoundName").textContent = "Noch kein Name gezogen";
  document.getElementById("quickSecondsDisplay").textContent = "—";
}

function clearDebateTimers() {
  const list = document.getElementById("debateTimerList");
  list.innerHTML = '';
}

function resetSettings() {
  if (confirm("Alle Einstellungen auf Werkseinstellungen zurücksetzen?")) {
    sessionStorage.clear();
    location.reload();
  }
}

document.addEventListener("keydown", (e) => {
  const key = parseInt(e.key);
  if (isNaN(key) || key < 1 || key > 9) return;

  // Fragen-Tab
  if (document.getElementById("mainView").style.display === "block") {
    const timers = document.querySelectorAll("#timerList li");
    const index = key - 1;
    if (timers[index]) {
      timers[index].querySelector("button")?.click();
    }
  }

  // Debatten-Tab
  if (document.getElementById("debateView").style.display === "block") {
    const cards = document.querySelectorAll("#debateTimerList .debate-card");
    const index = key - 1;
    if (cards[index]) {
      cards[index].querySelector("button")?.click();
    }
  }
});