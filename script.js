let questions = [];
let names = [];
let currentQuestionIndex = -1;
let selectedNames = new Set(names);

function addQuestions() {
    setTimeout(() => {
      const input = document.getElementById("questionInput").value;
      const newQuestions = input.split("\n").map(q => q.trim()).filter(q => q.length > 0);
      questions = questions.concat(newQuestions);
      displayQuestions();
      alert(`${newQuestions.length} Fragen hinzugefügt.`);
      document.getElementById('questionInputSection').style.display = 'none';
      document.getElementById('questionInput').value = '';
    }, 500); // Simuliert eine Verzögerung, um die Ladeanzeige zu sehen
  }
    

  function addNames() {
    setTimeout(() => {
      const input = document.getElementById("nameInput").value;
      const newNames = input.split("\n").map(n => n.trim()).filter(n => n.length > 0);
      names = names.concat(newNames);
      displayNames();
      selectedNames = new Set(names); // richtig initialisieren
      alert(`${newNames.length} Namen hinzugefügt.`);
      document.getElementById('nameInputSection').style.display = 'none';
      document.getElementById('nameInput').value = '';
  
      newNames.forEach(name => createTimer(name, 10));
    }, 500); // Simuliert eine Verzögerung, um die Ladeanzeige zu sehen
  } 

function displayQuestions() {
  const questionList = document.getElementById("questionList");
  questionList.innerHTML = '';
  questions.forEach(question => {
    const li = document.createElement('li');
    li.textContent = question;
    questionList.appendChild(li);
  });
}

function displayNames() {
  const nameList = document.getElementById("nameList");
  nameList.innerHTML = '';
  names.forEach(name => {
    const li = document.createElement('li');
    li.classList.add('selected');
    li.textContent = name;
    li.onclick = () => toggleNameSelection(li, name);
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
  

function toggleTimerSection() {
  const timerSection = document.getElementById('timerInputSection');
  timerSection.style.display = timerSection.style.display === "none" ? "block" : "none";
}

function toggleNameSection() {
  const nameSection = document.getElementById('nameInputSection');
  nameSection.style.display = nameSection.style.display === "none" ? "block" : "none";
}

function toggleQuestionSection() {
  const questionSection = document.getElementById('questionInputSection');
  questionSection.style.display = questionSection.style.display === "none" ? "block" : "none";
}

function createTimer(nameArg = null, minutesArg = null) {
    const name = nameArg !== null ? nameArg : document.getElementById("timerName").value;
    const minutes = minutesArg !== null ? minutesArg : parseFloat(document.getElementById("timerDuration").value);
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
    statusDisplay.textContent = "⏸️ Pausiert";
    toggleBtn.textContent = "▶️ Start";
    deleteBtn.textContent = "❌";
  
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
  
    function tick() {
      if (remaining > 0) {
        remaining--;
        updateDisplay();
        if (remaining <= 0) {
          clearInterval(intervalId);
          active = false;
          statusDisplay.textContent = "✅ Fertig!";
          toggleBtn.disabled = true;
          circle.setAttribute("stroke", "#f44336");
        }
      }
    }
  
    toggleBtn.onclick = () => {
      if (active) {
        clearInterval(intervalId);
        active = false;
        statusDisplay.textContent = "⏸️ Pausiert";
        toggleBtn.textContent = "▶️ Start";
      } else {
        intervalId = setInterval(tick, 1000);
        active = true;
        statusDisplay.textContent = "⏱️ Läuft";
        toggleBtn.textContent = "⏸️ Pause";
      }
    };
  
    deleteBtn.onclick = () => {
      clearInterval(intervalId);
      li.remove();
    };
  
    updateDisplay();
  }
  
  function createTimerSVG(radius = 10) {
    const circumference = 2 * Math.PI * radius;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", radius * 2 + 10);
    svg.setAttribute("height", radius * 2 + 10);
  
    const circleBg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleBg.setAttribute("cx", radius + 5);
    circleBg.setAttribute("cy", radius + 5);
    circleBg.setAttribute("r", radius);
    circleBg.setAttribute("stroke", "#ffffff33");
    circleBg.setAttribute("stroke-width", "5");
    circleBg.setAttribute("fill", "none");
  
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", radius + 5);
    circle.setAttribute("cy", radius + 5);
    circle.setAttribute("r", radius);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "5");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke-dasharray", circumference);
    circle.setAttribute("stroke-dashoffset", circumference);
    circle.classList.add("progress-circle");
  
    svg.appendChild(circleBg);
    svg.appendChild(circle);
    return { svg, circle, circumference };
  }
  

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("timerDuration").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      createTimer();
    }
  });
});
