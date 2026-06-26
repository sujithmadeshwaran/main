import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'STUDENT' } });
    
    // Sum Completed payments
    const successfulOrders = await prisma.order.findMany({
      where: { status: 'COMPLETED' },
      select: { amount: true },
    });
    const totalRevenue = successfulOrders.reduce((sum, order) => sum + order.amount, 0);

    const certificatesIssued = await prisma.certificate.count();
    
    const activeSessions = await prisma.refreshToken.count();

    // Fetch Course Sales breakdown
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        orders: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
      },
    });

    const courseSales = courses.map((c) => {
      const salesCount = c.orders.length;
      const revenue = c.orders.reduce((sum, o) => sum + o.amount, 0);
      return {
        id: c.id,
        title: c.title,
        salesCount,
        revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue); // Top revenue first

    // Fetch Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    return res.json({
      stats: {
        totalUsers,
        totalRevenue,
        certificatesIssued,
        activeUsers: activeSessions,
      },
      courseSales,
      recentOrders,
    });
  } catch (error) {
    console.error('[GET ANALYTICS ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve admin analytics.' });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: { where: { status: 'COMPLETED' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (error) {
    console.error('[GET USERS ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve user list.' });
  }
};

export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body; // boolean

    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive status is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: isActive === true || isActive === 'true' },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'USER_STATUS_TOGGLE',
        details: `Toggled user ${updatedUser.name} (${updatedUser.id}) status. Active: ${updatedUser.isActive}`,
      },
    });

    return res.json({
      message: `User status changed to ${updatedUser.isActive ? 'Active' : 'Suspended'}.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('[TOGGLE USER STATUS ERROR]', error);
    return res.status(500).json({ message: 'Failed to toggle user status.' });
  }
};
