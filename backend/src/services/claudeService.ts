import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

const getClient = (): Anthropic => {
  if (!client) {
    console.log("🤖 [CLAUDE SERVICE] Initializing Anthropic client");
    console.log("   ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
    console.log("   API key length:", process.env.ANTHROPIC_API_KEY?.length || 0);
    console.log("   API key starts with:", process.env.ANTHROPIC_API_KEY?.substring(0, 20) || "N/A");

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("❌ ANTHROPIC_API_KEY environment variable is not set!");
    }

    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 [CLAUDE SERVICE] Anthropic client initialized successfully");
  }
  return client;
};

export interface EmailClassificationResult {
  classification: "important" | "action_required" | "informational" | "low_priority";
  confidence_score: number;
  reasoning: string;
  suggested_task?: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
  };
}

/**
 * Classify an email using Claude AI
 */
export const classifyEmail = async (
  from: string,
  subject: string,
  body: string,
  employeeRole: string,
  employeeDepartments: string[]
): Promise<EmailClassificationResult> => {
  // ⏸️ Claude classification disabled to preserve API credits
  console.log(`📭 [CLASSIFY] Skipping Claude classification (disabled to preserve credits)`);

  // Return default classification
  return {
    classification: "informational",
    confidence_score: 0.5,
    reasoning: "Default classification (Claude disabled to preserve credits)",
  };
};

/**
 * Generate personalized AI insights for an employee
 */
export const generateEmployeeInsights = async (
  employeeName: string,
  employeeRole: string,
  departments: string[],
  taskCount: number,
  overdueCount: number,
  upcomingDeadlines: string[],
  recentEmails: string[]
): Promise<string> => {
  try {
    const prompt = `You are an AI assistant for ${employeeName}, an employee at RGSL Group.

Employee Details:
- Role: ${employeeRole}
- Departments: ${departments.join(", ")}
- Active Tasks: ${taskCount}
- Overdue Tasks: ${overdueCount}
- Upcoming Deadlines: ${upcomingDeadlines.join(", ")}
- Recent Important Emails: ${recentEmails.join(", ")}

Provide a brief, personalized daily briefing (2-3 sentences) with:
1. Priority action items
2. Any risks or concerns
3. Recommendations for focus

Be concise and actionable.`;

    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Insights generation error:", error);
    return "Unable to generate insights at this time.";
  }
};

/**
 * Generate manager team insights
 */
export const generateManagerInsights = async (
  managerName: string,
  teamSize: number,
  overloadedEmployees: string[],
  blockedTasks: string[],
  deadlineRisks: string[]
): Promise<string> => {
  try {
    const prompt = `You are providing team insights to ${managerName}, a manager at RGSL Group.

Team Status:
- Team Size: ${teamSize}
- Overloaded Employees: ${overloadedEmployees.join(", ") || "None"}
- Blocked/Escalated Tasks: ${blockedTasks.join(", ") || "None"}
- Deadline Risks: ${deadlineRisks.join(", ") || "None"}

Provide brief management insights (2-3 sentences):
1. Team health assessment
2. Immediate concerns
3. Recommended actions

Be concise and actionable.`;

    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Manager insights error:", error);
    return "Unable to generate insights at this time.";
  }
};

/**
 * Answer a free-form question from employee
 */
export const askAI = async (
  question: string,
  employeeContext: {
    name: string;
    role: string;
    departments: string[];
    activeTasks: number;
    overdueTasks: number;
  }
): Promise<string> => {
  try {
    const systemPrompt = `You are an AI assistant for RGSL Group's task management system.
You're helping ${employeeContext.name}, a ${employeeContext.role} in ${employeeContext.departments.join(", ")}.

Current context:
- Active tasks: ${employeeContext.activeTasks}
- Overdue tasks: ${employeeContext.overdueTasks}

Be helpful, concise, and professional. Provide actionable advice.`;

    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("AI question error:", error);
    return "I'm unable to answer that question right now. Please try again.";
  }
};
