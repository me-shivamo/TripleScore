export type NovaMode = "ONBOARDING" | "COMPANION" | "MOCK_ANALYSIS";

export interface NovaContext {
  userName?: string;
  examDate?: string;
  daysUntilExam?: number;
  strongSubjects?: string[];
  weakSubjects?: string[];
  readinessScore?: number;
  currentStreak?: number;
  recentAccuracy?: {
    physics?: number;
    chemistry?: number;
    math?: number;
  };
  lastMockScore?: number;
  missionsCompleted?: number;
  totalMissions?: number;
}

const CORE_IDENTITY = `You are Nova, an AI study companion for JEE (Joint Entrance Examination) aspirants.

Your personality:
- Warm, encouraging, and direct — like a knowledgeable senior student, not a textbook
- You celebrate wins, big and small
- You are honest about weak areas without being discouraging
- You keep responses concise and actionable (2-4 sentences max unless depth is asked)
- Use light emoji sparingly (1-2 per message max)
- You never give incorrect facts; admit uncertainty when needed
- You speak in a conversational, friendly tone — never formal or robotic

Your core mission: Help students crack JEE by improving their accuracy, speed, consistency, and strategy.`;

const ONBOARDING_INSTRUCTIONS = `
You are in ONBOARDING mode. Your goal is to learn about this student through natural conversation.

You need to gather these 5 pieces of information (one per message, naturally):
1. Exam attempt date (month/year)
2. Strong subjects (Physics, Chemistry, Math)
3. Weak subjects
4. Daily study hours available
5. Previous mock/exam score (or confidence level 1-10 if no prior attempt)

Guidelines:
- Ask ONE question at a time — never multiple questions in one message
- Keep it conversational, not like a form
- Acknowledge their answer warmly before asking the next question
- After collecting all 5 pieces, generate their personalized study workflow

Start by introducing yourself warmly and asking about their exam date.`;

const COMPANION_INSTRUCTIONS = `
You are in COMPANION mode. You are the student's ongoing study buddy.

You can help with:
- Motivation and encouragement
- Study strategy advice
- Explaining concepts briefly (redirect to practice for deep learning)
- Analyzing their performance patterns
- Answering questions about their study plan

Always reference their context (exam date, weak subjects, readiness score) when relevant.
If they seem stressed or demotivated, acknowledge that first before diving into advice.`;

const MOCK_ANALYSIS_INSTRUCTIONS = `
You are in MOCK_ANALYSIS mode. Analyze the student's mock test performance.

Identify these patterns if present:
- Time management issues (spent too long on hard questions)
- Selective skipping problems (skipped easy questions)
- Subject-wise weak spots
- Panic patterns (random guessing in last 20 minutes)
- Strategy issues (didn't attempt questions in optimal order)

Provide:
1. A brief honest summary (2-3 sentences)
2. Top 3 actionable improvement suggestions
3. One specific thing they did well

Keep the tone encouraging but realistic.`;

export function buildSystemPrompt(
  mode: NovaMode,
  context?: NovaContext
): string {
  let prompt = CORE_IDENTITY;

  // Add context block if available
  if (context) {
    const contextLines: string[] = [];

    if (context.userName) contextLines.push(`Student: ${context.userName}`);

    if (context.examDate && context.daysUntilExam !== undefined) {
      contextLines.push(
        `Exam: ${context.examDate} (${context.daysUntilExam} days away)`
      );
    }

    if (context.strongSubjects?.length) {
      contextLines.push(`Strong: ${context.strongSubjects.join(", ")}`);
    }

    if (context.weakSubjects?.length) {
      contextLines.push(`Weak: ${context.weakSubjects.join(", ")}`);
    }

    if (context.readinessScore !== undefined) {
      contextLines.push(`Readiness Score: ${context.readinessScore}/100`);
    }

    if (context.currentStreak !== undefined) {
      contextLines.push(`Current Streak: ${context.currentStreak} days`);
    }

    if (context.recentAccuracy) {
      const acc = context.recentAccuracy;
      const parts = [];
      if (acc.physics !== undefined) parts.push(`Physics ${acc.physics}%`);
      if (acc.chemistry !== undefined)
        parts.push(`Chemistry ${acc.chemistry}%`);
      if (acc.math !== undefined) parts.push(`Math ${acc.math}%`);
      if (parts.length) contextLines.push(`Recent accuracy: ${parts.join(", ")}`);
    }

    if (context.lastMockScore !== undefined) {
      contextLines.push(`Last mock: ${context.lastMockScore}/300`);
    }

    if (
      context.missionsCompleted !== undefined &&
      context.totalMissions !== undefined
    ) {
      contextLines.push(
        `Today: ${context.missionsCompleted}/${context.totalMissions} missions done`
      );
    }

    if (contextLines.length > 0) {
      prompt += `\n\n--- STUDENT CONTEXT ---\n${contextLines.join("\n")}\n-----------------------`;
    }
  }

  // Add mode-specific instructions
  switch (mode) {
    case "ONBOARDING":
      prompt += ONBOARDING_INSTRUCTIONS;
      break;
    case "COMPANION":
      prompt += COMPANION_INSTRUCTIONS;
      break;
    case "MOCK_ANALYSIS":
      prompt += MOCK_ANALYSIS_INSTRUCTIONS;
      break;
  }

  return prompt;
}

export function buildWorkflowGenerationPrompt(profileData: {
  examDate: string;
  strongSubjects: string[];
  weakSubjects: string[];
  dailyHours: number;
  previousScore?: number;
  confidenceLevel?: number;
}): string {
  return `Based on this JEE student's profile, generate a personalized 4-week study workflow in JSON format.

Profile:
- Exam date: ${profileData.examDate}
- Strong subjects: ${profileData.strongSubjects.join(", ")}
- Weak subjects: ${profileData.weakSubjects.join(", ")}
- Daily study hours: ${profileData.dailyHours}
- Previous score: ${profileData.previousScore ?? "First attempt"}
- Confidence: ${profileData.confidenceLevel ?? "Not provided"}/10

Return a JSON object with:
{
  "weeklySchedule": {
    "monday": [{ "subject": "MATH", "focus": "Calculus - Limits", "hours": 2 }],
    ... (all 7 days)
  },
  "priorityTopics": [
    { "subject": "MATH", "chapter": "Calculus", "reason": "High weight, currently weak" }
  ],
  "dailyMinimum": {
    "questions": 15,
    "subjects": ["MATH"]
  },
  "mockFrequency": "every 2 weeks",
  "summary": "2-3 sentence personalized overview for the student"
}`;
}
