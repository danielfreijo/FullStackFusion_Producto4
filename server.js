const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { ApolloServer } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const { execute, subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');
const { SubscriptionServer } = require('subscriptions-transport-ws');

// Importar controladores y configuraciones
const { projectTypeDefs, projectResolvers } = require('./controllers/projectsController');
const { taskTypeDefs, taskResolvers } = require('./controllers/tasksController');
const { pubTypeDefs, pubResolvers } = require('./controllers/pubsubController');
const { connection } = require('./config/connectionDB');

// Configuración de multer para la carga de archivos
/*
const upload = multer({ storage: storage });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'front/documents');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
  }
});
*/

// Crear instancia de PubSub
const pubsub = new PubSub();

// Configurar aplicación Express
const app = express();
const publicPath = path.join(__dirname, 'front');
app.use(express.static(path.join(publicPath)));
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Conectar a la base de datos
connection();

// Crear servidor HTTP
const httpServer = createServer(app);

// Crear servidor WebSocket independiente
const wsServer = new WebSocketServer({ server: httpServer });

// Crear servidor Socket.IO
const io = new Server(httpServer, { path: '/socket.io' });

// Manejar conexiones de Socket.IO
io.on("connection", (socket) => {
  // Aquí manejas las conexiones de Socket.IO según sea necesario
});

// Crear esquema GraphQL
const schema = makeExecutableSchema({
  typeDefs: [projectTypeDefs, taskTypeDefs, pubTypeDefs],
  resolvers: {
    Query: { ...projectResolvers.Query, ...taskResolvers.Query, ...pubResolvers.Query },
    Mutation: { ...projectResolvers.Mutation, ...taskResolvers.Mutation, ...pubResolvers.Mutation },
    Subscription: { ...projectResolvers.Subscription, ...taskResolvers.Subscription, ...pubResolvers.Subscription },
  },
  playground: { subscriptionEndpoint: 'http://localhost:4000/api/subscriptions' },
  subscriptions: {
    onConnect: (connectionParams, webSocket, context) => {
      console.log('Client connected for subscriptions');
    },
    onDisconnect: (webSocket, context) => {
      console.log('Client disconnected from subscriptions');
    },
  },
});

// Iniciar servidor Apollo
async function startServer() {
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({ req, pubsub, io }), // Pasar pubsub y io al contexto de ApolloServer
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/api' });

  // Configurar servidor de suscripciones GraphQL
  const subscriptionServer = SubscriptionServer.create({
    schema,
    execute,
    subscribe,
    onConnect: () => console.log('Client connected for subscriptions'),
    onDisconnect: () => console.log('Client disconnected from subscriptions'),
  }, {
    server: httpServer,
    path: '/api/subscriptions',
  });

  // Configurar puerto de escucha del servidor HTTP
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/api/subscriptions`);
  });

  // Manejar rutas no encontradas
  app.use((req, res, next) => {
    res.status(404).send('Error 404');
  });
}

// Iniciar el servidor
startServer();

// Ruta para cargar archivos

/* app.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    message: 'Archivo subido con éxito.',
    path: req.file.path
  });
});
*/