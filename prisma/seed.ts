import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {},
  });
  if (error && !error.message.includes("already exists")) {
    throw new Error(`Failed to create auth user ${email}: ${error.message}`);
  }
  return data?.user;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // School
  const school = await prisma.school.upsert({
    where: { id: "demo-school" },
    update: { name: "Lourdes University" },
    create: { id: "demo-school", name: "Lourdes University", requireApproval: false },
  });
  console.log("  ✓ School:", school.name);

  // Fields of Study
  const fields = [
    { name: "Computer Science", description: "Software, AI, and systems" },
    { name: "Engineering", description: "Civil, mechanical, electrical" },
    { name: "Business Administration", description: "Management, finance, marketing" },
    { name: "Medicine", description: "Pre-med, nursing, pharmacy" },
  ];
  const createdFields = [];
  for (const f of fields) {
    const field = await prisma.fieldOfStudy.upsert({
      where: { schoolId_name: { schoolId: school.id, name: f.name } },
      update: {},
      create: { ...f, schoolId: school.id },
    });
    createdFields.push(field);
  }
  console.log("  ✓ Fields:", createdFields.map(f => f.name).join(", "));

  // Levels
  const levels = [
    { name: "Level 100", order: 1 },
    { name: "Level 200", order: 2 },
    { name: "Level 300", order: 3 },
    { name: "Level 400", order: 4 },
  ];
  const createdLevels = [];
  for (const l of levels) {
    const level = await prisma.level.upsert({
      where: { schoolId_name: { schoolId: school.id, name: l.name } },
      update: {},
      create: { ...l, schoolId: school.id },
    });
    createdLevels.push(level);
  }
  console.log("  ✓ Levels:", createdLevels.map(l => l.name).join(", "));

  // Admin account
  const adminEmail = "admin@lourdes.edu";
  await createAuthUser(adminEmail, "Admin123!");
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Dr. Sarah Admin",
      username: "sarah.admin",
      studentId: "ADMIN001",
      schoolId: school.id,
      fieldOfStudyId: createdFields[0].id,
      levelId: createdLevels[3].id,
      role: "ADMIN",
      approvalStatus: "APPROVED",
      bio: "University administrator. Here to help!",
      hometown: "Campus Town",
    },
  });
  console.log("  ✓ Admin:", adminUser.name, `(${adminEmail} / Admin123!)`);

  // Student admin
  const studentAdminEmail = "john.classrep@lourdes.edu";
  await createAuthUser(studentAdminEmail, "Demo123!");
  const studentAdmin = await prisma.user.upsert({
    where: { email: studentAdminEmail },
    update: {},
    create: {
      email: studentAdminEmail,
      name: "John Classrep",
      username: "john.classrep",
      studentId: "STU2023001",
      schoolId: school.id,
      fieldOfStudyId: createdFields[0].id,
      levelId: createdLevels[2].id,
      role: "USER",
      isStudentAdmin: true,
      approvalStatus: "APPROVED",
      bio: "Computer Science major. Class rep for CS 300.",
      hometown: "Tech Valley",
    },
  });
  console.log("  ✓ Student Admin:", studentAdmin.name, `(${studentAdminEmail} / Demo123!)`);

  // Regular students
  const students = [
    { name: "Alice Wonder", username: "alice.wonder", studentId: "STU2023101", bio: "Engineering student. Love building things!", hometown: "Springfield", field: 1, level: 1 },
    { name: "Bob Builder", username: "bob.builder", studentId: "STU2023102", bio: "Future entrepreneur. Dorm-room startup mode 🚀", hometown: "Business City", field: 2, level: 2 },
    { name: "Charlie Chen", username: "charlie.chen", studentId: "STU2023103", bio: "Med student. Coffee is my copilot.", hometown: "Medtown", field: 3, level: 3 },
    { name: "Diana Prince", username: "diana.prince", studentId: "STU2023104", bio: "CS major. Building the future, one commit at a time.", hometown: "Codeville", field: 0, level: 1 },
    { name: "Eve Specter", username: "eve.specter", studentId: "STU2023105", bio: "Business & design. Ask me about UX!", hometown: "Creativa", field: 2, level: 4 },
  ];

  const createdStudents: any[] = [];
  for (const s of students) {
    const email = `${s.username}@lourdes.edu`.toLowerCase();
    await createAuthUser(email, "Demo123!");
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email, name: s.name, username: s.username, studentId: s.studentId,
        schoolId: school.id, fieldOfStudyId: createdFields[s.field].id,
        levelId: createdLevels[s.level].id,
        role: "USER", approvalStatus: "APPROVED",
        bio: s.bio, hometown: s.hometown,
      },
    });
    createdStudents.push(user);
  }
  console.log(`  ✓ ${createdStudents.length} students created`);

  const allUsers = [adminUser, studentAdmin, ...createdStudents];

  // Announcements
  const announcements = [
    { title: "Welcome to the New Semester!", content: "We're thrilled to welcome all students to the 2025/2026 academic year. Check out the new campus map and updated event calendar.", priority: "NORMAL" },
    { title: "Library Extended Hours", content: "The campus library will now be open until midnight during exam period. Free coffee in the study lounge!", priority: "NORMAL" },
    { title: "Campus Maintenance Notice", content: "Building B will be closed this weekend for renovations. Please use the alternative entrance near the parking lot.", priority: "URGENT" },
    { title: "Tech Week 2026", content: "Tech Week is coming! Workshops on AI, Web3, and cybersecurity. Sign up now — spots are limited!", priority: "NORMAL" },
    { title: "Emergency: Weather Alert", content: "Due to the forecasted storm, all in-person classes are cancelled tomorrow. Online classes will continue as scheduled.", priority: "EMERGENCY" },
  ];
  for (const a of announcements) {
    await prisma.announcement.create({
      data: { ...a, status: "PUBLISHED", publishedAt: new Date() },
    });
  }
  console.log(`  ✓ ${announcements.length} announcements`);

  // Posts with comments and likes
  const postContents = [
    { content: "Just finished my AI project! Built a sentiment analysis model that can detect student stress levels from forum posts. Accuracy is at 92%. Anyone interested in collaborating on a campus wellness app? 🤖 #AI #CampusTech #MachineLearning" },
    { content: "Selling my barely-used calculus textbooks. All 4 volumes for $40. DM me if interested! 📚 #TextbooksForSale #Engineering" },
    { content: "Anyone else having trouble with the campus WiFi in the library? It keeps dropping every 10 minutes. Already submitted a ticket but thought I'd check if it's just me. #TechSupport #WiFiIssues" },
    { content: "The hackathon this weekend was AMAZING! Our team built a campus sustainability tracker that gamifies recycling. We won second place! 🏆 #Hackathon #Sustainability #ProudMoment" },
    { content: "Looking for study partners for the upcoming CS 301 midterm. Studying at the library cafe every evening this week. Bring your notes and coffee! ☕ #StudyGroup #CSMajor" },
    { content: "Lost my water bottle in the science building — it's a grey HydroFlask with a 'Stay Hydrated' sticker. If you've seen it, please let me know! #LostAndFound" },
    { content: "Just launched my first mobile app in the app store! It's a campus event finder that aggregates all student org events in one place. Would love your feedback! 🚀 #AppDev #StudentStartup" },
    { content: "Does anyone know when the semester project proposals are due for the Engineering capstone? I heard different dates from different people. #Confused #Engineering" },
    { content: "The cafeteria has a new plant-based menu and it's actually really good! The jackfruit tacos are 🔥. Definitely worth trying even if you're not vegetarian. #CampusFood #PlantBased" },
    { content: "Important reminder: Don't forget to register your courses for next semester by Friday! The portal tends to crash on the last day so do it early. #AcademicAdvice #Registration" },
  ];

  for (let i = 0; i < postContents.length; i++) {
    const author = allUsers[i % allUsers.length];
    const post = await prisma.post.create({
      data: {
        content: postContents[i].content,
        authorId: author.id,
        schoolId: school.id,
        createdAt: new Date(Date.now() - (postContents.length - i) * 3600000),
      },
    });

    // Add 2-4 comments per post
    const commentCount = 2 + Math.floor(Math.random() * 3);
    const commenters = allUsers.filter(u => u.id !== author.id);
    for (let c = 0; c < commentCount; c++) {
      const commenter = commenters[c % commenters.length];
      const comments = [
        "Totally agree! 🙌", "Great point! Thanks for sharing.",
        "This is so helpful, thanks!", "I've been thinking the same thing!",
        "Can you share more details?", "How long did this take you?",
        "Count me in! 🙋", "Thanks for the heads up!",
        "This is exactly what I needed to see today.", "No way, same here! 😄",
      ];
      await prisma.comment.create({
        data: {
          content: comments[(i + c) % comments.length],
          authorId: commenter.id,
          postId: post.id,
          createdAt: new Date(Date.now() - (postContents.length - i) * 3600000 + c * 60000),
        },
      });
    }

    // Add likes (random subset of users)
    const likers = allUsers.filter(() => Math.random() > 0.4);
    for (const liker of likers) {
      if (liker.id !== author.id) {
        await prisma.like.upsert({
          where: { userId_postId: { userId: liker.id, postId: post.id } },
          update: {},
          create: { userId: liker.id, postId: post.id },
        });
      }
    }
  }
  console.log(`  ✓ ${postContents.length} posts with comments and likes`);

  // Events
  const events = [
    { title: "Tech Week Kickoff", description: "Opening ceremony for Tech Week 2026. Keynote by alumni now at Google.", date: new Date(Date.now() + 3 * 86400000), location: "Main Auditorium", category: "ACADEMIC" },
    { title: "Career Fair", description: "Meet recruiters from top tech companies. Bring your resume!", date: new Date(Date.now() + 7 * 86400000), location: "Student Center", category: "CAREER" },
    { title: "Football: Campus Cup Finals", description: "Our team vs. rival university. Show your spirit!", date: new Date(Date.now() + 14 * 86400000), location: "Sports Complex", category: "SPORTS" },
    { title: "Photography Workshop", description: "Learn mobile photography basics from professional photographer.", date: new Date(Date.now() + 1 * 86400000), location: "Art Building, Room 205", category: "ARTS" },
    { title: "Music Night: Battle of the Bands", description: "Student bands compete for the grand prize. Free entry!", date: new Date(Date.now() + 5 * 86400000), location: "Amphitheater", category: "SOCIAL" },
  ];
  for (const evt of events) {
    await prisma.event.create({
      data: {
        ...evt,
        organizerId: adminUser.id,
        schoolId: school.id,
        status: "APPROVED",
        maxAttendees: 200,
      },
    });
  }
  console.log(`  ✓ ${events.length} events`);

  // Marketplace listings
  const listings = [
    { title: "Calculus Textbook (Vol 1-4)", description: "Like new condition. Highlighted a few pages.", price: 40, seller: createdStudents[0] },
    { title: "Scientific Calculator TI-84", description: "Perfect for engineering exams. Battery lasts weeks.", price: 35, seller: createdStudents[1] },
    { title: "Dorm Mini-Fridge", description: "Moving out, must sell. Works perfectly, 2 years old.", price: 60, seller: createdStudents[2] },
    { title: "Graphic Tablet (Wacom)", description: "Barely used. Great for digital art and note-taking.", price: 120, seller: createdStudents[3] },
    { title: "Bicycle — Campus Cruiser", description: "Perfect for getting to class on time. New tires.", price: 80, seller: createdStudents[4] },
  ];
  for (const listing of listings) {
    await prisma.marketplaceListing.create({
      data: {
        title: listing.title, description: listing.description,
        price: listing.price, sellerId: listing.seller.id,
        status: "ACTIVE",
      },
    });
  }
  console.log(`  ✓ ${listings.length} marketplace listings`);

  // Direct messages
  const messagePairs = [
    [createdStudents[0], createdStudents[1]],
    [createdStudents[0], createdStudents[2]],
    [createdStudents[1], createdStudents[3]],
  ];
  for (const [sender, recipient] of messagePairs) {
    const msgs = [
      "Hey, did you get the assignment details?",
      "Yes! Check the course page — it's under Week 5.",
      "Thanks! Want to study together later?",
      "Sure! Meet at the library at 3pm?",
      "Perfect. See you there!",
    ];
    for (let i = 0; i < msgs.length; i++) {
      const actualSender = i % 2 === 0 ? sender : recipient;
      const actualRecipient = i % 2 === 0 ? recipient : sender;
      await prisma.message.create({
        data: {
          content: msgs[i],
          senderId: actualSender.id,
          recipientId: actualRecipient.id,
          isRead: true,
          createdAt: new Date(Date.now() - (msgs.length - i) * 300000),
        },
      });
    }
  }
  // One message from admin as unread (so the demo shows unread indicators)
  await prisma.message.create({
    data: {
      content: "Welcome to Dash! Check out the events page for upcoming campus activities.",
      senderId: adminUser.id,
      recipientId: createdStudents[0].id,
      isRead: false,
      createdAt: new Date(Date.now() - 60000),
    },
  });
  console.log("  ✓ Messages with unread demo message");

  // Notifications
  const notificationTypes = ["like", "comment", "follow", "system_alert", "announcement"];
  for (const user of allUsers) {
    const notifCount = 2 + Math.floor(Math.random() * 3);
    for (let n = 0; n < notifCount; n++) {
      const type = notificationTypes[n % notificationTypes.length];
      const titles: Record<string, string> = {
        like: "Someone liked your post",
        comment: "New comment on your post",
        follow: "A new user started following you",
        system_alert: "System maintenance tonight at 2 AM",
        announcement: type === "announcement" ? announcements[n % announcements.length].title : "New campus announcement",
      };
      await prisma.notification.create({
        data: {
          userId: user.id,
          type,
          title: titles[type] || "New notification",
          message: "Tap to view details.",
          isRead: n > 0,
          createdAt: new Date(Date.now() - n * 3600000),
        },
      });
    }
  }
  console.log("  ✓ Notifications");

  // Stories (expire in 24h)
  for (let i = 0; i < Math.min(createdStudents.length, 3); i++) {
    await prisma.story.create({
      data: {
        authorId: createdStudents[i].id,
        mediaUrl: "",
        caption: ["Morning coffee ☕", "Campus sunset 🌅", "Study session 📚"][i],
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(Date.now() - i * 3600000),
      },
    });
  }
  console.log("  ✓ Stories");

  console.log("\n✅ Seed complete!");
  console.log("\n📋 Demo Login Credentials:");
  console.log("   ┌──────────────────────┬────────────────────────────┬──────────┐");
  console.log("   │ User                 │ Email                      │ Password │");
  console.log("   ├──────────────────────┼────────────────────────────┼──────────┤");
  console.log("   │ Admin (dashboard)    │ admin@lourdes.edu          │ Admin123!│");
  console.log("   │ Student Admin        │ john.classrep@lourdes.edu  │ Demo123! │");
  console.log("   │ Alice (demo main)    │ alice.wonder@lourdes.edu   │ Demo123! │");
  console.log("   │ Bob                  │ bob.builder@lourdes.edu    │ Demo123! │");
  console.log("   └──────────────────────┴────────────────────────────┴──────────┘");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
