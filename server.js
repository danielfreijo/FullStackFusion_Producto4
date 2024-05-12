// Importación de módulos y configuraciones necesarias
const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { ApolloServer } = require('apollo-server-express');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { projectTypeDefs, projectResolvers } = require('./controllers/projectsController');
const { taskTypeDefs, taskResolvers } = require('./controllers/tasksController');
const { connection } = require('./config/connectionDB');
const { WebSocketServer } = require('ws');
const pubsub = require('./pubsub');
const multer = require('multer');
//console.log("PubSub instance:", pubsub);

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'front/documents');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Creación de la aplicación Express
const app = express();

// Conexión a la base de datos
connection();

// Middleware para servir archivos estáticos
const publicPath = path.join(__dirname, 'front');
app.use(express.static(path.join(publicPath)));
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Creación del servidor HTTP y del servidor de Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io'
});

// Manejo de conexiones de Socket.IO
io.on("connection", (socket) => {
  console.log("Usuario conectado");
  socket.on('mensaje', (mensaje) => {
    //console.log('Mensaje recibido:', mensaje);
    io.emit('mensaje', mensaje);
  });
  socket.on("disconnect", () => {
    console.log("Usuario desconectado");
  });
});

const schema = makeExecutableSchema({
  typeDefs: [projectTypeDefs, taskTypeDefs],
  resolvers: {
    Query: {
      ...projectResolvers.Query,
      ...taskResolvers.Query
    },
    Mutation: {
      ...projectResolvers.Mutation,
      ...taskResolvers.Mutation
    },
    Subscription: {
      ...projectResolvers.Subscription,
      ...taskResolvers.Subscription
    }
  },
});

// Función asincrónica para iniciar el servidor Apollo
async function startServer() {
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({ req, pubsub, io }) 
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/api' });

  // Configuración de SubscriptionServer
  SubscriptionServer.create({
    schema,
    execute,
    subscribe,
    onConnect: () => console.log('Client connected for subscriptions'),
    onDisconnect: () => console.log('Client disconnected from subscriptions')
  }, {
    server: httpServer,
    path: '/api/subscriptions'
  });

  // Middleware para manejar rutas no encontradas
  app.use((req, res, next) => {
    res.status(404).send('Error 404');
  });

  // Configuración del puerto de escucha del servidor
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Ruta para la carga de archivos
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    message: 'Archivo subido con éxito.',
    path: req.file.path
  });
});

// Iniciar el servidor
startServer();
