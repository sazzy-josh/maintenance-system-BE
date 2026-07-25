import { PrismaClient, RequestStatus, Priority, AssignmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper: subtract N days from now
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

// Helper: subtract N hours from a date
function hoursAfter(date: Date, h: number): Date {
  return new Date(date.getTime() + h * 60 * 60 * 1000)
}

async function main() {
  console.log('🌱 Seeding database...')

  // ──────────────────────────────────────────────────────────
  // 1. CLEANUP (FK-safe order)
  // ──────────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.statusUpdate.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.serviceRequest.deleteMany()
  await prisma.user.deleteMany()
  await prisma.requestCategory.deleteMany()
  await prisma.role.deleteMany()
  console.log('  ✓ Existing data cleared')

  // ──────────────────────────────────────────────────────────
  // 2. ROLES
  // ──────────────────────────────────────────────────────────
  const roleRequester = await prisma.role.create({
    data: { name: 'REQUESTER', description: 'Students and staff who submit maintenance requests' },
  })
  const roleOfficer = await prisma.role.create({
    data: { name: 'OFFICER', description: 'Maintenance officers who handle and resolve requests' },
  })
  const roleAdmin = await prisma.role.create({
    data: { name: 'ADMIN', description: 'Administrators who oversee the entire maintenance system' },
  })
  console.log('  ✓ Roles created')

  // ──────────────────────────────────────────────────────────
  // 3. PASSWORD HASHES
  // ──────────────────────────────────────────────────────────
  const SALT_ROUNDS = 10
  const adminHash     = await bcrypt.hash('Admin@123',   SALT_ROUNDS)
  const officerHash   = await bcrypt.hash('Officer@123', SALT_ROUNDS)
  const studentHash   = await bcrypt.hash('Student@123', SALT_ROUNDS)

  // ──────────────────────────────────────────────────────────
  // 4. ADMIN
  // ──────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      fullName:       'System Administrator',
      email:          'admin@miva.university',
      matricOrStaffId:'ADMIN-001',
      phone:          '+2348000000001',
      department:     'Facilities Management',
      passwordHash:   adminHash,
      roleId:         roleAdmin.id,
      specialization: null,
      isActive:       true,
      lastLoginAt:    daysAgo(1),
    },
  })
  console.log('  ✓ Admin created')

  // ──────────────────────────────────────────────────────────
  // 5. OFFICERS
  // ──────────────────────────────────────────────────────────
  const officerElectrical = await prisma.user.create({
    data: {
      fullName:       'Emeka Okafor',
      email:          'officer.electrical@miva.university',
      matricOrStaffId:'STAFF-E01',
      phone:          '+2348011111101',
      department:     'Facilities Management',
      passwordHash:   officerHash,
      roleId:         roleOfficer.id,
      specialization: 'ELECTRICAL',
      isActive:       true,
      lastLoginAt:    daysAgo(1),
    },
  })

  const officerPlumbing = await prisma.user.create({
    data: {
      fullName:       'Chukwudi Nwosu',
      email:          'officer.plumbing@miva.university',
      matricOrStaffId:'STAFF-P01',
      phone:          '+2348011111102',
      department:     'Facilities Management',
      passwordHash:   officerHash,
      roleId:         roleOfficer.id,
      specialization: 'PLUMBING',
      isActive:       true,
      lastLoginAt:    daysAgo(2),
    },
  })

  const officerIT = await prisma.user.create({
    data: {
      fullName:       'Ngozi Adeyemi',
      email:          'officer.it@miva.university',
      matricOrStaffId:'STAFF-I01',
      phone:          '+2348011111103',
      department:     'ICT Services',
      passwordHash:   officerHash,
      roleId:         roleOfficer.id,
      specialization: 'IT',
      isActive:       true,
      lastLoginAt:    daysAgo(1),
    },
  })

  const officerCarpentry = await prisma.user.create({
    data: {
      fullName:       'Taiwo Balogun',
      email:          'officer.carpentry@miva.university',
      matricOrStaffId:'STAFF-C01',
      phone:          '+2348011111104',
      department:     'Facilities Management',
      passwordHash:   officerHash,
      roleId:         roleOfficer.id,
      specialization: 'CARPENTRY',
      isActive:       true,
      lastLoginAt:    daysAgo(3),
    },
  })
  console.log('  ✓ Officers created')

  // ──────────────────────────────────────────────────────────
  // 6. REQUESTERS (students)
  // ──────────────────────────────────────────────────────────
  const students = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'Adaeze Okonkwo',
        email: 'student1@miva.university',
        matricOrStaffId: 'MVU/2023/0001',
        phone: '+2348022221001',
        department: 'Computer Science',
        passwordHash: studentHash,
        roleId: roleRequester.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Babatunde Fashola',
        email: 'student2@miva.university',
        matricOrStaffId: 'MVU/2023/0002',
        phone: '+2348022221002',
        department: 'Electrical Engineering',
        passwordHash: studentHash,
        roleId: roleRequester.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Chioma Eze',
        email: 'student3@miva.university',
        matricOrStaffId: 'MVU/2022/0003',
        phone: '+2348022221003',
        department: 'Business Administration',
        passwordHash: studentHash,
        roleId: roleRequester.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Damilola Akinwale',
        email: 'student4@miva.university',
        matricOrStaffId: 'MVU/2022/0004',
        phone: '+2348022221004',
        department: 'Civil Engineering',
        passwordHash: studentHash,
        roleId: roleRequester.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Fatima Aliyu',
        email: 'student5@miva.university',
        matricOrStaffId: 'MVU/2024/0005',
        phone: '+2348022221005',
        department: 'Medicine',
        passwordHash: studentHash,
        roleId: roleRequester.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Gbenga Olatunde',
        email: 'student6@miva.university',
        matricOrStaffId: 'MVU/2024/0006',
        phone: '+2348022221006',
        department: 'Law',
        passwordHash: studentHash,
        roleId: roleRequester.id,
        isActive: true,
      },
    }),
  ])
  console.log('  ✓ Requesters created')

  // ──────────────────────────────────────────────────────────
  // 7. CATEGORIES
  // ──────────────────────────────────────────────────────────
  const catElectrical = await prisma.requestCategory.create({
    data: { name: 'Electrical', description: 'Power outlets, lighting, electrical faults and installations', slaHours: 24 },
  })
  const catPlumbing = await prisma.requestCategory.create({
    data: { name: 'Plumbing', description: 'Pipe leaks, blocked drains, water supply issues and sanitary fixtures', slaHours: 24 },
  })
  const catCarpentry = await prisma.requestCategory.create({
    data: { name: 'Furniture/Carpentry', description: 'Broken furniture, door/window repairs, carpentry work', slaHours: 72 },
  })
  const catIT = await prisma.requestCategory.create({
    data: { name: 'Internet/Network', description: 'Wi-Fi access, LAN ports, network infrastructure and connectivity', slaHours: 12 },
  })
  const catClassroom = await prisma.requestCategory.create({
    data: { name: 'Classroom Equipment', description: 'Projectors, whiteboards, AV systems and classroom technology', slaHours: 48 },
  })
  const catHostel = await prisma.requestCategory.create({
    data: { name: 'Hostel Maintenance', description: 'General hostel upkeep including room fixtures, common areas and amenities', slaHours: 48 },
  })
  const catOther = await prisma.requestCategory.create({
    data: { name: 'Other', description: 'Miscellaneous maintenance issues not covered by other categories', slaHours: 96 },
  })
  console.log('  ✓ Categories created')

  // ──────────────────────────────────────────────────────────
  // 8. SERVICE REQUESTS + RELATED DATA
  // ──────────────────────────────────────────────────────────
  // Helper to assign an officer and log status updates
  async function assignRequest(
    requestId: string,
    officerId: string,
    assignedAt: Date,
    note: string,
  ) {
    await prisma.assignment.create({
      data: {
        requestId,
        officerId,
        assignedById: admin.id,
        status: AssignmentStatus.ACTIVE,
        note,
        assignedAt,
      },
    })
  }

  async function addStatusUpdate(
    requestId: string,
    fromStatus: RequestStatus | null,
    toStatus: RequestStatus,
    actorId: string,
    createdAt: Date,
    note?: string,
  ) {
    await prisma.statusUpdate.create({
      data: {
        requestId,
        fromStatus: fromStatus ?? undefined,
        toStatus,
        actorId,
        note,
        createdAt,
      },
    })
  }

  async function addComment(
    requestId: string,
    authorId: string,
    body: string,
    isInternal: boolean,
    createdAt: Date,
  ) {
    await prisma.comment.create({
      data: { requestId, authorId, body, isInternal, createdAt },
    })
  }

  async function addAuditLog(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    createdAt: Date,
    metadata?: object,
  ) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata ?? {},
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
        userAgent: 'Mozilla/5.0 (MIVA University Portal)',
        createdAt,
      },
    })
  }

  // ── Request definitions ──────────────────────────────────
  interface RequestDef {
    ref: string
    title: string
    description: string
    location: string
    roomNumber?: string
    categoryId: string
    requesterId: string
    status: RequestStatus
    priority: Priority
    daysAgoCreated: number
    officerId?: string
    resolvedHoursAfterCreation?: number
    closedHoursAfterResolution?: number
  }

  const s = students
  const requests: RequestDef[] = [
    // ── SUBMITTED (7 requests) ─────────────────────────────
    {
      ref: 'REQ-2025-000001',
      title: 'Flickering lights in lecture hall',
      description: 'The fluorescent lights in LH-101 have been flickering intermittently for the past two days. It is very distracting during lectures and may indicate a wiring issue.',
      location: 'Block A',
      roomNumber: 'LH-101',
      categoryId: catElectrical.id,
      requesterId: s[0].id,
      status: RequestStatus.SUBMITTED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 2,
    },
    {
      ref: 'REQ-2025-000002',
      title: 'Blocked toilet in male restroom',
      description: 'The third toilet cubicle in the male restroom on the ground floor is completely blocked and overflowing. Urgent attention needed to prevent health hazard.',
      location: 'Block B',
      roomNumber: 'GF-MREST',
      categoryId: catPlumbing.id,
      requesterId: s[1].id,
      status: RequestStatus.SUBMITTED,
      priority: Priority.HIGH,
      daysAgoCreated: 1,
    },
    {
      ref: 'REQ-2025-000003',
      title: 'Broken lecture chairs in seminar room',
      description: 'Five chairs in SR-204 have broken backrests or legs making them unsafe to sit on. Students have been standing or using the floor.',
      location: 'Engineering Building',
      roomNumber: 'SR-204',
      categoryId: catCarpentry.id,
      requesterId: s[2].id,
      status: RequestStatus.SUBMITTED,
      priority: Priority.LOW,
      daysAgoCreated: 3,
    },
    {
      ref: 'REQ-2025-000004',
      title: 'Wi-Fi dead zone in library reading room',
      description: 'There is no Wi-Fi coverage in the eastern wing of the first-floor reading room. Students cannot access online resources for research.',
      location: 'Library',
      roomNumber: 'RR-1E',
      categoryId: catIT.id,
      requesterId: s[3].id,
      status: RequestStatus.SUBMITTED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 2,
    },
    {
      ref: 'REQ-2025-000005',
      title: 'Projector not working in classroom',
      description: 'The projector in CL-305 fails to power on. The power indicator light is red. Lectures that require presentation slides cannot proceed normally.',
      location: 'Block A',
      roomNumber: 'CL-305',
      categoryId: catClassroom.id,
      requesterId: s[4].id,
      status: RequestStatus.SUBMITTED,
      priority: Priority.HIGH,
      daysAgoCreated: 1,
    },
    {
      ref: 'REQ-2025-000006',
      title: 'Water leaking from ceiling in hostel room',
      description: 'Room 214 in Hostel Block 1 has water dripping from the ceiling, especially after rain. The leak has damaged personal belongings and the floor is slippery.',
      location: 'Hostel Block 1',
      roomNumber: '214',
      categoryId: catHostel.id,
      requesterId: s[5].id,
      status: RequestStatus.SUBMITTED,
      priority: Priority.CRITICAL,
      daysAgoCreated: 1,
    },
    {
      ref: 'REQ-2025-000007',
      title: 'Main entrance door hinge broken',
      description: 'The hinge on the main entrance door to the Admin Block is broken. The door does not close properly and bangs in the wind, creating noise and security concerns.',
      location: 'Admin Block',
      roomNumber: 'Main Entrance',
      categoryId: catCarpentry.id,
      requesterId: s[0].id,
      status: RequestStatus.SUBMITTED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 4,
    },

    // ── ASSIGNED (6 requests) ──────────────────────────────
    {
      ref: 'REQ-2025-000008',
      title: 'Power outage in computer lab',
      description: 'The computer lab on the second floor of the Engineering Building has had no power since yesterday morning. All desktop computers are down affecting scheduled practical sessions.',
      location: 'Engineering Building',
      roomNumber: 'LAB-201',
      categoryId: catElectrical.id,
      requesterId: s[1].id,
      status: RequestStatus.ASSIGNED,
      priority: Priority.CRITICAL,
      daysAgoCreated: 5,
      officerId: officerElectrical.id,
    },
    {
      ref: 'REQ-2025-000009',
      title: 'Burst pipe in ladies bathroom',
      description: 'A pipe has burst in the ladies bathroom on the second floor of Block B causing flooding in the corridor. Water is spreading to the adjacent offices.',
      location: 'Block B',
      roomNumber: 'FF-LREST',
      categoryId: catPlumbing.id,
      requesterId: s[2].id,
      status: RequestStatus.ASSIGNED,
      priority: Priority.CRITICAL,
      daysAgoCreated: 3,
      officerId: officerPlumbing.id,
    },
    {
      ref: 'REQ-2025-000010',
      title: 'Network switch down in Science Lab',
      description: 'The network switch serving the Science Lab is offline. None of the lab computers can access the internet or internal resources. A practical examination is scheduled for tomorrow.',
      location: 'Science Lab',
      roomNumber: 'SL-102',
      categoryId: catIT.id,
      requesterId: s[3].id,
      status: RequestStatus.ASSIGNED,
      priority: Priority.HIGH,
      daysAgoCreated: 4,
      officerId: officerIT.id,
    },
    {
      ref: 'REQ-2025-000011',
      title: 'Whiteboard surface scratched and unusable',
      description: 'The interactive whiteboard in room LH-202 has deep scratches making markers illegible. The surface needs replacement before next semester lectures begin.',
      location: 'Block A',
      roomNumber: 'LH-202',
      categoryId: catClassroom.id,
      requesterId: s[4].id,
      status: RequestStatus.ASSIGNED,
      priority: Priority.LOW,
      daysAgoCreated: 7,
      officerId: officerCarpentry.id,
    },
    {
      ref: 'REQ-2025-000012',
      title: 'Hostel common room ceiling fan not working',
      description: 'Both ceiling fans in the common room of Hostel Block 2 are not functioning. The room is extremely hot and students cannot rest comfortably.',
      location: 'Hostel Block 2',
      roomNumber: 'CR-GF',
      categoryId: catHostel.id,
      requesterId: s[5].id,
      status: RequestStatus.ASSIGNED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 6,
      officerId: officerElectrical.id,
    },
    {
      ref: 'REQ-2025-000013',
      title: 'Broken window pane in library',
      description: 'A window pane on the second floor of the library is cracked and partially missing following last week\'s storm. Security risk and rain enters when it rains.',
      location: 'Library',
      roomNumber: '2F-WEST',
      categoryId: catCarpentry.id,
      requesterId: s[0].id,
      status: RequestStatus.ASSIGNED,
      priority: Priority.HIGH,
      daysAgoCreated: 8,
      officerId: officerCarpentry.id,
    },

    // ── IN_PROGRESS (8 requests) ───────────────────────────
    {
      ref: 'REQ-2025-000014',
      title: 'Faulty electrical sockets in hostel rooms',
      description: 'Rooms 310-315 in Hostel Block 1 have sockets that spark when plugging in devices. Several students reported minor shocks. Immediate safety intervention required.',
      location: 'Hostel Block 1',
      roomNumber: '310-315',
      categoryId: catElectrical.id,
      requesterId: s[1].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      daysAgoCreated: 10,
      officerId: officerElectrical.id,
    },
    {
      ref: 'REQ-2025-000015',
      title: 'Drain blockage in hostel bathrooms',
      description: 'The shower drains in Hostel Block 2 (Rooms 101-108) are blocked causing water pooling on the bathroom floor. The situation is becoming a hygiene concern.',
      location: 'Hostel Block 2',
      roomNumber: '101-108',
      categoryId: catPlumbing.id,
      requesterId: s[2].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      daysAgoCreated: 12,
      officerId: officerPlumbing.id,
    },
    {
      ref: 'REQ-2025-000016',
      title: 'LAN ports not working in student lab',
      description: 'Eight LAN ports in SL-103 are showing no link when cables are connected. Students doing network practicals are unable to complete their assignments.',
      location: 'Science Lab',
      roomNumber: 'SL-103',
      categoryId: catIT.id,
      requesterId: s[3].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      daysAgoCreated: 9,
      officerId: officerIT.id,
    },
    {
      ref: 'REQ-2025-000017',
      title: 'AV system not producing sound in auditorium',
      description: 'The audio amplifier connected to the main PA system in the auditorium is producing no output. All microphones and speakers have been checked. The amp itself seems faulty.',
      location: 'Engineering Building',
      roomNumber: 'AUDITORIUM',
      categoryId: catClassroom.id,
      requesterId: s[4].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      daysAgoCreated: 15,
      officerId: officerElectrical.id,
    },
    {
      ref: 'REQ-2025-000018',
      title: 'Lecture theatre seats broken',
      description: 'Approximately 20 seats in LT-1 have broken flip mechanisms. The seats will not stay up causing students to sit awkwardly. Repairs are needed urgently before examinations.',
      location: 'Block A',
      roomNumber: 'LT-1',
      categoryId: catCarpentry.id,
      requesterId: s[5].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      daysAgoCreated: 14,
      officerId: officerCarpentry.id,
    },
    {
      ref: 'REQ-2025-000019',
      title: 'No hot water in hostel showers',
      description: 'The water heater serving Hostel Block 1 (floors 2 and 3) has stopped working. Residents have had no hot water for five days during the harmattan season.',
      location: 'Hostel Block 1',
      roomNumber: 'UTILITY-B1',
      categoryId: catPlumbing.id,
      requesterId: s[0].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      daysAgoCreated: 11,
      officerId: officerPlumbing.id,
    },
    {
      ref: 'REQ-2025-000020',
      title: 'Generator room door lock broken',
      description: 'The lock on the generator room in Block B is jammed and cannot be opened from the outside. This is a safety and security issue as maintenance personnel cannot access the generator.',
      location: 'Block B',
      roomNumber: 'GEN-ROOM',
      categoryId: catCarpentry.id,
      requesterId: s[1].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      daysAgoCreated: 13,
      officerId: officerCarpentry.id,
    },
    {
      ref: 'REQ-2025-000021',
      title: 'Ethernet cabling needed in new wing',
      description: 'The newly completed west wing of the Library has no data cabling. Twenty-four workstations are ready but cannot be connected to the network.',
      location: 'Library',
      roomNumber: 'WEST-WING',
      categoryId: catIT.id,
      requesterId: s[2].id,
      status: RequestStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      daysAgoCreated: 20,
      officerId: officerIT.id,
    },

    // ── ON_HOLD (4 requests) ───────────────────────────────
    {
      ref: 'REQ-2025-000022',
      title: 'Elevator not working in Engineering Building',
      description: 'The passenger elevator in the Engineering Building has been out of service for three days. Disabled students and staff with heavy equipment are seriously inconvenienced.',
      location: 'Engineering Building',
      roomNumber: 'ELEVATOR-1',
      categoryId: catElectrical.id,
      requesterId: s[3].id,
      status: RequestStatus.ON_HOLD,
      priority: Priority.HIGH,
      daysAgoCreated: 18,
      officerId: officerElectrical.id,
    },
    {
      ref: 'REQ-2025-000023',
      title: 'Sewer line replacement required',
      description: 'The main sewer line running under Hostel Block 2 is cracked and causing odour and seepage. Complete replacement of approximately 30 metres of piping is required.',
      location: 'Hostel Block 2',
      roomNumber: 'EXTERIOR',
      categoryId: catPlumbing.id,
      requesterId: s[4].id,
      status: RequestStatus.ON_HOLD,
      priority: Priority.CRITICAL,
      daysAgoCreated: 25,
      officerId: officerPlumbing.id,
    },
    {
      ref: 'REQ-2025-000024',
      title: 'CCTV cameras offline in car park',
      description: 'All six CCTV cameras covering the main car park have been offline since the power surge last week. The DVR unit appears to be damaged and needs replacement.',
      location: 'Admin Block',
      roomNumber: 'CAR-PARK',
      categoryId: catIT.id,
      requesterId: s[5].id,
      status: RequestStatus.ON_HOLD,
      priority: Priority.HIGH,
      daysAgoCreated: 22,
      officerId: officerIT.id,
    },
    {
      ref: 'REQ-2025-000025',
      title: 'Stage floor boards warped in auditorium',
      description: 'Several floor boards on the auditorium stage have warped and lifted creating a tripping hazard. The stage cannot be used for convocation rehearsals until repaired.',
      location: 'Engineering Building',
      roomNumber: 'AUDITORIUM-STAGE',
      categoryId: catCarpentry.id,
      requesterId: s[0].id,
      status: RequestStatus.ON_HOLD,
      priority: Priority.HIGH,
      daysAgoCreated: 30,
      officerId: officerCarpentry.id,
    },

    // ── COMPLETED (10 requests) ────────────────────────────
    {
      ref: 'REQ-2025-000026',
      title: 'Replace burnt-out light bulbs in corridor',
      description: 'Seven light bulbs in the third-floor corridor of Block A are burnt out making the area very dark and unsafe at night.',
      location: 'Block A',
      roomNumber: 'CORRIDOR-3F',
      categoryId: catElectrical.id,
      requesterId: s[1].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.LOW,
      daysAgoCreated: 30,
      officerId: officerElectrical.id,
      resolvedHoursAfterCreation: 18,
    },
    {
      ref: 'REQ-2025-000027',
      title: 'Leaking tap in staff kitchen',
      description: 'The kitchen tap in the staff room on the second floor of the Admin Block drips constantly. It has been running for over a week wasting significant water.',
      location: 'Admin Block',
      roomNumber: 'KITCHEN-2F',
      categoryId: catPlumbing.id,
      requesterId: s[2].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.LOW,
      daysAgoCreated: 35,
      officerId: officerPlumbing.id,
      resolvedHoursAfterCreation: 20,
    },
    {
      ref: 'REQ-2025-000028',
      title: 'Projector bulb replacement in library study room',
      description: 'The projector bulb in the library group study room has blown. The room is frequently used for group presentations and self-study.',
      location: 'Library',
      roomNumber: 'GSR-1',
      categoryId: catClassroom.id,
      requesterId: s[3].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 28,
      officerId: officerElectrical.id,
      resolvedHoursAfterCreation: 36,
    },
    {
      ref: 'REQ-2025-000029',
      title: 'Broken door handle in computer lab',
      description: 'The door handle on the inside of the computer lab CL-101 is broken. Students can get in but cannot open the door from inside without force, creating a safety concern.',
      location: 'Block B',
      roomNumber: 'CL-101',
      categoryId: catCarpentry.id,
      requesterId: s[4].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 40,
      officerId: officerCarpentry.id,
      resolvedHoursAfterCreation: 24,
    },
    {
      ref: 'REQ-2025-000030',
      title: 'Wi-Fi password reset for student portal',
      description: 'The Wi-Fi access point in Block A serving the student portal terminals appears to have been reset and students cannot connect. The SSID is broadcasting but authentication fails.',
      location: 'Block A',
      roomNumber: 'PORTAL-LAB',
      categoryId: catIT.id,
      requesterId: s[5].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.HIGH,
      daysAgoCreated: 45,
      officerId: officerIT.id,
      resolvedHoursAfterCreation: 6,
    },
    {
      ref: 'REQ-2025-000031',
      title: 'Socket trip causing power cut in Block B office',
      description: 'An overloaded socket caused the main circuit breaker for the fourth-floor offices in Block B to trip. Staff cannot work as computers and printers are down.',
      location: 'Block B',
      roomNumber: 'OFFICE-4F',
      categoryId: catElectrical.id,
      requesterId: s[0].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.HIGH,
      daysAgoCreated: 38,
      officerId: officerElectrical.id,
      resolvedHoursAfterCreation: 4,
    },
    {
      ref: 'REQ-2025-000032',
      title: 'Toilet seat broken in hostel block 2',
      description: 'The toilet seat in room 108 of Hostel Block 2 is cracked and has a sharp edge posing injury risk to residents.',
      location: 'Hostel Block 2',
      roomNumber: '108',
      categoryId: catHostel.id,
      requesterId: s[1].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 42,
      officerId: officerPlumbing.id,
      resolvedHoursAfterCreation: 28,
    },
    {
      ref: 'REQ-2025-000033',
      title: 'Desk and chair missing from lecturer office',
      description: 'One of the lecturer offices on the third floor of Block A (Room 312) is missing a desk and two chairs. The incoming lecturer has nowhere to sit or work.',
      location: 'Block A',
      roomNumber: '312',
      categoryId: catCarpentry.id,
      requesterId: s[2].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 50,
      officerId: officerCarpentry.id,
      resolvedHoursAfterCreation: 60,
    },
    {
      ref: 'REQ-2025-000034',
      title: 'Air conditioner not cooling in server room',
      description: 'The dedicated AC unit in the ICT server room has stopped cooling. Server room temperature is climbing above 30°C which risks equipment damage.',
      location: 'Admin Block',
      roomNumber: 'SERVER-ROOM',
      categoryId: catElectrical.id,
      requesterId: s[3].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.CRITICAL,
      daysAgoCreated: 55,
      officerId: officerElectrical.id,
      resolvedHoursAfterCreation: 8,
    },
    {
      ref: 'REQ-2025-000035',
      title: 'Low water pressure in science lab sinks',
      description: 'The cold water supply to the sinks in SL-201 has very low pressure making it difficult to use for lab procedures requiring running water.',
      location: 'Science Lab',
      roomNumber: 'SL-201',
      categoryId: catPlumbing.id,
      requesterId: s[4].id,
      status: RequestStatus.COMPLETED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 60,
      officerId: officerPlumbing.id,
      resolvedHoursAfterCreation: 22,
    },

    // ── CLOSED (5 requests) ────────────────────────────────
    {
      ref: 'REQ-2025-000036',
      title: 'Faulty generator automatic transfer switch',
      description: 'The ATS for Generator 2 fails to switch the load during power outages requiring manual intervention each time. This causes 5-10 minutes of downtime during outages.',
      location: 'Admin Block',
      roomNumber: 'GEN-HOUSE',
      categoryId: catElectrical.id,
      requesterId: s[5].id,
      status: RequestStatus.CLOSED,
      priority: Priority.HIGH,
      daysAgoCreated: 65,
      officerId: officerElectrical.id,
      resolvedHoursAfterCreation: 48,
      closedHoursAfterResolution: 24,
    },
    {
      ref: 'REQ-2025-000037',
      title: 'Overhead water tank overflow valve faulty',
      description: 'The overhead tank serving Block A is overflowing through a faulty float valve. Water is running down the walls causing staining and potential structural damage.',
      location: 'Block A',
      roomNumber: 'ROOFTOP',
      categoryId: catPlumbing.id,
      requesterId: s[0].id,
      status: RequestStatus.CLOSED,
      priority: Priority.HIGH,
      daysAgoCreated: 70,
      officerId: officerPlumbing.id,
      resolvedHoursAfterCreation: 16,
      closedHoursAfterResolution: 24,
    },
    {
      ref: 'REQ-2025-000038',
      title: 'Library self-check-out kiosk offline',
      description: 'The two library self-check-out kiosks at the main entrance have been offline for a week. Students must queue at the manual counter increasing wait times significantly.',
      location: 'Library',
      roomNumber: 'ENTRANCE',
      categoryId: catIT.id,
      requesterId: s[1].id,
      status: RequestStatus.CLOSED,
      priority: Priority.MEDIUM,
      daysAgoCreated: 75,
      officerId: officerIT.id,
      resolvedHoursAfterCreation: 72,
      closedHoursAfterResolution: 48,
    },
    {
      ref: 'REQ-2025-000039',
      title: 'Roof leak in Block B seminar room',
      description: 'Heavy rain caused significant water ingress through the roof of SR-105 in Block B. The ceiling tiles have collapsed in one corner and there is water damage to stored equipment.',
      location: 'Block B',
      roomNumber: 'SR-105',
      categoryId: catOther.id,
      requesterId: s[2].id,
      status: RequestStatus.CLOSED,
      priority: Priority.CRITICAL,
      daysAgoCreated: 80,
      officerId: officerCarpentry.id,
      resolvedHoursAfterCreation: 96,
      closedHoursAfterResolution: 24,
    },
    {
      ref: 'REQ-2025-000040',
      title: 'Pest infestation in hostel block 1 storage',
      description: 'Rats have been spotted in the storage room of Hostel Block 1. Evidence of gnawed wiring and food packages found. Pest control and sealing of entry points required.',
      location: 'Hostel Block 1',
      roomNumber: 'STORE-GF',
      categoryId: catOther.id,
      requesterId: s[3].id,
      status: RequestStatus.CLOSED,
      priority: Priority.HIGH,
      daysAgoCreated: 85,
      officerId: officerCarpentry.id,
      resolvedHoursAfterCreation: 72,
      closedHoursAfterResolution: 48,
    },
  ]

  // ── Create each request with all related data ─────────────
  for (const def of requests) {
    const createdAt = daysAgo(def.daysAgoCreated)
    const dueAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000) // default 48h SLA

    let resolvedAt: Date | undefined
    let closedAt: Date | undefined
    if (def.resolvedHoursAfterCreation != null) {
      resolvedAt = hoursAfter(createdAt, def.resolvedHoursAfterCreation)
    }
    if (def.closedHoursAfterResolution != null && resolvedAt) {
      closedAt = hoursAfter(resolvedAt, def.closedHoursAfterResolution)
    }

    const sr = await prisma.serviceRequest.create({
      data: {
        referenceNo:  def.ref,
        title:        def.title,
        description:  def.description,
        location:     def.location,
        roomNumber:   def.roomNumber,
        categoryId:   def.categoryId,
        requesterId:  def.requesterId,
        status:       def.status,
        priority:     def.priority,
        dueAt,
        resolvedAt,
        closedAt,
        rating: def.status === RequestStatus.CLOSED ? Math.floor(Math.random() * 2) + 4 : undefined,
        feedback: def.status === RequestStatus.CLOSED
          ? 'The issue was resolved satisfactorily. Thank you for the prompt attention.'
          : undefined,
        createdAt,
        updatedAt: resolvedAt ?? closedAt ?? createdAt,
      },
    })

    // Audit log: request created
    await addAuditLog(def.requesterId, 'CREATE', 'ServiceRequest', sr.id, createdAt, {
      referenceNo: def.ref,
      title: def.title,
    })

    // ── Status history ─────────────────────────────────────
    const statusHistory: Array<{ from: RequestStatus | null; to: RequestStatus; hoursOffset: number; actorId: string; note?: string }> = []

    if (def.status === RequestStatus.SUBMITTED) {
      // No additional transitions — just the initial submission
    } else if (def.status === RequestStatus.ASSIGNED) {
      statusHistory.push({ from: null, to: RequestStatus.SUBMITTED, hoursOffset: 0, actorId: def.requesterId })
      statusHistory.push({ from: RequestStatus.SUBMITTED, to: RequestStatus.ASSIGNED, hoursOffset: 4, actorId: admin.id, note: 'Reviewed and assigned to maintenance officer.' })
    } else if (def.status === RequestStatus.IN_PROGRESS) {
      statusHistory.push({ from: null, to: RequestStatus.SUBMITTED, hoursOffset: 0, actorId: def.requesterId })
      statusHistory.push({ from: RequestStatus.SUBMITTED, to: RequestStatus.ASSIGNED, hoursOffset: 3, actorId: admin.id, note: 'Assigned to available officer.' })
      statusHistory.push({ from: RequestStatus.ASSIGNED, to: RequestStatus.IN_PROGRESS, hoursOffset: 6, actorId: def.officerId!, note: 'Work has started on site. Assessing the issue.' })
    } else if (def.status === RequestStatus.ON_HOLD) {
      statusHistory.push({ from: null, to: RequestStatus.SUBMITTED, hoursOffset: 0, actorId: def.requesterId })
      statusHistory.push({ from: RequestStatus.SUBMITTED, to: RequestStatus.ASSIGNED, hoursOffset: 5, actorId: admin.id, note: 'Assigned pending parts procurement.' })
      statusHistory.push({ from: RequestStatus.ASSIGNED, to: RequestStatus.IN_PROGRESS, hoursOffset: 10, actorId: def.officerId!, note: 'Initial assessment done. Parts need to be ordered.' })
      statusHistory.push({ from: RequestStatus.IN_PROGRESS, to: RequestStatus.ON_HOLD, hoursOffset: 24, actorId: def.officerId!, note: 'Placed on hold awaiting delivery of spare parts / external contractor.' })
    } else if (def.status === RequestStatus.COMPLETED) {
      statusHistory.push({ from: null, to: RequestStatus.SUBMITTED, hoursOffset: 0, actorId: def.requesterId })
      statusHistory.push({ from: RequestStatus.SUBMITTED, to: RequestStatus.ASSIGNED, hoursOffset: 2, actorId: admin.id, note: 'Assigned to officer.' })
      statusHistory.push({ from: RequestStatus.ASSIGNED, to: RequestStatus.IN_PROGRESS, hoursOffset: 4, actorId: def.officerId!, note: 'Officer has commenced work.' })
      statusHistory.push({ from: RequestStatus.IN_PROGRESS, to: RequestStatus.COMPLETED, hoursOffset: def.resolvedHoursAfterCreation!, actorId: def.officerId!, note: 'Work completed. Issue fully resolved.' })
    } else if (def.status === RequestStatus.CLOSED) {
      statusHistory.push({ from: null, to: RequestStatus.SUBMITTED, hoursOffset: 0, actorId: def.requesterId })
      statusHistory.push({ from: RequestStatus.SUBMITTED, to: RequestStatus.ASSIGNED, hoursOffset: 3, actorId: admin.id, note: 'Assigned to officer.' })
      statusHistory.push({ from: RequestStatus.ASSIGNED, to: RequestStatus.IN_PROGRESS, hoursOffset: 6, actorId: def.officerId!, note: 'Work commenced.' })
      statusHistory.push({ from: RequestStatus.IN_PROGRESS, to: RequestStatus.COMPLETED, hoursOffset: def.resolvedHoursAfterCreation!, actorId: def.officerId!, note: 'Repair completed successfully.' })
      statusHistory.push({
        from: RequestStatus.COMPLETED,
        to: RequestStatus.CLOSED,
        hoursOffset: def.resolvedHoursAfterCreation! + def.closedHoursAfterResolution!,
        actorId: admin.id,
        note: 'Requester confirmed resolution. Request closed.',
      })
    }

    for (const sh of statusHistory) {
      await addStatusUpdate(
        sr.id,
        sh.from,
        sh.to,
        sh.actorId,
        hoursAfter(createdAt, sh.hoursOffset),
        sh.note,
      )
    }

    // ── Assignment record ──────────────────────────────────
    if (def.officerId && def.status !== RequestStatus.SUBMITTED) {
      const assignedAt = hoursAfter(createdAt, 3)
      await assignRequest(sr.id, def.officerId, assignedAt, `Assigned based on specialization for ${def.location}.`)

      await addAuditLog(admin.id, 'ASSIGN', 'ServiceRequest', sr.id, assignedAt, {
        referenceNo: def.ref,
        officerId: def.officerId,
      })
    }

    // ── Comments ───────────────────────────────────────────
    if (
      def.status === RequestStatus.IN_PROGRESS ||
      def.status === RequestStatus.ON_HOLD ||
      def.status === RequestStatus.COMPLETED ||
      def.status === RequestStatus.CLOSED
    ) {
      await addComment(
        sr.id,
        def.requesterId,
        'Thank you for looking into this. Please let me know if you need any additional information.',
        false,
        hoursAfter(createdAt, 5),
      )
      await addComment(
        sr.id,
        def.officerId!,
        'I have visited the site and assessed the issue. Will proceed with repairs shortly.',
        false,
        hoursAfter(createdAt, 7),
      )
    }

    if (def.status === RequestStatus.ON_HOLD) {
      await addComment(
        sr.id,
        def.officerId!,
        'Awaiting procurement of necessary materials. Estimated lead time: 3-5 working days.',
        true,
        hoursAfter(createdAt, 30),
      )
    }

    if (def.status === RequestStatus.COMPLETED || def.status === RequestStatus.CLOSED) {
      await addComment(
        sr.id,
        def.officerId!,
        'Repairs have been completed. Please inspect and confirm the work is satisfactory.',
        false,
        hoursAfter(createdAt, def.resolvedHoursAfterCreation! - 1),
      )
    }

    if (def.status === RequestStatus.CLOSED) {
      await addComment(
        sr.id,
        def.requesterId,
        'Confirmed. The issue has been fully resolved. Very satisfied with the response time.',
        false,
        hoursAfter(createdAt, def.resolvedHoursAfterCreation! + (def.closedHoursAfterResolution! / 2)),
      )
      await addAuditLog(admin.id, 'CLOSE', 'ServiceRequest', sr.id, closedAt!, {
        referenceNo: def.ref,
        rating: 4,
      })
    }

    if (def.status === RequestStatus.COMPLETED) {
      await addAuditLog(def.officerId!, 'COMPLETE', 'ServiceRequest', sr.id, resolvedAt!, {
        referenceNo: def.ref,
      })
    }
  }

  console.log(`  ✓ ${requests.length} service requests created with assignments, status updates, comments, and audit logs`)

  // ──────────────────────────────────────────────────────────
  // 9. NOTIFICATIONS
  // ──────────────────────────────────────────────────────────
  const notificationData = [
    // Admin notifications
    {
      userId: admin.id,
      title: 'New Critical Request Submitted',
      body: 'REQ-2025-000006: Water leaking from ceiling in Hostel Block 1 has been submitted with CRITICAL priority.',
      link: '/admin/requests/REQ-2025-000006',
      isRead: false,
      createdAt: daysAgo(1),
    },
    {
      userId: admin.id,
      title: 'New Critical Request Submitted',
      body: 'REQ-2025-000002: Blocked toilet in male restroom requires immediate attention.',
      link: '/admin/requests/REQ-2025-000002',
      isRead: true,
      createdAt: daysAgo(1),
    },
    {
      userId: admin.id,
      title: 'Request Completed',
      body: 'REQ-2025-000034: Air conditioner in server room has been repaired by officer.',
      link: '/admin/requests/REQ-2025-000034',
      isRead: true,
      createdAt: daysAgo(50),
    },
    // Officer notifications
    {
      userId: officerElectrical.id,
      title: 'New Request Assigned',
      body: 'REQ-2025-000008: Power outage in computer lab has been assigned to you. Please attend urgently.',
      link: '/officer/requests/REQ-2025-000008',
      isRead: false,
      createdAt: daysAgo(5),
    },
    {
      userId: officerElectrical.id,
      title: 'New Request Assigned',
      body: 'REQ-2025-000012: Hostel common room ceiling fans need attention.',
      link: '/officer/requests/REQ-2025-000012',
      isRead: true,
      createdAt: daysAgo(6),
    },
    {
      userId: officerPlumbing.id,
      title: 'New Request Assigned',
      body: 'REQ-2025-000009: Burst pipe in ladies bathroom — urgent response needed.',
      link: '/officer/requests/REQ-2025-000009',
      isRead: false,
      createdAt: daysAgo(3),
    },
    {
      userId: officerIT.id,
      title: 'New Request Assigned',
      body: 'REQ-2025-000010: Network switch down in Science Lab. Examination scheduled for tomorrow.',
      link: '/officer/requests/REQ-2025-000010',
      isRead: false,
      createdAt: daysAgo(4),
    },
    {
      userId: officerCarpentry.id,
      title: 'New Request Assigned',
      body: 'REQ-2025-000013: Broken window pane in library requires repair.',
      link: '/officer/requests/REQ-2025-000013',
      isRead: true,
      createdAt: daysAgo(8),
    },
    // Requester notifications
    {
      userId: s[0].id,
      title: 'Your Request Has Been Assigned',
      body: 'REQ-2025-000026: Lights in Block A corridor have been assigned to a maintenance officer.',
      link: '/requests/REQ-2025-000026',
      isRead: true,
      createdAt: daysAgo(29),
    },
    {
      userId: s[0].id,
      title: 'Your Request Has Been Completed',
      body: 'REQ-2025-000026: Replacement of burnt-out light bulbs has been completed. Please confirm.',
      link: '/requests/REQ-2025-000026',
      isRead: true,
      createdAt: daysAgo(29),
    },
    {
      userId: s[1].id,
      title: 'Request Submitted Successfully',
      body: 'REQ-2025-000002: Your request regarding blocked toilet has been received and will be reviewed.',
      link: '/requests/REQ-2025-000002',
      isRead: true,
      createdAt: daysAgo(1),
    },
    {
      userId: s[3].id,
      title: 'Your Request Is Now In Progress',
      body: 'REQ-2025-000016: LAN port issues in SL-103 are being actively worked on.',
      link: '/requests/REQ-2025-000016',
      isRead: false,
      createdAt: daysAgo(8),
    },
    {
      userId: s[4].id,
      title: 'Your Request Has Been Closed',
      body: 'REQ-2025-000023: Sewer line issue has been placed on hold pending contractor availability.',
      link: '/requests/REQ-2025-000023',
      isRead: false,
      createdAt: daysAgo(20),
    },
    {
      userId: s[5].id,
      title: 'Your Request Has Been Assigned',
      body: 'REQ-2025-000024: CCTV camera restoration has been assigned to IT officer.',
      link: '/requests/REQ-2025-000024',
      isRead: true,
      createdAt: daysAgo(21),
    },
  ]

  await prisma.notification.createMany({ data: notificationData })
  console.log(`  ✓ ${notificationData.length} notifications created`)

  // ──────────────────────────────────────────────────────────
  // 10. ADDITIONAL SYSTEM AUDIT LOGS
  // ──────────────────────────────────────────────────────────
  const systemAuditLogs = [
    { actorId: admin.id, action: 'LOGIN', entityType: 'User', entityId: admin.id, createdAt: daysAgo(1), metadata: { email: admin.email } },
    { actorId: admin.id, action: 'LOGIN', entityType: 'User', entityId: admin.id, createdAt: daysAgo(2), metadata: { email: admin.email } },
    { actorId: officerElectrical.id, action: 'LOGIN', entityType: 'User', entityId: officerElectrical.id, createdAt: daysAgo(1), metadata: { email: officerElectrical.email } },
    { actorId: officerPlumbing.id, action: 'LOGIN', entityType: 'User', entityId: officerPlumbing.id, createdAt: daysAgo(2), metadata: { email: officerPlumbing.email } },
    { actorId: officerIT.id, action: 'LOGIN', entityType: 'User', entityId: officerIT.id, createdAt: daysAgo(1), metadata: { email: officerIT.email } },
    { actorId: officerCarpentry.id, action: 'LOGIN', entityType: 'User', entityId: officerCarpentry.id, createdAt: daysAgo(3), metadata: { email: officerCarpentry.email } },
    { actorId: s[0].id, action: 'LOGIN', entityType: 'User', entityId: s[0].id, createdAt: daysAgo(2), metadata: { email: s[0].email } },
    { actorId: s[1].id, action: 'LOGIN', entityType: 'User', entityId: s[1].id, createdAt: daysAgo(1), metadata: { email: s[1].email } },
    { actorId: admin.id, action: 'UPDATE_PRIORITY', entityType: 'ServiceRequest', entityId: 'REQ-2025-000006', createdAt: daysAgo(1), metadata: { from: 'HIGH', to: 'CRITICAL', reason: 'Ceiling leak causing property damage' } },
    { actorId: admin.id, action: 'CATEGORY_CREATED', entityType: 'RequestCategory', entityId: catElectrical.id, createdAt: daysAgo(90), metadata: { name: 'Electrical', slaHours: 24 } },
    { actorId: admin.id, action: 'CATEGORY_CREATED', entityType: 'RequestCategory', entityId: catPlumbing.id, createdAt: daysAgo(90), metadata: { name: 'Plumbing', slaHours: 24 } },
    { actorId: admin.id, action: 'USER_CREATED', entityType: 'User', entityId: officerElectrical.id, createdAt: daysAgo(90), metadata: { email: officerElectrical.email, role: 'OFFICER' } },
    { actorId: admin.id, action: 'USER_CREATED', entityType: 'User', entityId: officerPlumbing.id, createdAt: daysAgo(90), metadata: { email: officerPlumbing.email, role: 'OFFICER' } },
    { actorId: admin.id, action: 'USER_CREATED', entityType: 'User', entityId: officerIT.id, createdAt: daysAgo(90), metadata: { email: officerIT.email, role: 'OFFICER' } },
    { actorId: admin.id, action: 'USER_CREATED', entityType: 'User', entityId: officerCarpentry.id, createdAt: daysAgo(90), metadata: { email: officerCarpentry.email, role: 'OFFICER' } },
  ]

  for (const log of systemAuditLogs) {
    await prisma.auditLog.create({ data: log })
  }
  console.log(`  ✓ ${systemAuditLogs.length} additional audit log entries created`)

  console.log('\n🎉 Seeding complete!')
  console.log('  Roles:            3')
  console.log('  Users:            11 (1 admin, 4 officers, 6 students)')
  console.log('  Categories:       7')
  console.log(`  Service Requests: ${requests.length}`)
  console.log('  Notifications:    ' + notificationData.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
