const tap = require("tap");
const supertest = require("supertest");
const app = require("../app");
const server = supertest(app);

let organizerToken;
let attendeeToken;
let createdEventId;

// --- USER TESTS ---

tap.test("POST /register organizer", async (t) => {
  const response = await server.post("/register").send({
    username: "organizer1",
    email: "organizer@example.com",
    password: "password123",
    role: "organizer"
  });
  t.equal(response.status, 201);
  t.end();
});

tap.test("POST /login organizer", async (t) => {
  const response = await server.post("/login").send({
    email: "organizer@example.com",
    password: "password123"
  });
  t.equal(response.status, 200);
  organizerToken = response.body.token;
  t.ok(organizerToken, "Organizer token should exist");
  t.end();
});

tap.test("POST /register attendee", async (t) => {
  const response = await server.post("/register").send({
    username: "attendee1",
    email: "attendee@example.com",
    password: "password123",
    role: "attendee"
  });
  t.equal(response.status, 201);
  t.end();
});

tap.test("POST /login attendee", async (t) => {
  const response = await server.post("/login").send({
    email: "attendee@example.com",
    password: "password123"
  });
  t.equal(response.status, 200);
  attendeeToken = response.body.token;
  t.ok(attendeeToken, "Attendee token should exist");
  t.end();
});

// --- EVENT TESTS ---

tap.test("POST /events (organizer creates event)", async (t) => {
  const response = await server
    .post("/events")
    .set("Authorization", `Bearer ${organizerToken}`)
    .send({
      title: "AI Conference",
      date: "2026-03-25",
      time: "10:00",
      description: "Virtual AI event"
    });
  t.equal(response.status, 201);
  createdEventId = response.body.event.id;
  t.ok(createdEventId, "Event ID should be set");
  t.end();
});

tap.test("GET /events (authenticated user)", async (t) => {
  const response = await server
    .get("/events")
    .set("Authorization", `Bearer ${attendeeToken}`);
  t.equal(response.status, 200);
  t.type(response.body, Array);
  t.end();
});

tap.test("PUT /events/:id (organizer updates event)", async (t) => {
  const response = await server
    .put(`/events/${createdEventId}`)
    .set("Authorization", `Bearer ${organizerToken}`)
    .send({ title: "Updated AI Conference" });
  t.equal(response.status, 200);
  t.match(response.body.event.title, "Updated AI Conference");
  t.end();
});

tap.test("POST /events/:id/register (attendee registers)", async (t) => {
  const response = await server
    .post(`/events/${createdEventId}/register`)
    .set("Authorization", `Bearer ${attendeeToken}`);
  t.equal(response.status, 200);
  t.match(response.body.message, "Registered successfully");
  t.end();
});

tap.test("DELETE /events/:id (organizer deletes event)", async (t) => {
  const response = await server
    .delete(`/events/${createdEventId}`)
    .set("Authorization", `Bearer ${organizerToken}`);
  t.equal(response.status, 200);
  t.match(response.body.message, "Event deleted successfully");
  t.end();
});


tap.teardown(() => {
  process.exit(0);
});
