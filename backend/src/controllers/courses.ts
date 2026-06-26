import { Request, Response } from 'express';
import prisma from '../config/db';
import { saveBase64File, deleteFile } from '../utils/storage';

// Helper slug generator
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

// ==========================================
// CATEGORY CONTROLLERS
// ==========================================

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });
    return res.json(categories);
  } catch (error) {
    console.error('[GET CATEGORIES ERROR]', error);
    return res.status(500).json({ message: 'Failed to fetch categories.' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const slug = slugify(name);
    
    // Check duplication
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ message: 'Category already exists.' });

    const category = await prisma.category.create({
      data: { name, slug, description },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('[CREATE CATEGORY ERROR]', error);
    return res.status(500).json({ message: 'Failed to create category.' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        ...(name && { slug: slugify(name) }),
      },
    });

    return res.json(category);
  } catch (error) {
    console.error('[UPDATE CATEGORY ERROR]', error);
    return res.status(500).json({ message: 'Failed to update category.' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Check if courses are attached
    const courseCount = await prisma.course.count({ where: { categoryId: id } });
    if (courseCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category. Courses are currently assigned to it.' });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('[DELETE CATEGORY ERROR]', error);
    return res.status(500).json({ message: 'Failed to delete category.' });
  }
};

// ==========================================
// COURSE CONTROLLERS
// ==========================================

export const getCourses = async (req: Request, res: Response) => {
  try {
    const { search, category, difficulty, rating, priceType } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { subtitle: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.categoryId = String(category);
    }

    if (difficulty) {
      whereClause.difficulty = String(difficulty);
    }

    if (priceType) {
      if (priceType === 'free') {
        whereClause.price = 0;
      } else if (priceType === 'paid') {
        whereClause.price = { gt: 0 };
      }
    }

    // Default fetch only published courses for guests/students
    // Admin can fetch everything. We check if user is admin
    // Note: We bypass checking roles on public browse, but we could add an isDashboard/isAdminQuery flag
    const showAll = req.query.adminView === 'true';
    if (!showAll) {
      whereClause.isPublished = true;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        category: true,
        modules: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format list adding calculations like average ratings
    const formatted = courses.map((course) => {
      const reviewCount = course.reviews.length;
      const avgRating = reviewCount > 0 
        ? parseFloat((course.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price,
        discount: course.discount,
        duration: course.duration,
        difficulty: course.difficulty,
        language: course.language,
        instructorName: course.instructorName,
        categoryName: course.category.name,
        categoryId: course.categoryId,
        isPublished: course.isPublished,
        avgRating,
        reviewCount,
        totalLessons,
      };
    });

    // Apply rating filter in JS if requested
    let finalResult = formatted;
    if (rating) {
      const minRating = parseFloat(String(rating));
      finalResult = formatted.filter((c) => c.avgRating >= minRating);
    }

    return res.json(finalResult);
  } catch (error) {
    console.error('[GET COURSES ERROR]', error);
    return res.status(500).json({ message: 'Failed to search courses.' });
  }
};

export const getCourseDetails = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ]
      },
      include: {
        category: true,
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                sortOrder: true,
                videoDuration: true,
                isFreePreview: true,
              },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!course) return res.status(404).json({ message: 'Course not found.' });

    // Math ratings
    const reviewCount = course.reviews.length;
    const avgRating = reviewCount > 0
      ? parseFloat((course.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewCount).toFixed(1))
      : 0;

    return res.json({
      ...course,
      avgRating,
      reviewCount,
    });
  } catch (error) {
    console.error('[GET COURSE DETAILS ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve course details.' });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      subtitle,
      price,
      discount,
      difficulty,
      language,
      categoryId,
      instructorName,
      instructorBio,
      thumbnail,
      previewVideo,
    } = req.body;

    if (!title || !description || price === undefined || !difficulty || !categoryId || !instructorName) {
      return res.status(400).json({ message: 'Fill out all required course fields.' });
    }

    const slug = slugify(title);

    // Check duplicate title
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ message: 'A course with this title already exists.' });

    // Handle thumbnail base64 upload
    let thumbnailUrl = null;
    if (thumbnail) {
      thumbnailUrl = await saveBase64File(thumbnail, 'thumbnails');
    }

    // Handle preview video base64 upload if provided
    let videoUrl = null;
    if (previewVideo) {
      videoUrl = await saveBase64File(previewVideo, 'videos');
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        subtitle,
        description,
        price: parseFloat(price),
        discount: discount ? parseFloat(discount) : 0,
        difficulty,
        language,
        categoryId,
        instructorName,
        instructorBio,
        thumbnail: thumbnailUrl,
        previewVideo: videoUrl,
      },
    });

    return res.status(201).json(course);
  } catch (error) {
    console.error('[CREATE COURSE ERROR]', error);
    return res.status(500).json({ message: 'Failed to create course.' });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: any = { ...req.body };

    // Find course first
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    if (data.title && data.title !== course.title) {
      data.slug = slugify(data.title);
    }

    if (data.price !== undefined) data.price = parseFloat(data.price);
    if (data.discount !== undefined) data.discount = parseFloat(data.discount);
    if (data.duration !== undefined) data.duration = parseFloat(data.duration);

    // If thumbnail changed (base64 string uploaded)
    if (data.thumbnail && data.thumbnail.startsWith('data:')) {
      if (course.thumbnail) {
        await deleteFile(course.thumbnail);
      }
      data.thumbnail = await saveBase64File(data.thumbnail, 'thumbnails');
    }

    // If previewVideo changed (base64 string uploaded)
    if (data.previewVideo && data.previewVideo.startsWith('data:')) {
      if (course.previewVideo) {
        await deleteFile(course.previewVideo);
      }
      data.previewVideo = await saveBase64File(data.previewVideo, 'videos');
    }

    const updated = await prisma.course.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (error) {
    console.error('[UPDATE COURSE ERROR]', error);
    return res.status(500).json({ message: 'Failed to update course.' });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    // Clean files
    if (course.thumbnail) await deleteFile(course.thumbnail);
    if (course.previewVideo) await deleteFile(course.previewVideo);

    // Delete cascading references
    await prisma.course.delete({ where: { id } });
    return res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('[DELETE COURSE ERROR]', error);
    return res.status(500).json({ message: 'Failed to delete course.' });
  }
};

