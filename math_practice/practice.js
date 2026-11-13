import {authReady, formatDuration, mathApi, openAccountDialog, refreshProfile} from "./account.js";

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
  const elements = {
    title: document.querySelector("#page-title"),
    card: document.querySelector("#game-card"),
    questionLoading: document.querySelector("#question-loading"),
    questionWrap: document.querySelector(".question-wrap"),
    factorA: document.querySelector("#factor-a"),
    factorB: document.querySelector("#factor-b"),
    sign: document.querySelector("#operation-sign"),
    answer: document.querySelector("#answer"),
    remainder: document.querySelector("#remainder"),
    remainderWrap: document.querySelector("#remainder-wrap"),
    checkButton: document.querySelector("#check-button"),
    hintButton: document.querySelector("#hint-button"),
    hintBox: document.querySelector("#hint-box"),
    feedback: document.querySelector("#feedback"),
    attemptsRemaining: document.querySelector("#attempts-remaining"),
    challengeLevel: document.querySelector("#challenge-level"),
    score: document.querySelector("#score"),
    streak: document.querySelector("#streak"),
    correctCount: document.querySelector("#correct-count"),
    elapsedTime: document.querySelector("#elapsed-time"),
    questionCount: document.querySelector("#question-count"),
    progressTrack: document.querySelector("#progress-track"),
    progressFill: document.querySelector("#progress-fill"),
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

  let question;
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
  let answerFormat = "integer";
  let isStartingMission = false;
  let isFinishingMission = false;

  function updateTimer() {
    elements.elapsedTime.textContent = formatDuration(performance.now() - missionStartedAt);
  }

  function makeQuestion() {
    const serverQuestion = serverQuestions[questionNumber - 1];
    if (!serverQuestion) throw new Error("The mission question could not be loaded.");
    const {a, b} = serverQuestion;
    const answer = config.operation === "addition" ? a + b
      : config.operation === "subtraction" ? a - b
        : config.operation === "multiplication" ? a * b
          : answerFormat === "remainder" ? Math.floor(a / b)
            : answerFormat === "decimal" ? Math.round((a / b) * 100) / 100
              : a / b;
    previousQuestion = `${a}${operation.symbol}${b}`;
    question = {a, b, answer, remainder: answerFormat === "remainder" ? a % b : null};
  }

  function showQuestion() {
    questionStartedAt = performance.now();
    elements.factorA.textContent = question.a;
    elements.factorB.textContent = question.b;
    elements.answer.value = "";
    elements.answer.disabled = false;
    elements.answer.readOnly = false;
    elements.answer.step = answerFormat === "decimal" ? "any" : "1";
    elements.answer.inputMode = answerFormat === "decimal" ? "decimal" : "numeric";
    elements.answer.setAttribute("aria-label", answerFormat === "remainder" ? "Quotient" : "Your answer");
    if (elements.remainderWrap) {
      elements.remainderWrap.hidden = answerFormat !== "remainder";
      elements.remainder.value = "";
      elements.remainder.disabled = false;
      elements.remainder.readOnly = false;
    }
    elements.feedback.textContent = answerFormat === "remainder"
      ? "Enter the quotient and remainder, then press Enter."
      : answerFormat === "decimal" ? "Enter the decimal answer, then press Enter."
        : "Type your answer and press Enter.";
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
    const validAnswer = answerFormat === "decimal"
      ? Number.isFinite(submitted) && submitted >= 0 && submitted <= Number.MAX_SAFE_INTEGER / 100 &&
        Math.round(submitted * 100) / 100 === submitted
      : Number.isSafeInteger(submitted) && submitted >= 0;
    if (!validAnswer) {
      elements.feedback.textContent = answerFormat === "decimal"
        ? "Enter a non-negative number with up to two decimal places."
        : "Enter a whole number for your answer.";
      elements.feedback.className = "feedback try-again";
      elements.answer.focus();
      return;
    }

    let submittedRemainder = null;
    if (answerFormat === "remainder") {
      const rawRemainder = elements.remainder.value.trim();
      submittedRemainder = Number(rawRemainder);
      if (!rawRemainder || !Number.isSafeInteger(submittedRemainder) || submittedRemainder < 0) {
        elements.feedback.textContent = "Enter a non-negative whole-number remainder.";
        elements.feedback.className = "feedback try-again";
        elements.remainder.focus();
        return;
      }
    }
    const isCorrect = submitted === question.answer &&
      (answerFormat !== "remainder" || submittedRemainder === question.remainder);
    answerReport.push({
      number: questionNumber,
      question: `${question.a} ${operation.symbol} ${question.b}`,
      submitted,
      submittedRemainder,
      correctAnswer: question.answer,
      correctRemainder: question.remainder,
      isCorrect,
      time: performance.now() - questionStartedAt
    });
    answered = true;
    elements.answer.readOnly = true;
    if (elements.remainder) elements.remainder.readOnly = true;
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
      if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      updateTimer();
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
        ...(answerFormat === "remainder" ? {remainders: answerReport.map((entry) => entry.submittedRemainder)} : {}),
        answerTimes: answerReport.map((entry) => entry.time),
      });
      missionResult = completion.result;
      correctAnswers = missionResult.correct;
      answerReport = answerReport.map((entry, index) => ({
        ...entry,
        correctAnswer: missionResult.answers[index].correctAnswer,
        correctRemainder: missionResult.answers[index].correctRemainder,
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
    if (Number.isFinite(missionResult.elapsedMs)) {
      elements.elapsedTime.textContent = formatDuration(missionResult.elapsedMs);
    }
    const averageAnswerTime = answerReport.reduce((total, entry) => total + entry.time, 0) / totalQuestions;
    const accuracyPercent = (correctAnswers / totalQuestions) * 100;
    const accuracyPoints = (accuracyPercent / 100) * 80;
    const speedPoints = Math.max(0, 1 - averageAnswerTime / 60000) * 20;
    const missionRating = accuracyPoints + speedPoints;
    const stars = missionResult.stars;
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
    const rewardDetails = [
      `Difficulty level ${missionResult.missionLevel}`,
      `+${missionResult.xpEarned} XP`,
      `+${missionResult.coinsEarned} coins`,
    ];
    if (missionResult.speedBonus?.xp || missionResult.speedBonus?.coins) {
      const speedCoins = missionResult.speedBonus.coins ? `, +${missionResult.speedBonus.coins} coin` : "";
      rewardDetails.push(`Speed bonus: +${missionResult.speedBonus.xp} XP${speedCoins}`);
    } else if (!missionResult.speedBonus && missionResult.variableReward?.amount) {
      rewardDetails.push(missionResult.variableReward.label);
    }
    if (earnedNames.length) rewardDetails.push(`Achievement: ${earnedNames.join(", ")}`);
    rewardSummary.textContent = rewardDetails.join(" · ");
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
      answerCell.textContent = answerFormat === "remainder"
        ? `${entry.submitted} remainder ${entry.submittedRemainder}` : entry.submitted;
      resultCell.textContent = entry.isCorrect
        ? "Correct"
        : `Incorrect — answer: ${entry.correctAnswer}${answerFormat === "remainder" ? ` remainder ${entry.correctRemainder}` : ""}`;
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
    elements.gameContent.style.display = "block";
    elements.completion.style.display = "none";
    elements.questionWrap.hidden = true;
    elements.questionLoading.hidden = false;
    elements.questionLoading.textContent = "Preparing your mission…";
    elements.questionLoading.className = "question-hint";
    elements.restartButton.disabled = true;
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
    if (timerInterval !== null) clearInterval(timerInterval);
    elements.checkButton.disabled = true;
    elements.answer.disabled = true;
    elements.hintButton.disabled = true;
    elements.feedback.textContent = "Preparing your mission…";
    try {
      const result = await mathApi("startMission", {
        operation: config.operation,
        ...(config.operation === "division" ? {answerFormats: ["remainder", "decimal"]} : {}),
      });
      missionSessionId = result.sessionId;
      serverQuestions = result.questions;
      answerFormat = result.answerFormat || "integer";
      if (answerFormat === "remainder" && !elements.remainder) {
        throw new Error("Reload this page to answer remainder questions.");
      }
      elements.challengeLevel.textContent = `Level ${result.level}`;
      elements.attemptsRemaining.textContent =
        `${result.attemptsRemaining} ${result.attemptsRemaining === 1 ? "try" : "tries"} left for this challenge today.`;
      elements.gameContent.style.display = "block";
      elements.completion.style.display = "none";
      elements.playAgainButton.disabled = false;
      elements.checkButton.disabled = false;
      elements.answer.disabled = false;
      elements.hintButton.disabled = false;
      missionStartedAt = performance.now();
      updateTimer();
      timerInterval = window.setInterval(updateTimer, 31);
      makeQuestion();
      updateScoreboard();
      elements.questionLoading.hidden = true;
      elements.questionWrap.hidden = false;
      showQuestion();
    } catch (error) {
      if (error.status === 429) {
        elements.attemptsRemaining.textContent = "No tries left for this challenge today.";
        elements.completionMessage.textContent = error.message;
        elements.gameContent.style.display = "none";
        elements.completion.style.display = "block";
        elements.playAgainButton.disabled = true;
        elements.completionMessage.focus();
        return;
      }
      elements.questionLoading.textContent = `Could not start the mission: ${error.message} Use New mission to try again.`;
      elements.questionLoading.className = "feedback try-again";
    } finally {
      isStartingMission = false;
      elements.restartButton.disabled = false;
    }
  }

  function showHint() {
    if (config.operation === "multiplication") {
      elements.hintBox.textContent = `Hint: ${question.a} groups of ${question.b}. Add the groups together!`;
    } else if (config.operation === "division") {
      elements.hintBox.textContent = answerFormat === "remainder"
        ? `Hint: Find the largest multiple of ${question.b} that is no greater than ${question.a}. What is left over?`
        : `Hint: Think of the multiplication fact ${question.b} × ? = ${question.a}.`;
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
  elements.checkButton.addEventListener("click", checkAnswer);
  elements.answer.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
  elements.remainder?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
  elements.hintButton.addEventListener("click", showHint);
  elements.restartButton.addEventListener("click", startMission);
  elements.playAgainButton.addEventListener("click", startMission);
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
