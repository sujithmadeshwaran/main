import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import crypto from 'crypto';
import { generateCertificatePDF } from '../utils/certificate';
import { sendEmail } from '../utils/otp';

// Helper to generate unique Certificate ID
const generateCertificateId = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.certificate.count();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CERT-${dateStr}-${count + randomSuffix}`;
};

export const generateCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });
    if (!courseId) return res.status(400).json({ message: 'Course ID is required.' });

    // Fetch user and course details
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!user || !course) {
      return res.status(404).json({ message: 'User or course details not found.' });
    }

    // Check if certificate already exists
    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      return res.json({
        message: 'Certificate already issued.',
        certificate: existing,
      });
    }

    // Check completion progress (must be 100%)
    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    });

    const lessonIds = lessons.map((l) => l.id);
    const progressCount = await prisma.progress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        isCompleted: true,
      },
    });

    if (lessonIds.length === 0 || progressCount < lessonIds.length) {
      return res.status(400).json({
        message: `Course not completed. Completed: ${progressCount}/${lessonIds.length} lessons. Progress must be 100%.`,
      });
    }

    // Generate unique Certificate details
    const certificateId = await generateCertificateId();
    const verificationToken = crypto.randomUUID();
    const host = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${host}/verify-certificate/${verificationToken}`;

    const pdfUrl = await generateCertificatePDF({
      certificateId,
      studentName: user.name,
      courseTitle: course.title,
      issueDate: new Date(),
      verificationUrl,
    });

    const certificate = await prisma.certificate.create({
      data: {
        certificateId,
        userId,
        courseId,
        verificationToken,
        qrCodeUrl: pdfUrl, // Store PDF URL reference
        signatureUrl: 'https://skillforge.com/signatures/director.png',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CERTIFICATE_ISSUED',
        details: `Earned certificate for: ${course.title}. Certificate ID: ${certificateId}`,
      },
    });

    // Dispatch email
    if (user.email) {
      await sendEmail(
        user.email,
        'Congratulations! Your Certificate is Ready - SkillForge LMS',
        `<h3>Congratulations ${user.name}!</h3>
        <p>You have successfully completed 100% of the lessons in the course <strong>"${course.title}"</strong>.</p>
        <p>Your official verifiable Certificate of Completion is ready.</p>
        <p>Certificate ID: <strong>${certificateId}</strong></p>
        <p>You can download your PDF Certificate from your dashboard or verify its authenticity anytime.</p>`
      );
    }

    return res.status(201).json({
      message: 'Certificate generated successfully.',
      certificate,
    });
  } catch (error) {
    console.error('[GENERATE CERTIFICATE ERROR]', error);
    return res.status(500).json({ message: 'Failed to generate certificate.' });
  }
};

export const getUserCertificates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: { select: { title: true, slug: true, duration: true } },
      },
    });

    return res.json(certificates);
  } catch (error) {
    console.error('[GET USER CERTIFICATES ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve certificates.' });
  }
};

export const verifyCertificateOnline = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verificationToken: token },
          { certificateId: token },
        ],
      },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    });

    if (!certificate) {
      return res.status(404).json({ valid: false, message: 'Invalid certificate credential reference.' });
    }

    return res.json({
      valid: true,
      certificateId: certificate.certificateId,
      studentName: certificate.user.name,
      courseTitle: certificate.course.title,
      issueDate: certificate.issueDate,
    });
  } catch (error) {
    console.error('[VERIFY CERTIFICATE ERROR]', error);
    return res.status(500).json({ message: 'Error processing certificate verification.' });
  }
};