// ==========================================
// MODULE CONTROLLERS
// ==========================================

export const createModule = async (req: Request, res: Response) => {
  try {
    const { title, courseId } = req.body;
    if (!title || !courseId) {
      return res.status(400).json({ message: 'Title and Course ID are required.' });
    }

    // Find current modules count to generate sortOrder
    const count = await prisma.module.count({ where: { courseId } });

    const moduleRecord = await prisma.module.create({
      data: {
        title,
        courseId,
        sortOrder: count + 1,
      },
    });

    return res.status(201).json(moduleRecord);
  } catch (error) {
    console.error('[CREATE MODULE ERROR]', error);
    return res.status(500).json({ message: 'Failed to create module.' });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title } = req.body;

    const moduleRecord = await prisma.module.update({
      where: { id },
      data: { title },
    });

    return res.json(moduleRecord);
  } catch (error) {
    console.error('[UPDATE MODULE ERROR]', error);
    return res.status(500).json({ message: 'Failed to update module.' });
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.module.delete({ where: { id } });
    return res.json({ message: 'Module deleted successfully.' });
  } catch (error) {
    console.error('[DELETE MODULE ERROR]', error);
    return res.status(500).json({ message: 'Failed to delete module.' });
  }
};

export const reorderModules = async (req: Request, res: Response) => {
  try {
    const { moduleIds } = req.body; // Expects array of string ids: ["id1", "id2", ...]
    if (!moduleIds || !Array.isArray(moduleIds)) {
      return res.status(400).json({ message: 'moduleIds array is required.' });
    }

    // Update in transaction
    await prisma.$transaction(
      moduleIds.map((id, index) =>
        prisma.module.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    return res.json({ message: 'Modules reordered successfully.' });
  } catch (error) {
    console.error('[REORDER MODULES ERROR]', error);
    return res.status(500).json({ message: 'Failed to save module ordering.' });
  }
};

// ==========================================
// LESSON CONTROLLERS
// ==========================================

export const createLesson = async (req: Request, res: Response) => {
  try {
    const { title, moduleId, videoUrl, videoDuration, isFreePreview, notesFile, notesFilename } = req.body;

    if (!title || !moduleId) {
      return res.status(400).json({ message: 'Title and Module ID are required.' });
    }

    const count = await prisma.lesson.count({ where: { moduleId } });

    // Handle PDF notes base64 upload if provided
    let notesUrl = null;
    let savedFilename = null;
    if (notesFile) {
      notesUrl = await saveBase64File(notesFile, 'resources');
      savedFilename = notesFilename || 'LessonNotes.pdf';
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        moduleId,
        videoUrl: videoUrl || null,
        videoDuration: videoDuration ? parseFloat(videoDuration) : 0,
        isFreePreview: isFreePreview === true || isFreePreview === 'true',
        notesUrl,
        notesFilename: savedFilename,
        sortOrder: count + 1,
      },
    });

    // Update the parent course duration estimate (sum of all lesson durations)
    const moduleInfo = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (moduleInfo) {
      const allLessons = await prisma.lesson.findMany({
        where: { module: { courseId: moduleInfo.courseId } },
        select: { videoDuration: true },
      });
      const totalSeconds = allLessons.reduce((sum, l) => sum + l.videoDuration, 0);
      const totalHours = parseFloat((totalSeconds / 3600).toFixed(2));

      await prisma.course.update({
        where: { id: moduleInfo.courseId },
        data: { duration: totalHours },
      });
    }

    return res.status(201).json(lesson);
  } catch (error) {
    console.error('[CREATE LESSON ERROR]', error);
    return res.status(500).json({ message: 'Failed to create lesson.' });
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: any = { ...req.body };

    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

    // Parse values
    if (data.isFreePreview !== undefined) {
      data.isFreePreview = data.isFreePreview === true || data.isFreePreview === 'true';
    }
    if (data.videoDuration !== undefined) {
      data.videoDuration = parseFloat(data.videoDuration);
    }

    // Handle PDF notes base64 update
    if (data.notesFile && data.notesFile.startsWith('data:')) {
      if (lesson.notesUrl) {
        await deleteFile(lesson.notesUrl);
      }
      data.notesUrl = await saveBase64File(data.notesFile, 'resources');
      data.notesFilename = data.notesFilename || 'Notes.pdf';
      delete data.notesFile;
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data,
    });

    // Recalculate duration
    const moduleInfo = await prisma.module.findUnique({
      where: { id: updated.moduleId },
      select: { courseId: true },
    });
    if (moduleInfo) {
      const allLessons = await prisma.lesson.findMany({
        where: { module: { courseId: moduleInfo.courseId } },
        select: { videoDuration: true },
      });
      const totalSeconds = allLessons.reduce((sum, l) => sum + l.videoDuration, 0);
      const totalHours = parseFloat((totalSeconds / 3600).toFixed(2));

      await prisma.course.update({
        where: { id: moduleInfo.courseId },
        data: { duration: totalHours },
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error('[UPDATE LESSON ERROR]', error);
    return res.status(500).json({ message: 'Failed to update lesson.' });
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

    if (lesson.notesUrl) {
      await deleteFile(lesson.notesUrl);
    }

    await prisma.lesson.delete({ where: { id } });
    return res.json({ message: 'Lesson deleted successfully.' });
  } catch (error) {
    console.error('[DELETE LESSON ERROR]', error);
    return res.status(500).json({ message: 'Failed to delete lesson.' });
  }
};

export const reorderLessons = async (req: Request, res: Response) => {
  try {
    const { lessonIds } = req.body;
    if (!lessonIds || !Array.isArray(lessonIds)) {
      return res.status(400).json({ message: 'lessonIds array is required.' });
    }

    await prisma.$transaction(
      lessonIds.map((id, index) =>
        prisma.lesson.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    return res.json({ message: 'Lessons reordered successfully.' });
  } catch (error) {
    console.error('[REORDER LESSONS ERROR]', error);
    return res.status(500).json({ message: 'Failed to save lesson ordering.' });
  }
};
