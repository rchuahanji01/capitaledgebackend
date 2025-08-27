

// const express = require("express");
// const bcrypt = require("bcryptjs");
// const { generate: uniqueId } = require("shortid");
// const mongoose = require("mongoose");

// const router = express.Router();

// // Models
// const Admin = mongoose.model("Admin");
// const AdminPassword = mongoose.model("AdminPassword");

// // Register user
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // check if user exists
//     const existing = await Admin.findOne({ email });
//     if (existing) {
//       return res.status(400).json({ error: "User already exists" });
//     }

//     // 1. Save user info in Admin
//     const newAdmin = new Admin({
//       name,
//       email,
//       role: role.toLowerCase(),
//     });
//     await newAdmin.save();

//     // 2. Create salt and hash password
//     const salt = uniqueId();
//     // bcrypt with salt prefix
//     const hashedPassword = await bcrypt.hash(salt + password, 10);

//     // 3. Save password data in AdminPassword
//     const newAdminPassword = new AdminPassword({
//       password: hashedPassword,
//       emailVerified: true,
//       salt,
//       user: newAdmin._id,
//     });
//     await newAdminPassword.save();

//     res.json({
//       message: "User created successfully",
//       result: newAdmin,
//     });
//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get all users with pagination
// router.get("/getalluser", async (req, res) => {
//   try {
//     let { page = 1, limit = 10 } = req.query;
//     page = parseInt(page);
//     limit = parseInt(limit);

//     // find all users (excluding password)
//     const users = await Admin.find({})
//       .select("-password") // don’t send password
//       .skip((page - 1) * limit)
//       .limit(limit);

//     const total = await Admin.countDocuments();

//     res.json({
//       users,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (err) {
//     console.error("GetAllUsers error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });


// module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const { generate: uniqueId } = require("shortid");
const mongoose = require("mongoose");

const router = express.Router();

// Models
const Admin = mongoose.model("Admin");
const AdminPassword = mongoose.model("AdminPassword");

/**
 * Register User
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log(password  )
    // check if user exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 1. Save user info in Admin
    const newAdmin = new Admin({
      name,
      email,
      role: role.toLowerCase(),
    });
    await newAdmin.save();

    // 2. Create salt and hash password
    const salt = uniqueId();
    const hashedPassword = await bcrypt.hash(salt + password, 10);

    // 3. Save password data in AdminPassword
    const newAdminPassword = new AdminPassword({
      password: hashedPassword,
      emailVerified: true,
      salt,
      user: newAdmin._id,
    });
    await newAdminPassword.save();

    res.json({
      message: "User created successfully",
      result: newAdmin,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all users with pagination
 */
router.get("/getalluser", async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const users = await Admin.find({})
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Admin.countDocuments();

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GetAllUsers error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Edit user details
 */
router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const updatedUser = await Admin.findByIdAndUpdate(
      id,
      { name, email, role: role?.toLowerCase() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated successfully", result: updatedUser });
  } catch (err) {
    console.error("EditUser error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Activate / Deactivate User
 */
router.patch("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Admin.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.enabled = !user.enabled;
    await user.save();

    res.json({
      message: `User ${user.enabled ? "activated" : "deactivated"} successfully`,
      result: user,
    });
  } catch (err) {
    console.error("ToggleStatus error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Remove user from Admin collection
    const user = await Admin.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Also remove password entry from AdminPassword collection
    await AdminPassword.deleteOne({ user: id });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});


module.exports = router;

