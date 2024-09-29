const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({extended : false}));

//rendering html pages code 
app.set("view engine","ejs");
app.get("/",async (request,response)=>{
  const Today_list = await Todo.dueToday();
  const Later_list = await Todo.dueLater();
  const Over_list = await Todo.overdue();

  if(request.accepts('html')){
    response.render('index',{
      Today_list,
      Later_list,
      Over_list
    }
    );
  }else {
    response.json({
      Today_list,
      Later_list,
      Over_list
    })
  }
});

// app.get("/", function (request, response) {
//   response.send("Hello World");
// });

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


  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
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

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // FILL IN YOUR CODE HERE
const id1 =await Todo.findByPk(request.params.id);
try{
  await id1.destroy();
  return response.send(true);
}catch(error){
console.log("error while deleting:\n"+error);
return response.send(false);
}
  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
});

module.exports = app;
