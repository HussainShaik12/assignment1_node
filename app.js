const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { format } = require("date-fns");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");

let database = null;
initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

statusValues = ["TO DO", "IN PROGRESS", "DONE"];
priorityValues = ["HIGH", "MEDIUM", "LOW"];
categoryValues = ["WORK", "HOME", "LEARNING"];

statusIsValid = (requestQuery) => {
  return statusValues.includes(requestQuery.status);
};
priorityIsValid = (requestQuery) => {
  return priorityValues.includes(requestQuery.priority);
};
categoryIsValid = (requestQuery) => {
  return categoryValues.includes(requestQuery.category);
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  const { search_q = "", status, priority, category } = request.query;
  let getTodosQuery = "";
  console.log(status, priority, category);
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
AND status = '${status}' AND priority = '${priority}';`;
      break;

    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
and status = '${status}' AND category = '${category}';`;
      break;

    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
and category = '${category}' AND priority = '${priority}';`;
      break;

    case hasStatusProperty(request.query):
      if (statusIsValid(request.query)) {
        getTodosQuery = `select * from todo where todo LIKE '%${search_q}%' and
status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priorityIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
and priority = '${priority}';`;
      }
      break;

    case hasCategoryProperty(request.query):
      if (categoryIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
and category = '${category}';`;
      }
      break;

    default:
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%';`;
      break;
  }
  data = await database.all(getTodosQuery);
  console.log(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getAgendaQuery = `select * from todo where due_date=${date};`;
  const agenda = await database.get(getAgendaQuery);
  response.send(agenda);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, due_date, status, category, priority } = request.body;
  const AddTodoQuery = `insert into todo (id,todo,priority,status,category,due_date)
Values (${id},'${todo}','${priority}','${status}','${category}','${due_date}');`;
  await database.run(AddTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    default:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `select * from todo where todoId=${todoId};`;
  const prevTodo = await database.get(previousTodoQuery);
  const {
    todo = prevTodo.todo,
    status = prevTodo.status,
    category = prevTodo.category,
    priority = prevTodo.priority,
  } = request.body;

  const updateTodoQuery = `update todo set todo='${todo}',status='${status}',
category='${category}',priority='${priority}';`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `Delete from todo where id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
