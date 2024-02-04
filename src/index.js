// task 1 = create new endpoint for /signup ✅
// task 2 = make it so users can signup and a new token is generated for them ✅
// task 3 = make the data save into mongo db ✅
// task 4 = make signin possible with token ✅
// task 5 = if user doesnt exist return error ✅
// task 6 = if user exists return list of users in db
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const jwtPass = "12345";

const app = express();
const PORT = 3000;

mongoose
  .connect("mongodb+srv://admin:admin123@cluster0.lhwf1g5.mongodb.net/users_app")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(() => {
    console.log("Could not connect to MongoDB");
  });

// schema
const usersSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

// model based on the schema
const Users = mongoose.model("users", usersSchema);

// validationSchemas.js
const { z } = require("zod");

const schema = z.object({
  body: z.object({
    username: z.string(),
    email: z.string().endsWith("@gmail.com") || z.string().endsWith(".com"),
    password: z.string().min(8),
  }),
});

// middleware for input validation
const validateUserInput = (schema) => (req, res, next) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err) {
    return res.status(400).json({
      error: err,
    });
  }
};

app.use(express.json(), validateUserInput(schema));

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (await userExists(email)) {
    return res.status(403).json({
      msg: "Account already exists, please sign in!",
    });
  }
  // create a new user
  createUser(username, email, password);
  const token = jwt.sign({ email }, jwtPass);
  // sending token to the user
  return res.status(200).json({
    message: "Signup successful!",
    token,
  });
});

app.post("/login", async (req, res) => {
  const { username, email, password } = req.body;

  if (!(await userExists(email))) {
    return res.status(403).json({
      message: "Wrong username or password!",
    });
  } else {
    // token creation
    const token = jwt.sign({ email }, jwtPass);
    // sending token to the user
    return res.status(200).json({
      message: "LoggedIn successfully!",
      token,
    });
  }
});

app.get("/users", (req, res) => {
  // getting the token from the user
  const token = req.headers.authorization;
  try {
    // verification of user
    const decoded = jwt.verify(token, jwtPass);
    const username = decoded.username;

    // return list of users other than this user
    return res.status(200).json({
      msg: "Welcome back " + req.body.username + "!",
    });
  } catch (err) {
    return res.status(403).json({
      msg: "User not found or Invalid token",
    });
  }
});

// global error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Internal Server Error",
  });
});

// function to find if the user exists
async function userExists(email) {
  const user = await Users.findOne({ email: email});
  return user !== null;
}

function createUser(username, email, password) {
  const user = new Users({
    username: username,
    email: email,
    password: password,
  });
  // save the user
  user.save().then(() => console.log("Added User!"));
}

app.listen(PORT, () => {
  console.log(`Server is running at 3000`);
});
