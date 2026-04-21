const { StateGraph, Annotation, END } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { z } = require("zod");
const Job = require("../models/Job");
const Application = require("../models/Application");

// 1. Define the LangGraph State
const AutoApplyState = Annotation.Root({
  userId: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  studentSkills: Annotation({
    reducer: (x, y) => y ?? x,
  }),
  availableJobs: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  matchedJobIds: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
});

// 2. Define the graph nodes

// Node A: Fetch jobs from MongoDB that the user hasn't applied to yet
async function fetchJobs(state) {
  const existingApps = await Application.find({ user: state.userId });
  const appliedJobIds = existingApps.map(app => app.job.toString());

  // Find all jobs where their ID is NOT in the applied array
  const jobs = await Job.find({ _id: { $nin: appliedJobIds } });
  
  return { availableJobs: jobs };
}

// Node B: Use LLM to match jobs to skills
async function matchJobs(state) {
  if (!state.availableJobs || state.availableJobs.length === 0) {
    return { matchedJobIds: [] };
  }

  // NOTE: Expects GOOGLE_API_KEY environment variable
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY
  });

  // Force output to be exactly an array of valid match IDs
  const OutputSchema = z.object({
    matchedJobIds: z.array(z.string()).describe("Array of MongoDB Job ObjectIds that are a strong match for the student."),
  });

  const structuredLlm = llm.withStructuredOutput(OutputSchema, { name: "match_jobs" });

  const jobDetails = state.availableJobs.map(j => `ID: ${j._id.toString()} | Title: ${j.title} | Skills: ${j.skills.join(",")}`).join("\n");

  const prompt = `
You are an expert AI software agent matching a student to job listings.
Student's skills: ${state.studentSkills}

Available Jobs:
${jobDetails}

Analyze the skills. If the student has at least 50% technical overlap with a job's required skills, consider it a match.
Return a JSON structure containing an array 'matchedJobIds' with the string IDs of the matched jobs.
If none match, return an empty array.
  `;

  let result;
  try {
     result = await structuredLlm.invoke(prompt);
  } catch (err) {
     console.error("LLM Error in matchJobs node. Check if GOOGLE_API_KEY is configured correctly.", err);
     result = { matchedJobIds: [] };
  }

  return { matchedJobIds: result?.matchedJobIds || [] };
}

// Node C: Insert into MongoDB
async function applyToJobs(state) {
  const { matchedJobIds, userId } = state;

  if (matchedJobIds && matchedJobIds.length > 0) {
    const appsToInsert = matchedJobIds.map(jobId => ({
      user: userId,
      job: jobId,
      status: "applied"
    }));

    // Auto-create applications for the matched jobs!
    await Application.insertMany(appsToInsert);
    console.log(`Auto-applied to ${matchedJobIds.length} jobs for user ${userId}.`);
  }

  return {}; 
}

// 3. Compile the State Graph
const workflow = new StateGraph(AutoApplyState)
  .addNode("fetch", fetchJobs)
  .addNode("match", matchJobs)
  .addNode("apply", applyToJobs)
  .addEdge("__start__", "fetch")
  .addEdge("fetch", "match")
  .addEdge("match", "apply")
  .addEdge("apply", END);

const autoApplyApp = workflow.compile();

module.exports = { autoApplyApp };
