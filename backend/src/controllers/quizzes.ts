import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import { checkCourseAccess } from './progress';

// Helper to check if two JSON arrays are equal
const arraysEqual = (a: any, b: any): boolean => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  
  for (let i = 0; i < sortedA.length; i++) {
    if (String(sortedA[i]) !== String(sortedB[i])) return false;
  }
  return true;
};

// ==========================================
// ADMIN QUIZ CMS
// ==========================================

export const createQuiz = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, courseId, moduleId, passingScore, questions } = req.body;

    if (!title || !courseId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Title, Course ID, and questions array are required.' });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        courseId,
        moduleId: moduleId || null,
        passingScore: passingScore ? parseInt(passingScore) : 70,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            type: q.type, // MCQ, MULTIPLE, TF
            options: q.options, // e.g. ["Opt A", "Opt B"]
            correctAnswer: q.correctAnswer, // e.g. [0] or [1]
          })),
        },
      },
      include: { questions: true },
    });

    return res.status(201).json(quiz);
  } catch (error) {
    console.error('[CREATE QUIZ ERROR]', error);
    return res.status(500).json({ message: 'Failed to create quiz.' });
  }
};

export const deleteQuiz = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.quiz.delete({ where: { id } });
    return res.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    console.error('[DELETE QUIZ ERROR]', error);
    return res.status(500).json({ message: 'Failed to delete quiz.' });
  }
};

// ==========================================
// STUDENT QUIZ SYSTEM
// ==========================================

export const getCourseQuizzes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    // Verify course access
    const hasAccess = await checkCourseAccess(userId, courseId, req.user?.role || 'STUDENT');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Please purchase the course to view quizzes.' });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return res.json(quizzes);
  } catch (error) {
    console.error('[GET QUIZZES ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve quizzes.' });
  }
};

export const getQuizQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });

    // Verify course access
    const hasAccess = await checkCourseAccess(userId, quiz.courseId, req.user?.role || 'STUDENT');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Please purchase the course to view quiz questions.' });
    }

    // Security sanitization: strip correct answers before transmitting to client
    const sanitizedQuestions = quiz.questions.map((q) => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });

    return res.json({
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passingScore,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('[GET QUIZ QUESTIONS ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve questions.' });
  }
};

export const submitQuizAttempt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const { answers } = req.body; // Expects array: [{ questionId: "...", selectedAnswers: [0, 1] }]

    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required.' });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });

    // Check course access
    const hasAccess = await checkCourseAccess(userId, quiz.courseId, req.user?.role || 'STUDENT');
    if (!hasAccess) {
      return res.status(403).json({ message: 'Please purchase the course to submit quiz.' });
    }

    // Evaluate answers
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const feedback: { [key: string]: { correct: boolean; correctAnswers: any } } = {};

    quiz.questions.forEach((question) => {
      const submission = answers.find((ans: any) => ans.questionId === question.id);
      const submittedAnswers = submission ? submission.selectedAnswers : [];
      
      const isCorrect = arraysEqual(submittedAnswers, question.correctAnswer);
      if (isCorrect) {
        correctCount++;
      }

      feedback[question.id] = {
        correct: isCorrect,
        correctAnswers: question.correctAnswer, // Send back answers as feedback on grading
      };
    });

    const score = totalQuestions > 0 ? parseFloat(((correctCount / totalQuestions) * 100).toFixed(2)) : 0;
    const passed = score >= quiz.passingScore;

    // Log the quiz attempt in database
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId: id,
        score,
        passed,
      },
    });

    return res.json({
      attemptId: attempt.id,
      score,
      passed,
      passingScore: quiz.passingScore,
      totalQuestions,
      correctCount,
      feedback,
    });
  } catch (error) {
    console.error('[SUBMIT QUIZ ERROR]', error);
    return res.status(500).json({ message: 'Failed to process quiz attempt.' });
  }
};
