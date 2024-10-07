/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const { Todo , User } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

const saltRounds = 10;

// middle vars
app.use(bodyParser.json());
app.use(express.urlencoded({extended : false}));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("123456789iamasecret987654321look",["POST","PUT","DELETE"]));

app.use(session({
  secret : "my-super-secret-key-1341345422452",
  cookie : {
    maxAge : 24*60*60*1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField : 'email',
  passwordField : 'password'
},(username, password ,done)=>{
  User.findOne({ where : {email: username , password : password}})
  .then((user)=> {
    return done(null, user);
  }).catch((error)=>{
    return (error);
  })
}
));

passport.serializeUser( (user, done) => {
  console.log("Serializing user in session",user.id);
  done(null, user.id);
});

passport.deserializeUser( ( id, done)=> {
 User.findByPk(id)
  .then(user => {
    done(null ,user)
  })
  .catch(error => {
    done(error , null);
  })
});
//rendering html pages code 
app.set("view engine","ejs");//set EJS as view engine

app.get("/",async (request,response)=>{
    response.render('index',{
      csrfToken : request.csrfToken()
    });
 });

app.get("/todos",connectEnsureLogin.ensureLoggedIn() , async (request,response)=>{
  const todos = await Todo.findAll(); //getting all todos
  const today = new Date().toISOString().split('T')[0];

  const Over_list = todos.filter(todo => !todo.completed && todo.dueDate < today); // Overdue
  const Today_list = todos.filter(todo => !todo.completed && todo.dueDate === today); // Due Today
  const Later_list = todos.filter(todo => !todo.completed && todo.dueDate > today); // Due Later
  const Completed_list = todos.filter(todo => todo.completed);

  if(request.accepts('html')){
    response.render('todos',{
      Today_list,
      Later_list,
      Over_list,
      Completed_list,
      csrfToken : request.csrfToken()
    }
    );
  }else {
    response.json({
      Today_list,
      Later_list,
      Over_list,
      Completed_list
    })
  }
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

app.get("/signup",(request,response)=>{
response.render("signup" , {csrfToken : request.csrfToken()});

});


app.post("/todos", async function (request, response) {
  try {
   await Todo.addTodo(request.body);
    return response.redirect("/");
    // return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/users",async (request,response)=>{
  // hash password using bcrypt
  const hashedPwd = await bcrypt.hash(request.body.password , saltRounds);
  console.log("\n-----\nUser created with hash : "+hashedPwd);
try{
  const user = await User.create({
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    email : request.body.email,
    password : hashedPwd
  });
  request.login(user, (err) => {
    if(err) {
      console.log(err);
    }
  response.redirect("/todos");
  })
}catch(error){
  console.error(error);
}
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  try {
    // Find the todo item by its ID
    const todo = await Todo.findByPk(request.params.id);

    if (!todo) {
      return response.status(404).json({ error: "Todo not found" });
    }

    // Update the 'completed' status from the request body
    const updatedTodo = await todo.update({ completed: request.body.completed });

    return response.json(updatedTodo);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/setCompletionStatus", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(!(todo.completed));
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("Delete a Todo with ID: ", request.params.id);
try{
  await Todo.remove(request.params.id);
  return response.json({success : true});
}catch(error){
return response.status(422).json(error);
}
  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
});

module.exports = app;
