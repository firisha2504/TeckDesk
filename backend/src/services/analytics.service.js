import mongoose from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Organization } from '../models/Organization.js';
import { AuditLog } from '../models/AuditLog.js';

export const analyticsService = {
  getEmployeeMetrics: async (userId, organizationId) => {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [openCount, inProgressCount, resolvedTodayCount, totalCount] = await Promise.all([
      Ticket.countDocuments({ creator: userObjId, status: { $in: ['Open', 'Assigned'] } }),
      Ticket.countDocuments({ creator: userObjId, status: { $in: ['In Progress', 'Pending User'] } }),
      Ticket.countDocuments({
        creator: userObjId,
        status: { $in: ['Resolved', 'Closed'] },
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Ticket.countDocuments({ creator: userObjId }),
    ]);

    // Ticket overview trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trends = await Ticket.aggregate([
      {
        $match: {
          creator: userObjId,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%b %d', date: '$createdAt' } },
          created: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const recentTickets = await Ticket.find({ creator: userObjId })
      .populate('assignee', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      openCount,
      inProgressCount,
      resolvedTodayCount,
      totalCount,
      trends,
      recentTickets,
    };
  },

  getTechnicianMetrics: async (userId, organizationId) => {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const userObjId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const thirtyMinAhead = new Date(now.getTime() + 30 * 60 * 1000);

    const [assignedWorkload, overdueCount, approachingSLA, resolvedTotal, avgResolutionAgg] =
      await Promise.all([
        Ticket.countDocuments({
          assignee: userObjId,
          status: { $in: ['Assigned', 'In Progress', 'Pending User'] },
        }),
        Ticket.countDocuments({
          assignee: userObjId,
          status: { $nin: ['Resolved', 'Closed'] },
          'sla.resolutionDeadline': { $lt: now },
        }),
        Ticket.countDocuments({
          assignee: userObjId,
          status: { $in: ['Assigned', 'In Progress'] },
          'sla.resolutionDeadline': { $gt: now, $lte: thirtyMinAhead },
        }),
        Ticket.countDocuments({
          assignee: userObjId,
          status: { $in: ['Resolved', 'Closed'] },
        }),
        // Calculate average resolution time in hours
        Ticket.aggregate([
          {
            $match: {
              assignee: userObjId,
              status: { $in: ['Resolved', 'Closed'] },
              'sla.resolvedAt': { $exists: true },
            },
          },
          {
            $project: {
              durationHours: {
                $divide: [{ $subtract: ['$sla.resolvedAt', '$createdAt'] }, 1000 * 60 * 60],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgHours: { $avg: '$durationHours' },
            },
          },
        ]),
      ]);

    const avgResolutionHours = avgResolutionAgg[0]?.avgHours
      ? Number(avgResolutionAgg[0].avgHours.toFixed(1))
      : 0;

    const assignedTickets = await Ticket.find({
      assignee: userObjId,
      status: { $nin: ['Resolved', 'Closed'] },
    })
      .populate('creator', 'name email avatar')
      .sort({ 'sla.resolutionDeadline': 1 })
      .limit(10)
      .lean();

    return {
      assignedWorkload,
      overdueCount,
      approachingSLA,
      resolvedTotal,
      avgResolutionHours,
      assignedTickets,
    };
  },

  getManagerMetrics: async (organizationId, { startDate, endDate } = {}) => {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const matchFilter = { organization: orgId };

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalTickets,
      openTickets,
      priorityCounts,
      categoryCounts,
      slaComplianceStats,
      avgResolutionAgg,
      avgResponseAgg,
      technicianPerformance,
      trends,
    ] = await Promise.all([
      Ticket.countDocuments(matchFilter),
      Ticket.countDocuments({ ...matchFilter, status: { $in: ['Open', 'Assigned', 'In Progress'] } }),
      // Priority distribution
      Ticket.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      // Category distribution
      Ticket.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      // SLA compliance rate
      Ticket.aggregate([
        {
          $match: {
            organization: orgId,
            status: { $in: ['Resolved', 'Closed'] },
          },
        },
        {
          $group: {
            _id: null,
            totalResolved: { $sum: 1 },
            breachedCount: {
              $sum: { $cond: ['$sla.isResolutionBreached', 1, 0] },
            },
          },
        },
      ]),
      // Average resolution time in hours
      Ticket.aggregate([
        {
          $match: {
            organization: orgId,
            status: { $in: ['Resolved', 'Closed'] },
            'sla.resolvedAt': { $exists: true },
          },
        },
        {
          $project: {
            durationHours: {
              $divide: [{ $subtract: ['$sla.resolvedAt', '$createdAt'] }, 1000 * 60 * 60],
            },
          },
        },
        { $group: { _id: null, avgHours: { $avg: '$durationHours' } } },
      ]),
      // Average first response time in hours
      Ticket.aggregate([
        {
          $match: {
            organization: orgId,
            'sla.firstResponseAt': { $exists: true },
          },
        },
        {
          $project: {
            durationHours: {
              $divide: [{ $subtract: ['$sla.firstResponseAt', '$createdAt'] }, 1000 * 60 * 60],
            },
          },
        },
        { $group: { _id: null, avgHours: { $avg: '$durationHours' } } },
      ]),
      // Team / Technician performance table
      User.aggregate([
        { $match: { organization: orgId, role: 'technician', isActive: true } },
        {
          $lookup: {
            from: 'tickets',
            localField: '_id',
            foreignField: 'assignee',
            as: 'tickets',
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            assignedCount: {
              $size: {
                $filter: {
                  input: '$tickets',
                  as: 't',
                  cond: { $in: ['$$t.status', ['Assigned', 'In Progress', 'Pending User']] },
                },
              },
            },
            resolvedCount: {
              $size: {
                $filter: {
                  input: '$tickets',
                  as: 't',
                  cond: { $in: ['$$t.status', ['Resolved', 'Closed']] },
                },
              },
            },
            breachedCount: {
              $size: {
                $filter: {
                  input: '$tickets',
                  as: 't',
                  cond: { $eq: ['$$t.sla.isResolutionBreached', true] },
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            assignedCount: 1,
            resolvedCount: 1,
            slaPercent: {
              $cond: [
                { $gt: ['$resolvedCount', 0] },
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: [{ $subtract: ['$resolvedCount', '$breachedCount'] }, '$resolvedCount'] },
                        100,
                      ],
                    },
                    0,
                  ],
                },
                100,
              ],
            },
          },
        },
        { $limit: 10 },
      ]),
      // 7-day trend
      Ticket.aggregate([
        {
          $match: {
            organization: orgId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%b %d', date: '$createdAt' } },
            created: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Format priority breakdown
    const priorityMap = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    priorityCounts.forEach((p) => {
      if (p._id) priorityMap[p._id] = p.count;
    });

    const categoryMap = {};
    categoryCounts.forEach((c) => {
      if (c._id) categoryMap[c._id] = c.count;
    });

    const totalResolved = slaComplianceStats[0]?.totalResolved || 0;
    const breachedCount = slaComplianceStats[0]?.breachedCount || 0;
    const slaComplianceRate = totalResolved > 0
      ? Math.round(((totalResolved - breachedCount) / totalResolved) * 100)
      : 100;

    const avgResolutionHours = avgResolutionAgg[0]?.avgHours
      ? Number(avgResolutionAgg[0].avgHours.toFixed(1))
      : 0;

    const avgResponseHours = avgResponseAgg[0]?.avgHours
      ? Number(avgResponseAgg[0].avgHours.toFixed(1))
      : 0;

    return {
      totalTickets,
      openTickets,
      avgResponseTime: avgResponseHours > 0 ? `${avgResponseHours}h` : 'N/A',
      avgResolutionTime: avgResolutionHours > 0 ? `${avgResolutionHours}h` : 'N/A',
      slaComplianceRate: `${slaComplianceRate}%`,
      priorityBreakdown: priorityMap,
      categoryBreakdown: categoryMap,
      technicianPerformance,
      trends,
    };
  },

  getAdminMetrics: async (organizationId) => {
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const [totalUsers, totalOrganizations, openTickets, roleBreakdown, recentAuditLogs, trends] =
      await Promise.all([
        User.countDocuments({ organization: orgId }),
        Organization.countDocuments(),
        Ticket.countDocuments({ organization: orgId, status: { $in: ['Open', 'Assigned', 'In Progress'] } }),
        User.aggregate([
          { $match: { organization: orgId } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
        AuditLog.find({ organization: orgId })
          .populate('actor', 'name email role')
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        Ticket.aggregate([
          {
            $match: {
              organization: orgId,
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%b %d', date: '$createdAt' } },
              created: { $sum: 1 },
              resolved: {
                $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const uptimeSec = Math.floor(process.uptime());
    const uptimeHours = Math.floor(uptimeSec / 3600);
    const uptimeMins = Math.floor((uptimeSec % 3600) / 60);
    const systemUptime = uptimeHours > 0 ? `${uptimeHours}h ${uptimeMins}m` : `${uptimeMins}m`;

    return {
      totalUsers,
      totalOrganizations,
      openTickets,
      systemUptime,
      roleBreakdown,
      recentAuditLogs,
      trends,
    };
  },

  exportTicketsCSV: async (organizationId, filters = {}, user) => {
    const query = { organization: organizationId };

    if (user?.role === 'technician') {
      query.assignee = user._id;
    } else if (user?.role === 'employee') {
      query.creator = user._id;
    } else if (filters.assignee) {
      query.assignee = filters.assignee;
    }

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;

    const tickets = await Ticket.find(query)
      .populate('creator', 'name email')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Ticket Number',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Creator Name',
      'Creator Email',
      'Assignee Name',
      'Assignee Email',
      'Response Deadline',
      'Resolution Deadline',
      'SLA Breached',
      'Created Date',
    ];

    const rows = tickets.map((t) => [
      t.ticketNumber,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      `"${t.creator?.name || ''}"`,
      t.creator?.email || '',
      `"${t.assignee?.name || 'Unassigned'}"`,
      t.assignee?.email || '',
      t.sla?.responseDeadline ? new Date(t.sla.responseDeadline).toISOString() : '',
      t.sla?.resolutionDeadline ? new Date(t.sla.resolutionDeadline).toISOString() : '',
      t.sla?.isResolutionBreached ? 'YES' : 'NO',
      new Date(t.createdAt).toISOString(),
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvString;
  },
};
