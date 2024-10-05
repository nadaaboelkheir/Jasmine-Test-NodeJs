const request = require("supertest");
const app = require("../..");
const { clearDatabase } = require("../../db.connection");

const req = request(app);

describe("lab testing:", () => {
  let mockUser;
  let userToken;
  let todoInDB;

  beforeAll(async () => {
    mockUser = {
      name: "Ali",
      email: "asd@asd.com",
      password: "1234",
    };

    await req.post("/user/signup").send(mockUser);
    const res = await req.post("/user/login").send(mockUser);
    userToken = res.body.data;
  });

  afterAll(async () => {
    await clearDatabase();
  });

  describe("users routes:", () => {
    it("req to get(/user/search), expect to get the correct user with his name", async () => {
      const res = await req.get("/user/search").query({ name: mockUser.name });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(mockUser.name);
    });

    it("req to get(/user/search) with invalid name, expect res status and message", async () => {
      const res = await req.get("/user/search").query({ name: "xxx" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("There is no user with name: xxx");
    });
  });

  describe("todos routes:", () => {
    it("req to patch(/todo/) with id only, expect res status and message", async () => {
      const todoRes = await req
        .post("/todo")
        .send({ title: "Morning workout" })
        .set({ authorization: userToken });
      //   console.log("todoRes: ", todoRes.body);
      todoInDB = todoRes.body.data;

      const res = await req
        .patch(`/todo/${todoInDB._id}`)
        .set({ authorization: userToken });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("must provide title and id to edit todo");
    });

    it("req to patch(/todo/) with id and title, expect res status and updated todo", async () => {
      const res = await req
        .patch(`/todo/${todoInDB._id}`)
        .send({ title: "Evening workout" })
        .set({ authorization: userToken });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Evening workout");
    });

    it("req to get(/todo/user), expect to get all user's todos", async () => {
      const res = await req.get("/todo/user").set({ authorization: userToken });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("req to get(/todo/user), expect no todos for user with no todos", async () => {
      const newUser = {
        name: "NewUser",
        email: "new@user.com",
        password: "1234",
      };

      await req.post("/user/signup").send(newUser);
      const newLoginRes = await req.post("/user/login").send(newUser);
      const newUserToken = newLoginRes.body.data;

      const res = await req
        .get("/todo/user")
        .set({ authorization: newUserToken });

      expect(res.status).toBe(200);
    });
  });
});
