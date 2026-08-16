import { prisma } from "../prismaClient";

export async function validateQuizForPublish(quizId: number) {
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
    include: {
      lesson: {
        include: {
          subject: true,
          grade: true,
        },
      },
      question_pairs: {
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    return {
      valid: false,
      message: "Quiz not found",
    };
  }

  if (!quiz.title.trim()) {
    return {
      valid: false,
      message: "Quiz title is required",
    };
  }

  if (!quiz.lesson || !quiz.lesson.subject || !quiz.lesson.grade) {
    return {
      valid: false,
      message: "Subject, grade and lesson are required",
    };
  }

  if (quiz.question_pairs.length !== quiz.questions_per_player) {
    return {
      valid: false,
      message: `Quiz must contain exactly ${quiz.questions_per_player} question pairs`,
    };
  }

  for (const pair of quiz.question_pairs) {
    if (pair.timer_seconds <= 0) {
      return {
        valid: false,
        message: `Question pair ${pair.question_order} must have a valid timer`,
      };
    }

    const questionA = pair.questions.find(
      (question) => question.player_set === "A"
    );

    const questionB = pair.questions.find(
      (question) => question.player_set === "B"
    );

    if (!questionA || !questionB || pair.questions.length !== 2) {
      return {
        valid: false,
        message: `Question pair ${pair.question_order} must contain Question A and Question B`,
      };
    }

    for (const question of pair.questions) {
      if (!question.question_text.trim()) {
        return {
          valid: false,
          message: "Question text is required",
        };
      }

      if (!question.explanation.trim()) {
        return {
          valid: false,
          message: "Every question must have an explanation",
        };
      }

      if (question.options.length !== 4) {
        return {
          valid: false,
          message: "Every question must contain exactly four options",
        };
      }

      const correctOptions = question.options.filter(
        (option) => option.is_correct
      );

      if (correctOptions.length !== 1) {
        return {
          valid: false,
          message: "Every question must contain exactly one correct answer",
        };
      }

      const hasEmptyOption = question.options.some(
        (option) => !option.option_text.trim()
      );

      if (hasEmptyOption) {
        return {
          valid: false,
          message: "All options must contain text",
        };
      }
    }
  }

  return {
    valid: true,
    message: "Quiz is ready to publish",
  };
}