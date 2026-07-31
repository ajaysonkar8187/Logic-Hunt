import { PrismaClient, QuestionType, Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Create admin ──────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );

  const admin = await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@logichunt.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@logichunt.com",
      password: hashedPassword,
      name: "Admin",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // ── Create event ──────────────────────────────────────────────────────────
  const event = await prisma.event.upsert({
    where: { slug: "logic-hunt-2026" },
    update: {},
    create: {
      name: "Logic Hunt 2026",
      slug: "logic-hunt-2026",
      description: "University Orientation Logic Challenge",
      timeLimitMin: 15,
      status: "DRAFT",
    },
  });
  console.log(`✅ Event created: ${event.name}`);

  // ── Create questions ──────────────────────────────────────────────────────
  const questions = [
    {
      title: "Which number comes next in the sequence: 2, 4, 8, 16, ?",
      type: QuestionType.MCQ,
      difficulty: Difficulty.EASY,
      category: "Pattern Recognition",
      options: ["18", "24", "32", "64"],
      correctAnswer: "32",
      explanation: "Each number is doubled. 16 × 2 = 32.",
      marks: 2,
      timeLimitSec: 30,
      tags: ["sequence", "doubling"],
    },
    {
      title: "Which of the following are prime numbers?",
      type: QuestionType.MULTI_SELECT,
      difficulty: Difficulty.EASY,
      category: "Math Puzzle",
      options: ["2", "3", "4", "5", "9"],
      correctAnswer: ["2", "3", "5"],
      explanation: "2, 3, and 5 are prime. 4 = 2×2 and 9 = 3×3.",
      marks: 3,
      timeLimitSec: 45,
      tags: ["prime-numbers"],
    },
    {
      title:
        "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?",
      type: QuestionType.RIDDLE,
      difficulty: Difficulty.MEDIUM,
      category: "Riddles & Brain Teasers",
      options: ["Echo", "Shadow", "Silence", "Ghost"],
      correctAnswer: "Echo",
      explanation: "An echo speaks without a mouth and hears without ears.",
      marks: 2,
      timeLimitSec: 40,
      tags: ["riddle", "classic"],
    },
    {
      title:
        "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
      type: QuestionType.MCQ,
      difficulty: Difficulty.MEDIUM,
      category: "Logical Thinking",
      options: ["Yes", "No", "Cannot be determined", "Only some"],
      correctAnswer: "Yes",
      explanation:
        "This is a transitive relationship: Bloops → Razzies → Lazzies.",
      marks: 2,
      timeLimitSec: 35,
      tags: ["syllogism"],
    },
    {
      title: "What is the output of: console.log(typeof null)?",
      type: QuestionType.MCQ,
      difficulty: Difficulty.HARD,
      category: "Coding Logic",
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      correctAnswer: '"object"',
      explanation:
        "typeof null returns 'object' — a well-known JavaScript quirk.",
      marks: 3,
      timeLimitSec: 25,
      tags: ["javascript", "typeof"],
    },
    {
      title:
        "Arrange these steps of the scientific method in the correct order:",
      type: QuestionType.ORDERING,
      difficulty: Difficulty.MEDIUM,
      category: "Critical Thinking",
      options: [
        "Analyze results",
        "Form hypothesis",
        "Conduct experiment",
        "Make observation",
        "Draw conclusion",
      ],
      correctAnswer: [
        "Make observation",
        "Form hypothesis",
        "Conduct experiment",
        "Analyze results",
        "Draw conclusion",
      ],
      explanation:
        "The scientific method follows: observe → hypothesize → experiment → analyze → conclude.",
      marks: 4,
      timeLimitSec: 60,
      tags: ["science", "method"],
    },
    {
      title: "Decode this Caesar cipher (shift 3): KHOOR ZRUOG",
      type: QuestionType.CIPHER,
      difficulty: Difficulty.HARD,
      category: "Riddles & Brain Teasers",
      options: [],
      correctAnswer: "HELLO WORLD",
      hint: "Shift each letter back by 3 positions in the alphabet.",
      explanation:
        "K→H, H→E, O→L, O→L, R→O, Z→W, R→O, U→R, O→L, G→D",
      marks: 4,
      timeLimitSec: 60,
      tags: ["cipher", "caesar"],
    },
    {
      title:
        "A farmer has 17 sheep. All but 9 die. How many sheep are left?",
      type: QuestionType.MCQ,
      difficulty: Difficulty.EASY,
      category: "Riddles & Brain Teasers",
      options: ["8", "9", "17", "0"],
      correctAnswer: "9",
      explanation: "'All but 9' means 9 survive.",
      marks: 1,
      timeLimitSec: 20,
      tags: ["trick-question"],
    },
    {
      title:
        "Which of these data structures use FIFO (First In, First Out)?",
      type: QuestionType.MULTI_SELECT,
      difficulty: Difficulty.MEDIUM,
      category: "Coding Logic",
      options: ["Queue", "Stack", "Deque", "Priority Queue"],
      correctAnswer: ["Queue"],
      explanation: "A Queue uses FIFO ordering. Stack is LIFO.",
      marks: 2,
      timeLimitSec: 30,
      tags: ["data-structures"],
    },
    {
      title: "What comes next in the pattern: 1, 1, 2, 3, 5, 8, ?",
      type: QuestionType.MCQ,
      difficulty: Difficulty.EASY,
      category: "Pattern Recognition",
      options: ["10", "11", "13", "15"],
      correctAnswer: "13",
      explanation: "Fibonacci sequence: 5 + 8 = 13.",
      marks: 2,
      timeLimitSec: 25,
      tags: ["fibonacci", "sequence"],
    },
  ];

  for (const q of questions) {
    const question = await prisma.question.create({ data: q });
    await prisma.eventQuestion.create({
      data: {
        eventId: event.id,
        questionId: question.id,
        sortOrder: questions.indexOf(q),
      },
    });
  }
  console.log(`✅ ${questions.length} questions seeded and linked to event`);

  console.log("\n🎉 Seed complete!");
  console.log(`   Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || "admin123"}`);
  console.log(`   Event: ${event.name} (${event.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
