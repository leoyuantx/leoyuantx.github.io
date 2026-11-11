import {authReady, mathApi, openAccountDialog, refreshProfile} from "./account.js";

(async () => {
  const totalQuestions = 10;
  const config = document.body.dataset;
  const operations = {
    addition: { title: "Addition Mission", symbol: "+" },
    subtraction: { title: "Subtraction Mission", symbol: "−" },
    multiplication: { title: "Multiplication Mission", symbol: "×" },
    division: { title: "Division Mission", symbol: "÷" }
  };
  const operation = operations[config.operation];
  if (!operation) throw new Error("Unknown math practice operation.");
  const levels = {
    addition: [
      { id: "1", label: "Level 1 — 1-digit + 1-digit", ranges: [[1, 9], [1, 9]] },
      { id: "2", label: "Level 2 — 1-digit + 2-digit", ranges: [[1, 9], [10, 99]] },
      { id: "3", label: "Level 3 — 2-digit + 2-digit", ranges: [[10, 99], [10, 99]] },
      { id: "4", label: "Level 4 — 3-digit + 2-digit", ranges: [[100, 999], [10, 99]] },
      { id: "5", label: "Level 5 — 3-digit + 3-digit", ranges: [[100, 999], [100, 999]] }
    ],
    subtraction: [
      { id: "1", label: "Level 1 — 1-digit − 1-digit", ranges: [[1, 9], [1, 9]] },
      { id: "2", label: "Level 2 — 2-digit − 1-digit", ranges: [[10, 99], [1, 9]] },
      { id: "3", label: "Level 3 — 2-digit − 2-digit", ranges: [[10, 99], [10, 99]] },
      { id: "4", label: "Level 4 — 3-digit − 2-digit", ranges: [[100, 999], [10, 99]] },
      { id: "5", label: "Level 5 — 3-digit − 3-digit", ranges: [[100, 999], [100, 999]] }
    ],
    multiplication: [
      { id: "1", label: "Level 1 — 1-digit × 1-digit", ranges: [[2, 9], [2, 9]] },
      { id: "2", label: "Level 2 — 2-digit × 1-digit", ranges: [[10, 99], [2, 9]] }
    ],
    division: [
      { id: "1", label: "Level 1 — 2-digit ÷ 1-digit", ranges: [[10, 99], [2, 9]] },
      { id: "2", label: "Level 2 — 2-digit ÷ 2-digit", ranges: [[10, 99], [10, 99]] }
    ]
  };

  const elements = {
    title: document.querySelector("#page-title"),
    card: document.querySelector("#game-card"),
    factorA: document.querySelector("#factor-a"),
    factorB: document.querySelector("#factor-b"),
    sign: document.querySelector("#operation-sign"),
    answer: document.querySelector("#answer"),
    checkButton: document.querySelector("#check-button"),
    hintButton: document.querySelector("#hint-button"),
    hintBox: document.querySelector("#hint-box"),
    feedback: document.querySelector("#feedback"),
    score: document.querySelector("#score"),
    streak: document.querySelector("#streak"),
    correctCount: document.querySelector("#correct-count"),
    elapsedTime: document.querySelector("#elapsed-time"),
    questionCount: document.querySelector("#question-count"),
    progressTrack: document.querySelector("#progress-track"),
    progressFill: document.querySelector("#progress-fill"),
    range: document.querySelector("#number-range"),
    restartButton: document.querySelector("#restart-button"),
    gameContent: document.querySelector("#game-content"),
    completion: document.querySelector("#completion"),
    completionMessage: document.querySelector("#completion-message"),
    ratingStars: document.querySelector("#rating-stars"),
    ratingSummary: document.querySelector("#rating-summary"),
    ratingBreakdown: document.querySelector("#rating-breakdown"),
    reportBody: document.querySelector("#report-body"),
    playAgainButton: document.querySelector("#play-again-button")
  };

  let question = { a: 2, b: 3, answer: 5 };
  let previousQuestion = "";
  let questionNumber = 1;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let correctAnswers = 0;
  let answerReport = [];
  let answered = false;
  let missionStartedAt = 0;
  let questionStartedAt = 0;
  let timerInterval = null;
  let signedInUser = null;
  let missionSessionId = null;
  let serverQuestions = [];
  let isStartingMission = false;
  let isFinishingMission = false;

  function formatDuration(milliseconds) {
    const totalMilliseconds = Math.floor(milliseconds);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const fraction = String(totalMilliseconds % 1000).padStart(3, "0");
    return `${minutes}:${seconds}.${fraction}`;
  }

  function updateTimer() {
    elements.elapsedTime.textContent = formatDuration(performance.now() - missionStartedAt);
  }

  function getSelectedLevel() {
    return levels[config.operation].find((level) => level.id === elements.range.value)
      || levels[config.operation][0];
  }

  function makeQuestion() {
    const serverQuestion = serverQuestions[questionNumber - 1];
    if (!serverQuestion) throw new Error("The mission question could not be loaded.");
    const {a, b} = serverQuestion;
    const answer = config.operation === "addition" ? a + b
      : config.operation === "subtraction" ? a - b
        : config.operation === "multiplication" ? a * b
          : a / b;
    previousQuestion = `${a}${operation.symbol}${b}`;
    question = {a, b, answer};
  }

  function showQuestion() {
    questionStartedAt = performance.now();
    elements.factorA.textContent = question.a;
    elements.factorB.textContent = question.b;
    elements.answer.value = "";
    elements.answer.disabled = false;
    elements.answer.readOnly = false;
    elements.feedback.textContent = "Type your answer and press Enter.";
    elements.feedback.className = "feedback";
    elements.hintBox.style.display = "none";
    elements.hintBox.textContent = "";
    elements.hintButton.disabled = false;
    elements.questionCount.textContent = `Question ${questionNumber} of ${totalQuestions}`;
    elements.answer.focus({preventScroll: true});
  }

  function updateScoreboard() {
    elements.score.textContent = score;
    elements.streak.textContent = bestStreak;
    elements.correctCount.textContent = `${correctAnswers} / ${totalQuestions}`;
    const completed = questionNumber - 1;
    elements.progressFill.style.width = `${(completed / totalQuestions) * 100}%`;
    elements.progressTrack.setAttribute("aria-valuenow", completed);
  }

  function checkAnswer() {
    if (answered) return;
    const rawAnswer = elements.answer.value.trim();
    if (rawAnswer === "") {
      elements.feedback.textContent = "Pop your answer in the box first!";
      elements.feedback.className = "feedback try-again";
      elements.answer.focus();
      return;
    }

    const submitted = Number(rawAnswer);
    if (!Number.isSafeInteger(submitted) || submitted < 0) {
      elements.feedback.textContent = "Enter a whole number for your answer.";
      elements.feedback.className = "feedback try-again";
      elements.answer.focus();
      return;
    }

    const isCorrect = submitted === question.answer;
    answerReport.push({
      number: questionNumber,
      question: `${question.a} ${operation.symbol} ${question.b}`,
      submitted,
      correctAnswer: question.answer,
      isCorrect,
      time: performance.now() - questionStartedAt
    });
    answered = true;
    elements.answer.readOnly = true;
    elements.hintButton.disabled = true;

    if (isCorrect) {
      correctAnswers += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      score += 1 + Math.min(streak, 5);
    } else {
      streak = 0;
    }

    updateScoreboard();
    nextQuestion();
  }

  function nextQuestion() {
    if (!answered) return;
    if (questionNumber === totalQuestions) {
      finishMission();
      return;
    }
    questionNumber += 1;
    answered = false;
    makeQuestion();
    updateScoreboard();
    showQuestion();
  }

  async function finishMission() {
    if (isFinishingMission) return;
    isFinishingMission = true;
    let missionResult;
    try {
      const completion = await mathApi("completeMission", {
        sessionId: missionSessionId,
        answers: answerReport.map((entry) => entry.submitted),
      });
      missionResult = completion.result;
      correctAnswers = missionResult.correct;
      answerReport = answerReport.map((entry, index) => ({
        ...entry,
        correctAnswer: missionResult.answers[index].correctAnswer,
        isCorrect: missionResult.answers[index].correct,
      }));
      await refreshProfile();
    } catch (error) {
      elements.feedback.textContent = `Could not save this mission: ${error.message}`;
      elements.feedback.className = "feedback try-again";
      let retryButton = document.querySelector("#retry-save-button");
      if (!retryButton) {
        retryButton = document.createElement("button");
        retryButton.id = "retry-save-button";
        retryButton.className = "button button-secondary";
        retryButton.type = "button";
        retryButton.textContent = "Retry saving mission";
        elements.feedback.after(retryButton);
        retryButton.addEventListener("click", finishMission);
      }
      retryButton.hidden = false;
      isFinishingMission = false;
      return;
    }

    isFinishingMission = false;
    document.querySelector("#retry-save-button")?.remove();
    elements.gameContent.style.display = "none";
    elements.completion.style.display = "block";
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateTimer();
    const averageAnswerTime = answerReport.reduce((total, entry) => total + entry.time, 0) / totalQuestions;
    const accuracyPercent = (correctAnswers / totalQuestions) * 100;
    const accuracyPoints = (accuracyPercent / 100) * 80;
    const speedPoints = Math.max(0, 1 - averageAnswerTime / 60000) * 20;
    const missionRating = accuracyPoints + speedPoints;
    const stars = missionRating >= 90 ? 5
      : missionRating >= 75 ? 4
        : missionRating >= 60 ? 3
          : missionRating >= 45 ? 2
            : missionRating >= 30 ? 1
              : 0;
    elements.ratingStars.replaceChildren();
    for (let index = 0; index < 5; index += 1) {
      const star = document.createElement("span");
      star.textContent = index < stars ? "★" : "☆";
      star.setAttribute("aria-hidden", "true");
      elements.ratingStars.append(star);
    }
    elements.ratingSummary.textContent = `${Math.round(missionRating)} / 100`;
    elements.ratingBreakdown.textContent =
      `Accuracy: ${Math.round(accuracyPercent)}% (${Math.round(accuracyPoints)}/80 points) · Speed: ${Math.round(speedPoints)}/20 points`;
    let rewardSummary = document.querySelector("#reward-summary");
    if (!rewardSummary) {
      rewardSummary = document.createElement("p");
      rewardSummary.id = "reward-summary";
      rewardSummary.className = "reward-summary";
      elements.ratingBreakdown.after(rewardSummary);
    }
    const earnedNames = missionResult.newAchievements.map((achievement) => achievement.title);
    rewardSummary.textContent = `Difficulty ×${missionResult.rewardMultiplier} · +${missionResult.xpEarned} XP · +${missionResult.coinsEarned} coins · ${missionResult.variableReward.label}${earnedNames.length ? ` · Achievement: ${earnedNames.join(", ")}` : ""}`;
    elements.progressFill.style.width = "100%";
    elements.progressTrack.setAttribute("aria-valuenow", totalQuestions);
    elements.reportBody.replaceChildren();

    answerReport.forEach((entry) => {
      const row = document.createElement("tr");
      const questionCell = document.createElement("td");
      const answerCell = document.createElement("td");
      const resultCell = document.createElement("td");
      const timeCell = document.createElement("td");
      questionCell.textContent = `${entry.number}. ${entry.question}`;
      answerCell.textContent = entry.submitted;
      resultCell.textContent = entry.isCorrect
        ? "Correct"
        : `Incorrect — answer: ${entry.correctAnswer}`;
      resultCell.className = entry.isCorrect
        ? "report-result-correct"
        : "report-result-incorrect";
      timeCell.textContent = formatDuration(entry.time);
      row.append(questionCell, answerCell, resultCell, timeCell);
      elements.reportBody.append(row);
    });

    if (correctAnswers === totalQuestions) {
      elements.completionMessage.textContent = "Galaxy champion! You got all 10 right. You’re a math superstar!";
    } else if (correctAnswers >= 7) {
      elements.completionMessage.textContent = "Super space explorer! Your math skills are taking off!";
    } else {
      elements.completionMessage.textContent = "";
    }
    elements.completionMessage.focus();
  }

  async function startMission() {
    if (!signedInUser) {
      openAccountDialog();
      return;
    }
    if (isStartingMission) return;
    isStartingMission = true;
    questionNumber = 1;
    score = 0;
    streak = 0;
    bestStreak = 0;
    correctAnswers = 0;
    answerReport = [];
    answered = false;
    previousQuestion = "";
    missionSessionId = null;
    serverQuestions = [];
    missionStartedAt = performance.now();
    if (timerInterval !== null) clearInterval(timerInterval);
    elements.checkButton.disabled = true;
    elements.answer.disabled = true;
    elements.hintButton.disabled = true;
    elements.feedback.textContent = "Preparing your mission…";
    try {
      const result = await mathApi("startMission", {
        operation: config.operation,
        level: Number(elements.range.value),
      });
      missionSessionId = result.sessionId;
      serverQuestions = result.questions;
      elements.gameContent.style.display = "block";
      elements.completion.style.display = "none";
      elements.checkButton.disabled = false;
      elements.answer.disabled = false;
      elements.hintButton.disabled = false;
      updateTimer();
      timerInterval = window.setInterval(updateTimer, 31);
      makeQuestion();
      updateScoreboard();
      showQuestion();
    } catch (error) {
      elements.feedback.textContent = error.message;
      elements.feedback.className = "feedback try-again";
    } finally {
      isStartingMission = false;
    }
  }

  function showHint() {
    if (config.operation === "multiplication") {
      elements.hintBox.textContent = `Hint: ${question.a} groups of ${question.b}. Add the groups together!`;
    } else if (config.operation === "division") {
      elements.hintBox.textContent = `Hint: Think of the multiplication fact ${question.b} × ? = ${question.a}.`;
    } else if (config.operation === "addition") {
      elements.hintBox.textContent = "Hint: Start with the bigger number and count up.";
    } else {
      elements.hintBox.textContent = "Hint: Start with the first number and count back.";
    }
    elements.hintBox.style.display = "block";
    elements.hintButton.disabled = true;
  }

  elements.title.textContent = operation.title;
  elements.sign.textContent = operation.symbol;
  elements.card.setAttribute("aria-label", `${operation.title} game`);
  elements.range.replaceChildren();
  levels[config.operation].forEach((level) => {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = level.label;
    elements.range.append(option);
  });
  elements.checkButton.addEventListener("click", checkAnswer);
  elements.answer.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
  elements.hintButton.addEventListener("click", showHint);
  elements.restartButton.addEventListener("click", startMission);
  elements.playAgainButton.addEventListener("click", startMission);
  elements.range.addEventListener("change", startMission);
  const selectedLevel = new URLSearchParams(window.location.search).get("level");
  if (levels[config.operation].some((level) => level.id === selectedLevel)) {
    elements.range.value = selectedLevel;
  }
  window.addEventListener("math-auth-changed", (event) => {
    const wasSignedIn = Boolean(signedInUser);
    signedInUser = event.detail.user;
    if (signedInUser && !wasSignedIn && !missionSessionId) startMission();
    if (!signedInUser) openAccountDialog();
  });
  signedInUser = await authReady;
  if (signedInUser) {
    startMission();
  } else {
    elements.gameContent.style.display = "none";
    elements.completion.style.display = "block";
    elements.completionMessage.textContent = "Sign in to begin a mission and save your progress.";
    elements.playAgainButton.textContent = "Sign in to begin";
    openAccountDialog();
  }
})();
