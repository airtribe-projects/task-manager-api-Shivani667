const tap = require("tap");
const supertest = require("supertest");
const app = require("../app");
const server = supertest(app);

tap.test("POST /tasks", async (t) => {
  const newTask = { title: "New Task", description: "This is a test task" };
  const response = await server.post("/tasks").send(newTask);
  t.equal(response.status, 201);
  t.hasOwnProp(response.body, "id");
  t.hasOwnProp(response.body, "title");
  t.hasOwnProp(response.body, "description");
  t.hasOwnProp(response.body, "completed");
  t.type(response.body.id, "number");
  t.type(response.body.title, "string");
  t.type(response.body.description, "string");
  t.type(response.body.completed, "boolean");
  t.end();
});

tap.test("POST /tasks with invalid data", async (t) => {
  const invalidTask = { title: 123, description: "Valid description" }; // invalid title
  const response = await server.post("/tasks").send(invalidTask);
  t.equal(response.status, 400);

  const missingDesc = { title: "Task without description" }; // missing description
  const response2 = await server.post("/tasks").send(missingDesc);
  t.equal(response2.status, 400);
  t.end();
});


tap.test("GET /tasks", async (t) => {
  const response = await server.get("/tasks");
  t.equal(response.status, 200);
  t.type(response.body, Array);
  t.end();
});

tap.test("GET /tasks/:id valid", async (t) => {
  const createRes = await server.post("/tasks").send({ 
    title: "Task 1", 
    description: "First task description" 
  });
  const taskId = createRes.body.id;

  const response = await server.get(`/tasks/${taskId}`);
  t.equal(response.status, 200);
  t.match(response.body, { 
    id: taskId, 
    title: "Task 1", 
    description: "First task description", 
    completed: false 
  });
  t.end();
});


tap.test("GET /tasks/:id invalid", async (t) => {
  const response = await server.get("/tasks/999");
  t.equal(response.status, 404);
  t.end();
});

tap.test("PUT /tasks/:id valid", async (t) => {
  const createRes = await server.post("/tasks").send({ 
    title: "Task 2", 
    description: "Second task description" 
  });
  const taskId = createRes.body.id;

  const updatedTask = { 
    title: "Updated Task", 
    description: "Updated description", 
    completed: true 
  };
  const response = await server.put(`/tasks/${taskId}`).send(updatedTask);
  t.equal(response.status, 200);
  t.match(response.body, { 
    id: taskId, 
    title: "Updated Task", 
    description: "Updated description", 
    completed: true 
  });
  t.end();
});

tap.test("PUT /tasks/:id invalid id", async (t) => {
  const response = await server.put("/tasks/999").send({ title: "Updated" });
  t.equal(response.status, 404);
  t.end();
});

tap.test("PUT /tasks/:id invalid data", async (t) => {
  // Create with both title and description
  const createRes = await server.post("/tasks").send({ 
    title: "Task 3", 
    description: "Third task description" 
  });
  const taskId = createRes.body.id;

  // Try invalid update
  const response = await server.put(`/tasks/${taskId}`).send({ completed: "true" });
  t.equal(response.status, 400);
  t.end();
});


tap.test("DELETE /tasks/:id valid", async (t) => {
  // Create with both title and description
  const createRes = await server.post("/tasks").send({ 
    title: "Task 4", 
    description: "Fourth task description" 
  });
  const taskId = createRes.body.id;

  const response = await server.delete(`/tasks/${taskId}`);
  t.equal(response.status, 200);
  t.end();
});


tap.test("DELETE /tasks/:id invalid id", async (t) => {
  const response = await server.delete("/tasks/999");
  t.equal(response.status, 404);
  t.end();
});

tap.teardown(() => {
  process.exit(0);
});