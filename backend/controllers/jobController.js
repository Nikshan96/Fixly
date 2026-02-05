const { randomUUID } = require("crypto");
const { Op } = require("sequelize");
const { Job, Notification, User } = require("../models");

const withCustomer = async (job) => {
  const customer = await User.findByPk(job.customer);
  return {
    ...job.toJSON(),
    customer: customer
      ? {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          avatar: customer.avatar,
          address: customer.address,
        }
      : null,
  };
};

// GET /api/jobs/available  — pending jobs for technician to browse
exports.getAvailableJobs = async (req, res, next) => {
  try {
    const rows = await Job.findAll({ where: { status: "pending" }, order: [["createdAt", "DESC"]] });
    const available = await Promise.all(rows.map(withCustomer));
    res.json({ success: true, data: available });
  } catch (err) { next(err); }
};

// GET /api/jobs/my  — jobs assigned to this technician
exports.getMyJobs = async (req, res, next) => {
  try {
    const rows = await Job.findAll({
      where: { technician: req.user._id, status: { [Op.in]: ["accepted", "in_progress"] } },
      order: [["createdAt", "DESC"]],
    });
    const myJobs = await Promise.all(rows.map(withCustomer));
    res.json({ success: true, data: myJobs });
  } catch (err) { next(err); }
};

// GET /api/jobs/completed  — completed jobs history
exports.getCompletedJobs = async (req, res, next) => {
  try {
    const rows = await Job.findAll({
      where: { technician: req.user._id, status: "completed" },
      order: [["completedAt", "DESC"]],
    });
    const completed = await Promise.all(rows.map(withCustomer));
    res.json({ success: true, data: completed });
  } catch (err) { next(err); }
};

// GET /api/jobs/earnings  — earnings logic (mocked)
exports.getEarnings = async (req, res, next) => {
  try {
     const completedJobs = await Job.findAll({ where: { technician: req.user._id, status: "completed" } });
     
     const byMonth = {};
     completedJobs.forEach((j) => {
       const d = new Date(j.completedAt || j.createdAt || new Date());
       // Fallback to createdAt or now if completedAt missing in mock
       
       const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
       const mon = d.toLocaleString("en-US", { month: "long" });
       
       if (!byMonth[key]) byMonth[key] = { month: mon, year: d.getFullYear(), amount: 0 };
       byMonth[key].amount += (j.price || 0);
     });

     const earningsList = Object.values(byMonth).sort((a, b) => b.year - a.year || b.month.localeCompare(a.month)); // Newest first maybe? Or oldest? Frontend doesn't sort strictly but let's go chronologically descending
     
     // Original code sorted by year/month ascending usually
     const earningsSorted = earningsList.sort((a, b) => a.year - b.year || new Date(`${a.month} 1, 2000`) - new Date(`${b.month} 1, 2000`));

     const total = earningsSorted.reduce((s, e) => s + e.amount, 0);

     // This month
     const now = new Date();
     const thisMonKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
     const thisMonthAmount = byMonth[thisMonKey]?.amount || 0;

     res.json({ success: true, data: { earnings: earningsSorted, total, thisMonth: thisMonthAmount } });
  } catch (err) { next(err); }
};

// POST /api/jobs/:id/accept
exports.acceptJob = async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    
    job.technician = req.user._id;
    job.status     = "accepted";
    job.acceptedAt = new Date();
    await job.save();

    await Notification.create({
      _id: `notif_${randomUUID()}`,
      recipient: job.customer,
      title: "Job Accepted",
      message: `${req.user.name} accepted your job request`,
      type: "job_accepted",
      read: false,
    });

    res.json({ success: true, data: await withCustomer(job) });
  } catch (err) { next(err); }
};

// POST /api/jobs/:id/decline
exports.declineJob = async (req, res, next) => {
  res.json({ success: true, message: "Job declined" });
};

// POST /api/jobs/:id/complete
exports.completeJob = async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    job.status = "completed";
    job.completedAt = new Date();
    await job.save();
    res.json({ success: true, data: await withCustomer(job) });
  } catch (err) {
    next(err);
  }
};
