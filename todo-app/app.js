const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser")
// middle vars
app.use(bodyParser.json());
app.use(express.urlencoded({extended : false}));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("123456789iamasecret987654321look",["POST","PUT","DELETE"]));

//rendering html pages code 
app.set("view engine","ejs");
app.get("/",async (request,response)=>{
  const todos = await Todo.findAll(); //getting all todos
  const today = new Date().toISOString().split('T')[0];

  const Over_list = todos.filter(todo => !todo.completed && todo.dueDate < today); // Overdue
  const Today_list = todos.filter(todo => !todo.completed && todo.dueDate === today); // Due Today
  const Later_list = todos.filter(todo => !todo.completed && todo.dueDate > today); // Due Later
  const Completed_list = todos.filter(todo => todo.completed);
  if(request.accepts('html')){
    response.render('index',{
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

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE
try{
  const todo = await Todo.findAll();
  return response.json(todo);
}catch(error){
console.log(error);
return response.status(500).json({ error});
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
