import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  try {
    const prompt = `You are an email classification system for a corporate task management platform (RGSL Group).

Classify the following email into one of these categories and provide a confidence score (0-1):
- "important": Requires attention, from management, time-sensitive
- "action_required": Needs employee response/action
- "informational": FYI/notification, no action needed
- "low_priority": Can be addressed later

Employee context:
- Role: ${employeeRole}
- Departments: ${employeeDepartments.join(", ")}

Email details:
From: ${from}
Subject: ${subject}
Body: ${body.substring(0, 1000)}${body.length > 1000 ? "..." : ""}

Respond in JSON format:
{
  "classification": "important|action_required|informational|low_priority",
  "confidence_score": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggested_task": {
    "title": "task title if applicable",
    "description": "task description",
    "priority": "low|medium|high|critical"
  } or null
}`;

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Claude");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      classification: result.classification,
      confidence_score: result.confidence_score,
      reasoning: result.reasoning,
      suggested_task: result.suggested_task || undefined,
    };
  } catch (error) {
    console.error("Email classification error:", error);
    // Default to informational if classification fails
    return {
      classification: "informational",
      confidence_score: 0,
      reasoning: "Classification failed, defaulting to informational",
    };
  }
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

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
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

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
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

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
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
