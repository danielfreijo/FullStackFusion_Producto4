const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { ApolloServer } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { execute, subscribe } = require('graphql');
const { Server } = require('socket.io');

// Define tu esquema de GraphQL y resolvers
const typeDefs = `
  type Query {
    hello: String
  }
  type Subscription {
    newMessage: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
  Subscription: {
    newMessage: {
      subscribe: () => pubsub.asyncIterator(['NEW_MESSAGE']),
    },
  },
};

// Crea una instancia de PubSub
const pubsub = new PubSub();

// Crea una instancia de Express y un servidor HTTP
const app = express();
const httpServer = createServer(app);

// Crea una instancia de ApolloServer
const schema = makeExecutableSchema({ typeDefs, 
resolvers,
  subscriptions: {
    keepAlive: 9000,
    onConnect: (connParams, webSocket, context) => {
        console.log('CLIENT CONNECTED');
    },
    onDisconnect: (webSocket, context) => {
        console.log('CLIENT DISCONNECTED')
    }
  },
 });


// Función asincrónica para iniciar el servidor Apollo
async function startServer() {

 const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => ({ req, pubsub }), // Pasando pubsub al contexto de ApolloServer
});

await apolloServer.start();
 
// Aplica el middleware de ApolloServer a Express
apolloServer.applyMiddleware({ app });

// Inicia el servidor HTTP
httpServer.listen({ port: 4000 }, () => {
  console.log(`🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`);
});

// Crea una instancia de Socket.IO y maneja las conexiones
const io = new Server(httpServer);
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Maneja los eventos de suscripción GraphQL
  socket.on('subscribe', ({ query }) => {
    console.log('Subscribe event received');
    
    // Ejecuta la consulta GraphQL y suscríbete al resultado
    execute(schema, query).then((result) => {
      if (result.errors) {
        console.error('Error executing GraphQL query:', result.errors);
        return;
      }
      
      const observable = subscribe(schema, result.query);
      observable.subscribe({
        next: (data) => {
          console.log('Subscription data:', data);
          socket.emit('subscriptionData', data);
        },
        error: (err) => {
          console.error('Error with subscription:', err);
        },
      });
    });
  });
});

}

// Iniciar el servidor
startServer();
