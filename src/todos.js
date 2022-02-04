const Router = require("koa-router")

const router = Router({ prefix: "/todos" })
const { getDB } = require("./database")
const { ObjectId } = require("mongodb")

router
    .get("/", listTodos)
    .post("/", createTodo)
    .put("/:id", updateTodo)
    .del("/:id", deleteTodo)

async function listTodos (ctx) {
    const todos = await getDB()
        .collection("todos")
        .find({})
        .sort({ _id: 1 })
        .toArray()

    ctx.body = todos
}

async function createTodo (ctx) {
    const title = ctx.request.body.title

    if (title === null || title === undefined) {
        ctx.status = 422
        ctx.body = { errorMsg: "Missing parameter 'title'" }
    } else {
        const result = await getDB().collection("todos").insertOne({
            title,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        ctx.body = { id: result.insertedId }
    }
}

async function deleteTodo(ctx) {
    const id = ctx.params.id
    if (!ObjectId.isValid(id)) {
        ctx.status = 400;
        ctx.body = { errorMsg: "Invalid id" };
    }
    else {
        await getDB().collection("todos").deleteOne({ _id: ObjectId(id) })
        ctx.body = { id }
    }
}

async function updateTodo (ctx) {
    const id = ctx.params.id
    if (!ObjectId.isValid(id)) {
        ctx.status = 400;
        ctx.body = { errorMsg: "Invalid id" };
    }
    else {
        let todo = await getDB().collection("todos").findOne({ _id: ObjectId(id) })
        if (todo == null || todo == undefined) {
            ctx.status = 400;
            ctx.body = { errorMsg: "No record correspondint to given id was found" };
        }
        else {
            todo = ctx.request.body;
            delete todo.createdAt;
            delete todo.updatedAt;
            getDB().collection("todos").updateOne({ _id: ObjectId(id) }, { $set: todo })
            ctx.body = { id }
        }
    }
}

module.exports = router
