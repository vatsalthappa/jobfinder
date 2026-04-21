const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  },
  status: {
    type: String,
    default: "applied"
  }
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);