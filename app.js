const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { format, isValid } = require("date-fns");

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

convertDbObejct = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

statusIsValid = (requestQuery) => {
  console.log(requestQuery.status);
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
      if (statusIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      if (priorityIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
AND status = '${status}' AND priority = '${priority}';`;
      break;

    case hasCategoryAndStatusProperty(request.query):
      if (categoryIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      if (statusIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
and status = '${status}' AND category = '${category}';`;
      break;

    case hasCategoryAndPriorityProperty(request.query):
      if (categoryIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      if (priorityIsValid(request.query) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'
AND category = '${category}' AND priority = '${priority}';`;
      break;

    case hasStatusProperty(request.query):
      if (statusIsValid(request.query) === true) {
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
  const convertedArray = data.map((each) => convertDbObejct(each));

  response.send(convertedArray);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  console.log(todo);
  const convertedData = convertDbObejct(todo);
  response.send(convertDbObejct(todo));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date)) === true) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const getAgendaQuery = `select * from todo where due_date LIKE '${formattedDate}';`;
    const agenda = await database.all(getAgendaQuery);
    const formattedData = agenda.map((each) => convertDbObejct(each));
    response.send(formattedData);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, dueDate, status, category, priority } = request.body;
  console.log(request.body);
  if (statusIsValid(request.body) === false) {
    response.status(400);
    response.send("Inavlid Todo Status");
  }
  if (priorityIsValid(request.body) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (categoryIsValid(request.body) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  }
  //const formattedDate = format(new Date(due_date), "yyyy-MM-dd");
  const AddTodoQuery = `insert into todo (id,todo,priority,status,category,due_date)
Values (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await database.run(AddTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(request.body);
  switch (true) {
    case requestBody.status !== undefined:
      if (statusIsValid(request.body) === false) {
        response.status(400);
        response.send("Inavlid Todo Status");
      }
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      if (priorityIsValid(request.body) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      updateColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      if (categoryIsValid(request.body) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      updateColumn = "Category";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.dueDate !== undefined:
      if (isValid(new Date(requestBody.dueDate)) === false) {
        response.status(400);
        response.send("Invalid Due Date");
      }
      updateColumn = "Due Date";
  }
  const previousTodoQuery = `select * from todo where Id=${todoId};`;
  const prevTodo = await database.get(previousTodoQuery);
  const {
    todo = prevTodo.todo,
    status = prevTodo.status,
    category = prevTodo.category,
    priority = prevTodo.priority,
    dueDate = prevTodo.due_date,
  } = request.body;
  console.log(todo, status, category, priority, dueDate);

  const updateTodoQuery = `update todo set todo='${todo}',status='${status}',
category='${category}',priority='${priority}',due_date=${dueDate} where id=${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const deleteTodoQuery = `Delete from todo where id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
