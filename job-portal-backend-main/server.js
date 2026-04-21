console.log("SERVER FILE RUNNING 🚀");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const dotenv = require("dotenv");
const cors = require("cors");

const Job = require("./models/Job");
const User = require("./models/User");

// Load variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes.js");
const applicationRoutes = require("./routes/applicationRoutes.js");
const agentRoutes = require("./routes/agentRoutes.js");


app.use("/api/users", userRoutes);
app.use("/api/jobs", (req, res, next) => {
  console.log("🔥 HIT /api/jobs PREFIX");
  next();
}, jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/agent", agentRoutes);

const { MongoMemoryServer } = require("mongodb-memory-server");
// MongoDB connection
if (process.env.MONGO_URI === "local") {
  MongoMemoryServer.create().then((mongoServer) => {
    mongoose.connect(mongoServer.getUri())
      .then(async () => {
        console.log("🟢 Local MongoDB Memory Server connected ✅");
        
        // Setup initial dummy jobs if none exist
        const dummyRecruiter = new User({ name: "Acme Corp Recruiter", email: "recruiter@acme.com", password: "password123", role: "recruiter" });
        await dummyRecruiter.save();
        
        await Job.insertMany([
          { title: "Senior React Developer", company: "Meta", skills: ["React", "JavaScript", "Redux"], postedBy: dummyRecruiter._id },
          { title: "Node.js Backend Engineer", company: "Amazon", skills: ["Node.js", "Express", "MongoDB"], postedBy: dummyRecruiter._id },
          { title: "Python Data Scientist", company: "Google", skills: ["Python", "Pandas", "PyTorch"], postedBy: dummyRecruiter._id }
        ]);
        console.log("📥 Fake Database initialised with basic jobs for frontend testing!");
      })
      .catch(err => console.log(err));
  });
} else {
  mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));
}

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/test", (req, res) => {
  res.send("Test route working");
});