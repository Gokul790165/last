
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'


type Todo = {
  id: Number
  text: string
  done: boolean
  date: string      
  endDate: string   
}

let ID_COUNTER = 1;




let todos: Todo[] = [
  {
   id: ID_COUNTER++,
    text: "hlo",
    done: false,
    date: "2-2-2026",
    endDate: "4-2-2026"
  }
]

export const app = new Hono()


app.use('*', logger())


app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}))


app.get('/', (c) => {
  return c.json(todos)
})


app.post('/todos', async (c) => {
  const body = await c.req.json()

  const newTodo: Todo = {
    id: ID_COUNTER++ ,
    text: body.text,
    done: false,   
    date: body.date,           
    endDate: body.endDate,     
  }

  todos.push(newTodo)

  return c.json({ success: true, data: newTodo }, 201)
})


app.put('/todos/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  
const index = todos.findIndex(t => String(t.id) === String(id))


  if (index === -1) {
    return c.json({ success: false, message: 'Todo not found' }, 404)
  }

 
  todos[index] = {
    id: todos[index].id,  
    text: body.text,
    done: body.done,
    date: body.date,      
    endDate: body.endDate,
  }

  return c.json({ success: true, data: todos[index] })
})


app.patch('/todos/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const todo = todos.find(t => String(t.id) === String(id))

  if (!todo) {
    return c.json({ success: false, message: 'Todo not found' }, 404)
  }

  if (body.text !== undefined) todo.text = body.text
  if (body.done !== undefined) todo.done = body.done
  if (body.date !== undefined) todo.date = body.date
  if (body.endDate !== undefined) todo.endDate = body.endDate

  return c.json({ success: true, data: todo })
})

app.delete('/todos/:id', (c) => {
const id = c.req.param('id')
const prevLength = todos.length
todos = todos.filter(t =>String(t.id) !== String(id))

if (todos.length === prevLength) {
  return c.json({ success: false, message: 'Todo not found' }, 404)
 }

  return c.json({ success: true, message: 'Todo deleted' })
 })
const port = 4000

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 Todo API running on http://localhost:${port}`)

