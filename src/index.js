const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (!name || !username) {
    return response.status(400).json({ error: "Missing required params!" });
  }

  const userExists = users.some((user) => user.username === username);

  if (userExists) {
    return response.status(400).json({ error: "User already exists!" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  if (!title || !deadline) {
    return response.status(400).json({ error: "Missing required params" });
  }

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;
  const { title, deadline } = request.body;

  if (!title || !deadline) {
    return response.status(400).json({ error: "Missing required params" });
  }

  const task = user.todos.find((todo) => todo.id === id);

  if (!task) {
    return response.status(404).json({ error: "Invalid task id!" });
  }

  task.title = title;
  task.deadline = new Date(deadline);

  user.todos.splice(task, 1);
  user.todos.push(task);

  return response.json({
    title: task.title,
    deadline: task.deadline,
    done: task.done,
  });
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const task = user.todos.find((todo) => todo.id === id);

  if (!task) {
    return response.status(404).json({ error: "Invalid task id!" });
  }

  task.done = true;

  user.todos.splice(task, 1);
  user.todos.push(task);

  return response.json(task);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const task = user.todos.find((todo) => todo.id === id);

  if (!task) {
    return response.status(404).json({ error: "Invalid task id!" });
  }

  user.todos.splice(task, 1);

  if (!user.todos.length) {
    return response.status(204).send();
  }

  return response.json(user.todos);
});

module.exports = app;
