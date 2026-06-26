import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';

// Helper to verify course purchase or admin role
export const checkCourseAccess = async (userId: string, courseId: string, role: string): Promise<boolean> => {
  if (role === 'ADMIN') return true;

  const completedOrder = await prisma.order.findFirst({
    where: {
      userId,
      courseId,
      status: 'COMPLETED',
    },
  });

  return !!completedOrder;
};

export const getStudentCourseContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ message: 'User session not found.' });
    }

    const hasAccess = await checkCourseAccess(userId, courseId, role);

    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // If user has access, return all content with private URLs
    if (hasAccess) {
      return res.json({
        hasAccess: true,
        modules,
      });
    }

    // If no access, sanitize lessons: remove private assets for non-preview lessons
    const sanitizedModules = modules.map((mod) => ({
      ...mod,
      lessons: mod.lessons.map((les) => {
        if (les.isFreePreview) return les; // Free preview remains fully visible
        
        return {
          ...les,
          videoUrl: null,  // Strip premium video link
          notesUrl: null,  // Strip PDF note attachments
        };
      }),
    }));

    return res.json({
      hasAccess: false,
      modules: sanitizedModules,
    });
  } catch (error) {
    console.error('[GET STUDENT CONTENT ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve course content.' });
  }
};

export const updateProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lessonId, isCompleted, timeSpent } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!lessonId) {
      return res.status(400).json({ message: 'Lesson ID is required.' });
    }

    // Find parent course to verify access
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    // If not a preview lesson, verify user has purchased the course
    if (!lesson.isFreePreview) {
      const hasAccess = await checkCourseAccess(userId, lesson.module.courseId, req.user?.role || 'STUDENT');
      if (!hasAccess) {
        return res.status(403).json({ message: 'Please purchase the course to log progress.' });
      }
    }

    // Upsert progress record
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        ...(isCompleted !== undefined && { isCompleted: isCompleted === true || isCompleted === 'true' }),
        ...(timeSpent !== undefined && { timeSpent: parseInt(timeSpent) }),
      },
      create: {
        userId,
        lessonId,
        isCompleted: isCompleted === true || isCompleted === 'true',
        timeSpent: timeSpent ? parseInt(timeSpent) : 0,
      },
    });

    return res.json(progress);
  } catch (error) {
    console.error('[UPDATE PROGRESS ERROR]', error);
    return res.status(500).json({ message: 'Failed to record progress.' });
  }
};

export const getCourseProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Get all lessons for the course
    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    });

    const lessonIds = lessons.map((l) => l.id);

    // Get completed progress records for these lessons
    const progress = await prisma.progress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
        isCompleted: true,
      },
      select: { lessonId: true },
    });

    const completedLessonIds = progress.map((p) => p.lessonId);
    
    // Math percentage
    const totalLessons = lessonIds.length;
    const completedCount = completedLessonIds.length;
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return res.json({
      percentage,
      completedLessons: completedLessonIds,
      totalLessons,
    });
  } catch (error) {
    console.error('[GET PROGRESS ERROR]', error);
    return res.status(500).json({ message: 'Failed to fetch course progress.' });
  }
};

export const getPurchasedCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Find all completed orders
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true }
                }
              }
            }
          }
        },
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Also get all progress records of the student
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId,
        isCompleted: true,
      },
      select: {
        lessonId: true,
      },
    });

    const completedLessonIds = new Set(progressRecords.map((p) => p.lessonId));

    // Also get all certificates of the student
    const certificates = await prisma.certificate.findMany({
      where: {
        userId,
      },
    });

    const certMap = new Map(certificates.map((c) => [c.courseId, c]));

    const purchasedCourses = orders.map((order) => {
      const course = order.course;
      
      // Calculate lessons
      const lessons: string[] = [];
      course.modules.forEach((mod) => {
        mod.lessons.forEach((les) => {
          lessons.push(les.id);
        });
      });

      const totalLessons = lessons.length;
      const completedCount = lessons.filter((id) => completedLessonIds.has(id)).length;
      const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      
      const certificate = certMap.get(course.id);

      return {
        orderId: order.id,
        amount: order.amount,
        createdAt: order.createdAt,
        invoice: order.invoice ? {
          id: order.invoice.id,
          invoiceNumber: order.invoice.invoiceNumber,
          pdfUrl: order.invoice.pdfUrl,
        } : null,
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          subtitle: course.subtitle,
          thumbnail: course.thumbnail,
          instructorName: course.instructorName,
          duration: course.duration,
        },
        progress: {
          totalLessons,
          completedCount,
          percentage,
        },
        certificate: certificate ? {
          id: certificate.id,
          certificateId: certificate.certificateId,
          verificationToken: certificate.verificationToken,
          qrCodeUrl: certificate.qrCodeUrl,
          issueDate: certificate.issueDate,
        } : null,
      };
    });

    return res.json(purchasedCourses);
  } catch (error) {
    console.error('[GET PURCHASED COURSES ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve purchased courses.' });
  }
};
