import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Team } from '../src/models/Team.js';
import { SLAPolicy } from '../src/models/SLAPolicy.js';
import { Ticket } from '../src/models/Ticket.js';
import { TicketComment } from '../src/models/TicketComment.js';
import { TicketEvent } from '../src/models/TicketEvent.js';
import { Notification } from '../src/models/Notification.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { logger } from '../src/utils/logger.js';

async function seedDatabase() {
  try {
    logger.info('Starting TechDesk database seeding...');
    await connectDatabase();

    // Clear existing collections
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Team.deleteMany({}),
      SLAPolicy.deleteMany({}),
      Ticket.deleteMany({}),
      TicketComment.deleteMany({}),
      TicketEvent.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    logger.info('Cleared existing collections.');

    // 1. Create Organization
    const organization = await Organization.create({
      name: 'TechDesk Solutions',
      slug: 'techdesk-solutions',
      domain: 'techdesk.internal',
      settings: {
        allowRegistration: true,
        defaultTicketPriority: 'Medium',
        businessHours: { start: '08:00', end: '18:00', timeZone: 'UTC' },
      },
    });

    // 2. Create SLA Policy
    const slaPolicy = await SLAPolicy.create({
      name: 'Enterprise SLA Policy',
      description: 'Standard enterprise service level agreement for all priority tiers',
      organization: organization._id,
      isDefault: true,
      priorities: {
        Critical: { responseTimeMinutes: 15, resolutionTimeMinutes: 120 },
        High: { responseTimeMinutes: 60, resolutionTimeMinutes: 480 },
        Medium: { responseTimeMinutes: 240, resolutionTimeMinutes: 1440 },
        Low: { responseTimeMinutes: 480, resolutionTimeMinutes: 2880 },
      },
      escalationEmail: 'escalations@techdesk.internal',
    });

    // 3. Create Users
    const defaultPassword = 'Password123!';

    const admin = await User.create({
      name: 'Firomsa Abdi',
      email: 'admin@techdesk.com',
      password: defaultPassword,
      role: 'admin',
      organization: organization._id,
      skills: ['Security', 'Cloud', 'Architecture'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
    });

    const manager = await User.create({
      name: 'Abebe Kebede',
      email: 'manager@techdesk.com',
      password: defaultPassword,
      role: 'manager',
      organization: organization._id,
      skills: ['Operations', 'Team Leadership', 'Incident Response'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isActive: true,
    });

    const techTadesse = await User.create({
      name: 'Tadesse Gebre',
      email: 'tadesse@techdesk.com',
      password: defaultPassword,
      role: 'technician',
      organization: organization._id,
      skills: ['Hardware', 'Network'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      isActive: true,
    });

    const techSelamawit = await User.create({
      name: 'Selamawit Abate',
      email: 'selamawit@techdesk.com',
      password: defaultPassword,
      role: 'technician',
      organization: organization._id,
      skills: ['Software', 'Account', 'Security'],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      isActive: true,
    });

    const techDaniel = await User.create({
      name: 'Daniel Tesfaye',
      email: 'daniel@techdesk.com',
      password: defaultPassword,
      role: 'technician',
      organization: organization._id,
      skills: ['Hardware', 'Other'],
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      isActive: true,
    });

    const techMekdes = await User.create({
      name: 'Mekdes Alemu',
      email: 'mekdes@techdesk.com',
      password: defaultPassword,
      role: 'technician',
      organization: organization._id,
      skills: ['Software', 'Network'],
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isActive: true,
    });

    const employeeHana = await User.create({
      name: 'Hana Bekele',
      email: 'employee@techdesk.com',
      password: defaultPassword,
      role: 'employee',
      organization: organization._id,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      isActive: true,
    });

    const employeeYonas = await User.create({
      name: 'Yonas Haile',
      email: 'yonas@techdesk.com',
      password: defaultPassword,
      role: 'employee',
      organization: organization._id,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      isActive: true,
    });

    // 4. Create Teams and link members
    const teamSupport = await Team.create({
      name: 'Tier 1 Support',
      organization: organization._id,
      lead: manager._id,
      members: [techTadesse._id, techDaniel._id],
      specialties: ['Hardware', 'Other'],
    });

    const teamSoftware = await Team.create({
      name: 'Software & Cloud Systems',
      organization: organization._id,
      lead: manager._id,
      members: [techSelamawit._id, techMekdes._id],
      specialties: ['Software', 'Account', 'Security'],
    });

    const teamNetwork = await Team.create({
      name: 'Network & Infrastructure',
      organization: organization._id,
      lead: manager._id,
      members: [techTadesse._id, techMekdes._id],
      specialties: ['Network', 'Security'],
    });

    // Update users with their teams
    await User.updateMany({ _id: { $in: [techTadesse._id, techDaniel._id] } }, { team: teamSupport._id });
    await User.updateMany({ _id: { $in: [techSelamawit._id, techMekdes._id] } }, { team: teamSoftware._id });

    // 5. Create Sample Tickets matching visual mockup
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const ticket1 = await Ticket.create({
      ticketNumber: 'TD-1001',
      title: 'Email not working',
      description: 'Outlook fails to connect to the mail server. Getting error code 0x800CCC0E.',
      category: 'Software',
      priority: 'High',
      status: 'Open',
      creator: employeeHana._id,
      assignee: techSelamawit._id,
      team: teamSoftware._id,
      organization: organization._id,
      slaPolicy: slaPolicy._id,
      sla: {
        responseDeadline: new Date(now.getTime() + 45 * 60 * 1000),
        resolutionDeadline: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      createdAt: twoHoursAgo,
    });

    const ticket2 = await Ticket.create({
      ticketNumber: 'TD-1002',
      title: 'Laptop not turning on',
      description: 'My laptop (Dell Inspiron) is not powering on. The power light is red blinking and the screen remains black.',
      category: 'Hardware',
      priority: 'High',
      status: 'In Progress',
      creator: employeeHana._id,
      assignee: techTadesse._id,
      team: teamSupport._id,
      organization: organization._id,
      slaPolicy: slaPolicy._id,
      sla: {
        responseDeadline: fourHoursAgo,
        respondedAt: new Date(fourHoursAgo.getTime() + 15 * 60 * 1000),
        resolutionDeadline: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      createdAt: fourHoursAgo,
    });

    const ticket3 = await Ticket.create({
      ticketNumber: 'TD-1003',
      title: 'Software installation',
      description: 'Requesting Adobe Creative Cloud license and installation on workstation.',
      category: 'Software',
      priority: 'Low',
      status: 'Resolved',
      creator: employeeHana._id,
      assignee: techSelamawit._id,
      team: teamSoftware._id,
      organization: organization._id,
      slaPolicy: slaPolicy._id,
      sla: {
        responseDeadline: twoDaysAgo,
        respondedAt: new Date(twoDaysAgo.getTime() + 30 * 60 * 1000),
        resolutionDeadline: oneDayAgo,
        resolvedAt: new Date(oneDayAgo.getTime() + 2 * 60 * 60 * 1000),
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      resolutionNotes: 'Adobe CC enterprise license provisioned and deployed via Microsoft Intune.',
      createdAt: twoDaysAgo,
    });

    const ticket4 = await Ticket.create({
      ticketNumber: 'TD-1004',
      title: 'Access to system',
      description: 'Need elevated permissions to the production ERP portal for the Q4 financial audit.',
      category: 'Account',
      priority: 'Medium',
      status: 'Open',
      creator: employeeYonas._id,
      assignee: techSelamawit._id,
      team: teamSoftware._id,
      organization: organization._id,
      slaPolicy: slaPolicy._id,
      sla: {
        responseDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        resolutionDeadline: new Date(now.getTime() + 18 * 60 * 60 * 1000),
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      createdAt: oneDayAgo,
    });

    const ticket5 = await Ticket.create({
      ticketNumber: 'TD-1005',
      title: 'Printer not working',
      description: 'Network printer on 3rd floor west wing is displaying paper jam error despite being empty.',
      category: 'Hardware',
      priority: 'Medium',
      status: 'Pending User',
      creator: employeeHana._id,
      assignee: techDaniel._id,
      team: teamSupport._id,
      organization: organization._id,
      slaPolicy: slaPolicy._id,
      sla: {
        responseDeadline: twoDaysAgo,
        respondedAt: twoDaysAgo,
        resolutionDeadline: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      createdAt: twoDaysAgo,
    });

    const ticket6 = await Ticket.create({
      ticketNumber: 'TD-1006',
      title: 'VPN connection timeout',
      description: 'Unable to connect to corporate Wireguard VPN from remote office.',
      category: 'Network',
      priority: 'Critical',
      status: 'Resolved',
      creator: employeeYonas._id,
      assignee: techTadesse._id,
      team: teamNetwork._id,
      organization: organization._id,
      slaPolicy: slaPolicy._id,
      sla: {
        responseDeadline: oneDayAgo,
        respondedAt: oneDayAgo,
        resolutionDeadline: oneDayAgo,
        resolvedAt: new Date(oneDayAgo.getTime() + 45 * 60 * 1000),
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      resolutionNotes: 'Updated DNS routing table and refreshed certificate profile.',
      createdAt: oneDayAgo,
    });

    const ticket7 = await Ticket.create({
      ticketNumber: 'TD-1007',
      title: 'Database connection latency',
      description: 'Spikes in query execution time on internal CRM reporting database.',
      category: 'Security',
      priority: 'Critical',
      status: 'In Progress',
      creator: admin._id,
      assignee: techMekdes._id,
      team: teamSoftware._id,
      organization: organization._id,
      slaPolicy: slaPolicy._id,
      sla: {
        responseDeadline: twoHoursAgo,
        respondedAt: twoHoursAgo,
        resolutionDeadline: new Date(now.getTime() + 30 * 60 * 1000),
        isResponseBreached: false,
        isResolutionBreached: false,
      },
      createdAt: twoHoursAgo,
    });

    // 6. Comments for TD-1002
    await TicketComment.create([
      {
        ticket: ticket2._id,
        author: techTadesse._id,
        organization: organization._id,
        content: 'Hi Hana, please try holding down the power button for 30 seconds while unplugged, then reconnect power and try booting.',
        isInternal: false,
        createdAt: new Date(fourHoursAgo.getTime() + 20 * 60 * 1000),
      },
      {
        ticket: ticket2._id,
        author: employeeHana._id,
        organization: organization._id,
        content: 'I tried that multiple times, the light still flashes red twice and black screen persists.',
        isInternal: false,
        createdAt: new Date(fourHoursAgo.getTime() + 45 * 60 * 1000),
      },
      {
        ticket: ticket2._id,
        author: techTadesse._id,
        organization: organization._id,
        content: 'Internal Diagnostic: 2 red blinks on Dell Latitude indicates memory/RAM unseated. I will drop by her desk with a test SODIMM stick.',
        isInternal: true,
        createdAt: new Date(fourHoursAgo.getTime() + 50 * 60 * 1000),
      },
    ]);

    // 7. Timeline events for TD-1002
    await TicketEvent.create([
      {
        ticket: ticket2._id,
        organization: organization._id,
        actor: employeeHana._id,
        eventType: 'CREATED',
        details: { priority: 'High', category: 'Hardware' },
        message: 'Ticket TD-1002 created by Hana Bekele',
        createdAt: fourHoursAgo,
      },
      {
        ticket: ticket2._id,
        organization: organization._id,
        actor: null,
        eventType: 'ASSIGNED',
        details: { assigneeId: techTadesse._id },
        message: 'Intelligently auto-assigned to Tadesse Gebre based on Hardware skill & workload',
        createdAt: new Date(fourHoursAgo.getTime() + 1000),
      },
      {
        ticket: ticket2._id,
        organization: organization._id,
        actor: techTadesse._id,
        eventType: 'STATUS_CHANGED',
        details: { from: 'Assigned', to: 'In Progress' },
        message: 'Status updated from Assigned to In Progress by Tadesse Gebre',
        createdAt: new Date(fourHoursAgo.getTime() + 15 * 60 * 1000),
      },
    ]);

    // 8. Notifications
    await Notification.create([
      {
        recipient: employeeHana._id,
        organization: organization._id,
        title: 'Ticket #TD-1006 has been resolved',
        message: 'VPN connection timeout was resolved by Tadesse Gebre.',
        type: 'STATUS_CHANGED',
        ticket: ticket6._id,
        isRead: false,
        createdAt: twoHoursAgo,
      },
      {
        recipient: employeeHana._id,
        organization: organization._id,
        title: 'You have been assigned to ticket #TD-1007',
        message: 'Work on ticket Database connection latency has commenced.',
        type: 'TICKET_ASSIGNED',
        ticket: ticket7._id,
        isRead: false,
        createdAt: fourHoursAgo,
      },
      {
        recipient: manager._id,
        organization: organization._id,
        title: 'SLA breach alert for ticket #TD-0998',
        message: 'Resolution deadline approached threshold for review.',
        type: 'SLA_BREACH',
        isRead: false,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
    ]);

    // 9. Audit Logs
    await AuditLog.create([
      {
        organization: organization._id,
        actor: admin._id,
        action: 'SYSTEM_INITIALIZED',
        resource: 'System',
        details: { status: 'Success' },
        ipAddress: '127.0.0.1',
      },
      {
        organization: organization._id,
        actor: manager._id,
        action: 'TEAM_ROSTER_UPDATED',
        resource: 'Team',
        resourceId: teamSupport._id,
        details: { team: 'Tier 1 Support' },
        ipAddress: '127.0.0.1',
      },
      {
        organization: organization._id,
        actor: employeeHana._id,
        action: 'TICKET_CREATED',
        resource: 'Ticket',
        resourceId: ticket2._id,
        details: { ticketNumber: 'TD-1002' },
        ipAddress: '127.0.0.1',
      },
    ]);

    logger.info('========================================================');
    logger.info('TechDesk database seeded successfully!');
    logger.info('Default Credentials (Password: Password123!):');
    logger.info('  Admin:       admin@techdesk.com');
    logger.info('  Manager:     manager@techdesk.com');
    logger.info('  Technician:  tadesse@techdesk.com');
    logger.info('  Technician:  selamawit@techdesk.com');
    logger.info('  Employee:    employee@techdesk.com');
    logger.info('========================================================');

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
