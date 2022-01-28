const { ObjectId } = require("mongodb")
const supertest = require("supertest")
const app = require("../src/app")
const { connectToDB, closeConnection, getDB } = require("../src/database")

const request = supertest(app.callback())
const baseUrl = "/todos"

beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
    const MONGODB_DB = process.env.MONGODB_DB || 'mytodos-test'

    await connectToDB(MONGODB_URI, MONGODB_DB)
})

afterAll(async () => {
    closeConnection()
})

// Before each test, insert three todos
beforeEach(async () => {
    const db = getDB()
    await db.collection("todos").insertMany([
        {
            title: "Learn React",
        },
        {
            title: "todo 1",
        },
        {
            title: "todo 2",
        },
    ])
});

// afterEach empty the collection
afterEach(async () => {
    const db = getDB()
    await db.collection("todos").deleteMany({})
});

describe("GET /todos", () => {

    test("should respond with a 200 status code", async () => {
        const response = await request.get(baseUrl);
        expect(response.status).toBe(200);
    })

    test("should respond with JSON", async () => {
        const response = await request.get(baseUrl);
        expect(response.type).toBe("application/json");
    })

    test("should respond with list of existing todos", async () => {
        const response = await request.get(baseUrl);
        expect(response.body.map(e => e.title)).toEqual(["Learn React", "todo 1", "todo 2"]);
    })
})


describe('POST /todo', () => {
    test("should respond with correct values", async () => {
        const payload = { title: "Todo 100" };
        const response = await request.post(baseUrl).send(payload);

        expect(response.status).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.id).not.toEqual(null);

        // Verify that the todo was inserted
        const db = getDB();
        const todo = await db.collection("todos").findOne({ _id: ObjectId(response.body.id) });
        expect(todo.title).toEqual(payload.title);
    })

    test("should return 422 status", async () => {
        const payload = {};
        const response = await request.post(baseUrl).send(payload);

        expect(response.status).toBe(422);
        expect(response.type).toBe("application/json");
        expect(response.body.errorMsg).toEqual("Missing parameter 'title'");
    })
})

describe("DELETE /posts/id", () => {
    test("should respond with correct values", async () => {
        const db = getDB();
        const todo = await db.collection("todos").findOne({});
        const id = todo._id.toString();

        const response = await request.del(`${baseUrl}/${id}`);

        expect(response.status).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.id).toEqual(id);

        // Verify that the todo was deleted
        const todoAfterDelete = await db.collection("todos").findOne({ _id: ObjectId(id) });
        expect(todoAfterDelete).toBe(null);
    })
});

describe("Update /todos/id", () => {
    test("should respond with correct values", async () => {
        const db = getDB();
        const todo = await db.collection("todos").findOne({});
        const id = todo._id.toString();

        const payload = { title: "Todo 100" };
        const response = await request.put(`${baseUrl}/${id}`).send(payload);

        expect(response.status).toBe(200);
        expect(response.type).toBe("application/json");
        expect(response.body.id).toEqual(id);

        // Verify that the todo was updated
        const todoAfterUpdate = await db.collection("todos").findOne({ _id: ObjectId(id) });
        expect(todoAfterUpdate.title).toEqual(payload.title);
    })
});
