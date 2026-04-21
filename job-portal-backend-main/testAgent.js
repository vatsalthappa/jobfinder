require("dotenv").config();
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { autoApplyApp } = require("./agent/autoApplyGraph");
const Job = require("./models/Job");
const User = require("./models/User");

async function runTest() {
  console.log("🟡 Starting Local MongoDB Memory Server...");
  let mongoServer;
  
  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log("🟢 Local Memory Database Online!");

    // 1. Create a dummy Recruiter user to legally own the jobs
    const dummyRecruiter = new User({
      name: "Acme Corp Recruiter",
      email: "recruiter@acme.com",
      password: "password123",
      role: "recruiter"
    });
    await dummyRecruiter.save();

    // 2. Insert dummy jobs so the Agent has something to scan
    console.log("📥 Injecting dummy jobs into memory...");
    await Job.insertMany([
      { title: "Senior React Developer", company: "Meta", skills: ["React", "JavaScript", "Redux"], postedBy: dummyRecruiter._id },
      { title: "Node.js Backend Engineer", company: "Amazon", skills: ["Node.js", "Express", "MongoDB"], postedBy: dummyRecruiter._id },
      { title: "Python Data Scientist", company: "Google", skills: ["Python", "Pandas", "PyTorch"], postedBy: dummyRecruiter._id }
    ]);

    // 3. Run the Agent
    console.log("\n🤖 Waking up LangGraph Agent...");
    console.log("🧠 Student profile skills: 'JavaScript, React, Node.js, Express, MongoDB'");
    
    const fakeStudentId = new mongoose.Types.ObjectId().toString();

    const result = await autoApplyApp.invoke({
      userId: fakeStudentId,
      studentSkills: "JavaScript, React, Node.js, Express, MongoDB"
    });

    console.log("\n=============================================");
    console.log("✅ AGENT PROCESS COMPLETE!");
    console.log("🎯 Jobs Found in DB:     ", result.availableJobs.length);
    console.log("📝 Auto-Applications Submitted:  ", result.matchedJobIds.length);
    
    if(result.matchedJobIds.length > 0) {
      console.log("✔️ Successfully matched and applied to jobs!");
    }
    console.log("=============================================\n");

  } catch (err) {
    console.error("\n🔴 EXPOSED API KEY:", process.env.GOOGLE_API_KEY ? "EXISTS" : "UNDEFINED");
    console.error("\n🔴 ERROR OCCURRED: ", err.stack);
  } finally {
    setTimeout(async () => {
      await mongoose.disconnect();
      if (mongoServer) await mongoServer.stop();
      process.exit(0);
    }, 1000);
  }
}

runTest();
