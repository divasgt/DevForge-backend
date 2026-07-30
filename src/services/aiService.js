const { GoogleGenAI, Type, Schema } = require("@google/genai");

// Initialize Gemini client (it automatically picks up GEMINI_API_KEY from environment)
const ai = new GoogleGenAI({});

// Parses a natural language query into structured feed filters.

const parsePromptWithAI = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in the backend .env file.");
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      minAge: { type: Type.INTEGER, description: "Minimum age of the developer" },
      maxAge: { type: Type.INTEGER, description: "Maximum age of the developer" },
      minExp: { type: Type.INTEGER, description: "Minimum years of experience required" },
      maxExp: { type: Type.INTEGER, description: "Maximum years of experience required" },
      city: { type: Type.STRING, description: "City name. Do not include country." },
      country: { type: Type.STRING, description: "Country name" },
      specialization: {
        type: Type.STRING,
        description:
          "Comma separated string of developer specializations (e.g. 'Backend Developer, Frontend Developer')",
      },
      skills: {
        type: Type.STRING,
        description:
          "Comma separated string of technical skills/languages (e.g. 'Databases, React, Node.js, Python,')",
      },
      status: {
        type: Type.STRING,
        description:
          "Comma separated string of employment status. Allowed values: employed, self-employed, freelance, student, hobbyist",
      },
    },
  };

  const SPECIALIZATION_OPTIONS = [
    "Software Enginner",
    "Software Development Engineer (SDE)",
    "Web Developer",
    "Frontend Developer",
    "Backend Developer",
    "Fullstack Developer",
    "DevOps Engineer",
    "AI / ML Engineer",
    "Mobile App Developer (IOS / Android)",
    "Android Developer",
    "IOS Developer",
    "Data Scientist / Engineer",
    "Game Developer",
    "Cloud Architect",
    "Cybersecurity Engineer",
    "UI / UX Designer",
    "Blockchain Developer",
  ];

  const SKILL_OPTIONS = [
    "Frontend",
    "Backend",
    "Databases",
    "DevOps",
    "Deployment",
    "AI",
    "ML",
    "GenAI",
    "Vibe Coding",
    "Claude",
    "Codex",
    "React",
    "Node.js",
    "Express.js",
    "Next.js",
    "Svelte",
    "Vue.js",
    "Angular",
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C++",
    "C",
    "C#",
    "Go",
    "Rust",
    "Docker",
    "Kubernetes",
    "AWS",
    "MongoDB",
    "PostgreSQL",
    "SQL",
    "MySQL",
    "Redis",
    "GraphQL",
    "HTML",
    "CSS",
    "SCSS",
    "SASS",
    "Tailwind CSS",
    "PyTorch",
    "TensorFlow",
  ];

  const systemInstruction = `You are a smart filter extraction assistant for a developer matching platform. Your job is to extract search parameters from a natural language query and return them as a structured JSON object according to the provided schema. 

CRITICAL MATCHING RULES:
If the user mentions skills or specializations, you MUST map them to the following exact predefined options if they are a close match (e.g., 'Node' -> 'Node.js', 'frontend' -> 'Frontend Developer'):

Predefined Specializations: ${SPECIALIZATION_OPTIONS.join(", ")}
Predefined Skills: ${SKILL_OPTIONS.join(", ")}

If a skill or specialization is NOT in the list at all and cannot be mapped, you may include the custom text they wrote, but strongly prioritize returning the exact predefined options.
If a filter is not mentioned, omit it or return null. For 'skills' and 'specialization', return comma-separated strings if multiple are found.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return {};
  } catch (err) {
    console.error("AI parsing error:", err);
    throw new Error("Failed to parse query using AI.");
  }
};

module.exports = {
  parsePromptWithAI,
};
