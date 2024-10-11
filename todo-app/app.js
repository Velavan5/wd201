/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
const saltRounds = 10;

// middle vars
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser("shh! some secret string"));
app.use(
  session({
    secret: "my-super-secret-key-1341345422452",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));
app.use(function (err, req, res, next) {
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403);
    res.send("Invalid CSRF Token");
  } else {
    next(err);
  }
});
app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
passport.use(
  new LocalStrategy(
    {
      usernameField: "email", //form name attribute name
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          if (!user) {
            return done(null, false, {
              message: "Invalid Email or Email does not exist",
            });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});
//rendering html pages code
app.set("view engine", "ejs"); //set EJS as view engine

app.get("/", async (request, response) => {
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedinUser = request.user.id;
    const Over_list = await Todo.overdue(loggedinUser); // Overdue
    const Today_list = await Todo.dueToday(loggedinUser); // Due Today
    const Later_list = await Todo.dueLater(loggedinUser); // Due Later
    const Completed_list = await Todo.getCompleted(loggedinUser); //completed
    if (request.accepts("html")) {
      response.render("todos", {
        Today_list,
        Later_list,
        Over_list,
        Completed_list,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        Today_list,
        Later_list,
        Over_list,
        Completed_list,
      });
    }
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", { csrfToken: request.csrfToken() });
});

app.get("/login", (request, response) => {
  response.render("login", { csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) return next(err);
    response.redirect("/");
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log("logged User: " + request.user);
  return response.redirect("/todos?reload=true");
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      // Create a new Todo instance with title and due date
      const todo = await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
     return response.redirect("/todos");
    } catch (error) {
      // Check for Sequelize validation errors
      if (error.name === "SequelizeValidationError") {
        // Iterate through errors and flash messages
        error.errors.forEach((err) => {
          request.flash("error", err.message);
        });
      } else {
        request.flash("error", "An error occurred while creating the todo.");
      }
     return response.redirect("/todos");// Redirect back to the todos page
    }
  }
);

app.post("/users", async (request, response) => {
  const { firstName, lastName, email, password } = request.body;
  const hashedPwd = await bcrypt.hash(password, saltRounds);

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      request.flash(
        "error",
        "Email is already in use. Please use a different email."
      );
      return response.redirect("/signup");
    }

    // Create the user
    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPwd,
    });

    // Log in the user after successful signup
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        return response.status(500).send("Error logging in user");
      }
      response.redirect("/todos");
    });
  } catch (error) {
    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      error.errors.forEach((err) => request.flash("error", err.message));
      return response.redirect("/signup");
    }

    // Handle general errors
    request.flash("error", "An error occurred during sign-up.");
    return response.redirect("/signup");
  }
});


app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      // Find the todo item by its ID
      const todo = await Todo.findByPk(request.params.id);

      if (!todo) {
        return response.status(404).json({ error: "Todo not found" });
      }

      // Update the 'completed' status from the request body
      const updatedTodo = await todo.update({
        completed: request.body.completed,
      });

      return response.json(updatedTodo);
    } catch (error) {
      console.error(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id/setCompletionStatus",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(!todo.completed);
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("Delete a Todo with ID: ", request.params.id);
    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
    // First, we have to query our database to delete a Todo by ID.
    // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
    // response.send(true)
  }
);

module.exports = app;
