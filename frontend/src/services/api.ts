const API_BASE_URL = "http://localhost:3000/api";

export async function getQuizzes() {
  const response = await fetch(`${API_BASE_URL}/quizzes`);

  if (!response.ok) {
    throw new Error("Failed to fetch quizzes");
  }

  return response.json();
}
export async function getSubjects() {
  const response = await fetch(`${API_BASE_URL}/subjects`);

  if (!response.ok) {
    throw new Error("Failed to fetch subjects");
  }

  return response.json();
}

export async function getGrades() {
  const response = await fetch(`${API_BASE_URL}/grades`);

  if (!response.ok) {
    throw new Error("Failed to fetch grades");
  }

  return response.json();
}

export async function getLessons() {
  const response = await fetch(`${API_BASE_URL}/lessons`);

  if (!response.ok) {
    throw new Error("Failed to fetch lessons");
  }

  return response.json();
}

export async function createQuiz(data: {
  lesson_id: number;
  title: string;
  description: string;
  questions_per_player: number;
}) {
  const response = await fetch(`${API_BASE_URL}/quizzes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create quiz");
  }

  return response.json();
}
export async function createQuestionPair(data: {
  quiz_id: number;
  question_order: number;
  difficulty: string;
  timer_seconds: number;
  learning_objective?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/question-pairs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create question pair");
  }

  return response.json();
}
export async function createQuestion(data: {
  question_pair_id: number;
  player_set: "A" | "B";
  question_text: string;
  explanation: string;
  options: {
    option_text: string;
    is_correct: boolean;
  }[];
}) {
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create question");
  }

  return response.json();
}
export async function getQuestionPairs(quizId: number) {
  const response = await fetch(
    `${API_BASE_URL}/question-pairs/quiz/${quizId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch question pairs");
  }

  return response.json();
}
export async function getQuizById(quizId: number) {
  const quizzes = await getQuizzes();
  return quizzes.find((quiz: any) => quiz.id === quizId);
}
export async function publishQuiz(quizId: number) {
  const response = await fetch(
    `${API_BASE_URL}/quizzes/${quizId}/publish`,
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to publish quiz");
  }

  return data;
}
export async function startGameSession(data: {
  quiz_id: number;
  player_1_name: string;
  player_2_name: string;
}) {
  const response = await fetch(`${API_BASE_URL}/game-sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to start game session");
  }

  return result;
}
export async function getPlayerQuestions(
  sessionId: number,
  playerSlot: number
) {
  const response = await fetch(
    `${API_BASE_URL}/game-sessions/${sessionId}/player/${playerSlot}/questions`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to load player questions");
  }

  return result;
}
export async function submitAnswer(
  sessionId: number,
  playerSlot: number,
  data: {
    questionId: number;
    selectedOptionId: number;
    responseTimeSeconds?: number;
  }
) {
  const response = await fetch(
    `${API_BASE_URL}/game-sessions/${sessionId}/player/${playerSlot}/answer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to submit answer");
  }

  return result;
}
export async function submitTimeout(
  sessionId: number,
  playerSlot: number,
  questionId: number
) {
  const response = await fetch(
    `${API_BASE_URL}/game-sessions/${sessionId}/player/${playerSlot}/timeout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionId,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to submit timeout");
  }

  return result;
}
export async function finishPlayerTurn(
  sessionId: number,
  playerSlot: number
) {
  const response = await fetch(
    `${API_BASE_URL}/game-sessions/${sessionId}/player/${playerSlot}/finish`,
    {
      method: "POST",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to finish player turn");
  }

  return result;
}

export async function getFinalResults(sessionId: number) {
  const response = await fetch(
    `${API_BASE_URL}/game-sessions/${sessionId}/results`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to load final results");
  }

  return result;
}