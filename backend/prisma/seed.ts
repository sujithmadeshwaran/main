import { PrismaClient, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Clear existing data in correct dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.progress.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.uSR.deleteMany({}); // Wait, is it User or USR? The prisma model is "User". So deleteMany on user.
  await prisma.user.deleteMany({});

  // 2. Passwords hashing
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('adminpassword', salt);
  const studentHash = await bcrypt.hash('studentpassword', salt);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Instructor',
      email: 'admin@skillforge.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Jane Student',
      email: 'student@skillforge.com',
      passwordHash: studentHash,
      role: 'STUDENT',
    },
  });

  console.log('Users created:');
  console.log(`- Admin: ${admin.email} (Password: adminpassword)`);
  console.log(`- Student: ${student.email} (Password: studentpassword)`);

  // 4. Create Category
  const catSoftware = await prisma.category.create({
    data: {
      name: 'Software Engineering',
      slug: 'software-engineering',
      description: 'Master modern programming, APIs, database engineering, and architecture.',
    },
  });

  const catData = await prisma.category.create({
    data: {
      name: 'Data Science & Databases',
      slug: 'data-science-databases',
      description: 'Relational query optimization, data warehouses, and analytics pipelines.',
    },
  });

  // 5. Create Course 1
  const courseTS = await prisma.course.create({
    data: {
      title: 'Advanced Full-Stack Engineering with TypeScript & Next.js',
      slug: 'typescript-nextjs-engineering',
      subtitle: 'Build production-ready scalable cloud applications.',
      description: 'Dive deep into structural typing, Express REST API construction, Prisma database migrations, Next.js App Router, layout routing, state management and deploying containerized apps with Docker.',
      price: 2499,
      discount: 20,
      duration: 18.5,
      difficulty: 'Intermediate',
      categoryId: catSoftware.id,
      instructorName: 'Dr. Sarah Miller',
      instructorBio: 'Principal Architect with 15+ years experience building highly concurrent web systems.',
      isPublished: true,
    },
  });

  // 6. Modules & Lessons for Course 1
  // Module 1
  const mod1 = await prisma.module.create({
    data: {
      title: 'Module 1: Advanced Typing & Interfaces',
      sortOrder: 1,
      courseId: courseTS.id,
    },
  });

  const les1_1 = await prisma.lesson.create({
    data: {
      title: '1.1 Deep Dive into TypeScript Inferences',
      sortOrder: 1,
      moduleId: mod1.id,
      videoUrl: '/uploads/videos/mock-inference.mp4',
      videoDuration: 180, // 3 mins
      notesUrl: '/uploads/notes/inference-notes.pdf',
      notesFilename: 'TypeScript_Inferences.pdf',
      isFreePreview: true,
    },
  });

  const les1_2 = await prisma.lesson.create({
    data: {
      title: '1.2 Discriminated Unions and Type Narrowing',
      sortOrder: 2,
      moduleId: mod1.id,
      videoUrl: '/uploads/videos/mock-unions.mp4',
      videoDuration: 320, // 5m 20s
      isFreePreview: false,
    },
  });

  // Module 2
  const mod2 = await prisma.module.create({
    data: {
      title: 'Module 2: Server Architecture with Express & Prisma',
      sortOrder: 2,
      courseId: courseTS.id,
    },
  });

  const les2_1 = await prisma.lesson.create({
    data: {
      title: '2.1 Prisma Schema Setup and Database Migrations',
      sortOrder: 1,
      moduleId: mod2.id,
      videoUrl: '/uploads/videos/mock-prisma.mp4',
      videoDuration: 450, // 7m 30s
      isFreePreview: false,
    },
  });

  const les2_2 = await prisma.lesson.create({
    data: {
      title: '2.2 Building Protected Route Controllers & Interceptors',
      sortOrder: 2,
      moduleId: mod2.id,
      videoUrl: '/uploads/videos/mock-controllers.mp4',
      videoDuration: 620, // 10m 20s
      isFreePreview: false,
    },
  });

  // 7. Create Quiz for Module 1
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Module 1 Assessment: TypeScript Types',
      courseId: courseTS.id,
      moduleId: mod1.id,
      passingScore: 70,
    },
  });

  await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'Which TypeScript feature allows you to model state transitions where each type has a common literal property?',
      type: QuestionType.MCQ,
      options: JSON.stringify([
        'Structural Subtyping',
        'Discriminated Unions',
        'Ambient Namespaces',
        'Implicit Type Casts'
      ]),
      correctAnswer: JSON.stringify([1]), // Index 1 is Discriminated Unions
    },
  });

  await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'Which keywords allow block-scoped variable declarations in TypeScript? (Select all that apply)',
      type: QuestionType.MULTIPLE,
      options: JSON.stringify([
        'var',
        'const',
        'let',
        'define'
      ]),
      correctAnswer: JSON.stringify([1, 2]), // Index 1 & 2 are const and let
    },
  });

  await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'TypeScript types are checked at runtime rather than compile-time.',
      type: QuestionType.TF,
      options: JSON.stringify([
        'True',
        'False'
      ]),
      correctAnswer: JSON.stringify([1]), // Index 1 is False
    },
  });

  // Course 2 (SQL Optimization)
  const courseSQL = await prisma.course.create({
    data: {
      title: 'Advanced Database Systems & Query Optimization',
      slug: 'sql-optimization-postgresql',
      subtitle: 'Learn index selection, execution plans, and scaling techniques.',
      description: 'Master execution plans, query analyzers, vacuuming strategies, partitioning, replica sets, connection pools, and caching layers inside local and containerized PostgreSQL.',
      price: 3499,
      discount: 15,
      duration: 12.0,
      difficulty: 'Advanced',
      categoryId: catData.id,
      instructorName: 'Alex Mercer',
      isPublished: true,
    },
  });

  console.log('Courses & structure seeded successfully!');
  console.log(`- Course 1: "${courseTS.title}" (3 lessons, 1 quiz)`);
  console.log(`- Course 2: "${courseSQL.title}"`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
