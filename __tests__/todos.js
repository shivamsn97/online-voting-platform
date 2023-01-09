/* eslint-disable no-unused-vars */
const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCSRFToken(res) {
  var $ = cheerio.load(res.text);
  return $('input[name="_csrf"]').val();
}

async function login(agent, email, password) {
  let res = await agent.get("/login");
  const csrfToken = extractCSRFToken(res);
  res = await agent.post("/session").send({
    email: email,
    password: password,
    _csrf: csrfToken,
  });
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Dummy test", async () => {
    expect(1).toBe(1);
  });
});
