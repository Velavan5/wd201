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
      maxAge:  60 * 60 * 1000, // 1 hours
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
            return done("Invalid Password");
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

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/session",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (request, response) => {
    console.log("logged User: " + request.user);
    response.redirect("/todos");
  }
);

// app.post('/session', (request, response, next) => {
//   // This ensures that the CSRF validation is done before authentication
//   if (request.body._csrf !== request.csrfToken()) {
//     return response.status(403).send('Invalid CSRF token');
//   }
//   next();
// }, passport.authenticate('local', { failureRedirect: "/login" }), (request, response) => {
//   console.log("logged User: " + request.user);
//   response.redirect("/todos");
// });

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
      // return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post("/users", async (request, response) => {
  // hash password using bcrypt
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log("\n-----\nUser created with hash: " + hashedPwd);
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({
      where: { email: request.body.email },
    });
    if (existingUser) {
      return response
        .status(400)
        .send("Email is already in use. Please use a different email.");
    }
    // If email doesn't exist, create a new user
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    // Log the user in after signup
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        return response.status(500).send("Error logging in user");
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.error(error);
    return response.status(500).send("Internal Server Error");
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
      await Todo.remove(request.params.id ,request.user.id);
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
