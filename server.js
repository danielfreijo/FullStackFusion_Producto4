// Importación de módulos y configuraciones necesarias
const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { ApolloServer } = require('apollo-server-express');
const { subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { projectTypeDefs, projectResolvers } = require('./controllers/projectsController');
const { taskTypeDefs, taskResolvers } = require('./controllers/tasksController');
const { connection } = require('./config/connectionDB');
const pubsub = require('./pubsub');
const multer = require('multer');
const { WebSocketServer } = require('ws');
const { parse } = require('graphql');


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
const PORT = process.env.PORT || 4000;

// Definición del esquema de GraphQL
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
  transports: ['websocket', 'polling']
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

// Configuración del servidor WebSocket para GraphQL
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/api/subscriptions',
});

// Manejamos las conexiones entrantes al servidor WebSocket
wsServer.on('connection', (ws) => {
  console.log('WebSocket conexión establecida');

  ws.on('message', async (message) => {
    const parsedMessage = JSON.parse(message);

    switch (parsedMessage.type) {
      case 'start':
        const { payload } = parsedMessage;
        const data = {
          variables: payload.variables,
          extensions: {},
          operationName: payload.operationName,
          query: payload.query,
        };

        let document;
        try {
          document = parse(data.query);
        } catch (error) {
          console.error('Error al analizar la consulta GraphQL:', error);
          process.exit(1);
        }

        const subscription = subscribe({
          schema,
          document,
          variableValues: data.variables,
          contextValue: { pubsub },
        });

        subscription.then(async (result) => {
          for await (const data of result) {
            ws.send(JSON.stringify(data.data));
          }
        }).catch(error => {
          console.error('Error en la suscripción:', error);
        });
        break;
      default:
        console.log('Unsupported message type:', parsedMessage.type);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Error en el servidor al crear el túnel.' }));
  });

  ws.on('close', () => {
    console.log('se cerró el túnel del WebSocket');
  });
});


// Función asincrónica para iniciar el servidor Apollo
async function startServer() {
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res, pubsub }),
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              wsServer.close();
            },
          };
        },
      },
    ],
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/api' });

  // Middleware para manejar rutas no encontradas
  app.use((req, res, next) => {
    res.status(404).send('Error 404');
  });

  // Configuración del puerto de escucha del servidor
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
