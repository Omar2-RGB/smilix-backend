const prisma = require("../config/db");

const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalPatients,
      todayAppointmentsCount,
      todayPayments,
      latestAppointments,
      latestPatients,
    ] = await Promise.all([
      prisma.patient.count(),

      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          paymentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      prisma.appointment.findMany({
        orderBy: [
          { appointmentDate: "desc" },
          { appointmentTime: "desc" },
        ],
        take: 5,
        include: {
          patient: true,
        },
      }),

      prisma.patient.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return res.status(200).json({
      stats: {
        totalPatients,
        todayAppointments: todayAppointmentsCount,
        todayPayments: Number(todayPayments._sum.amount || 0),
      },
      latestAppointments: latestAppointments.map((item) => ({
        id: item.id,
        patientName: item.patient?.fullName || "-",
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        status: item.status,
        source: item.source,
        notes: item.notes,
      })),
      latestPatients: latestPatients.map((item) => ({
        id: item.id,
        fullName: item.fullName,
        phone: item.phone,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { gaetDashboardSummary };