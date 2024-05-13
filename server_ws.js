const { createServer } = require('http');
const path = require('path');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { PubSub } = require('graphql-subscriptions');

// Definir tu esquema de GraphQL y resolvers
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

// Crear una instancia de ApolloServer
const app = express();
const httpServer = createServer(app);

const pubsub = new PubSub();

const schema = makeExecutableSchema({
  typeDefs,
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
  context: ({ req }) => ({ pubsub }), // pasando pubsub al contexto
});


await apolloServer.start();

// Aplicar el middleware de ApolloServer a Express
apolloServer.applyMiddleware({ app });

// Iniciar el servidor HTTP
httpServer.listen({ port: 4000 }, () => {
  console.log(`🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`);
});

// Crear el servidor de suscripciones WebSocket
const subscriptionServer = SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
  },
  {
    server: httpServer,
    path: apolloServer.graphqlPath,
  }
);

console.log(`🚀 Subscriptions ready at ws://localhost:4000${apolloServer.graphqlPath}`);
}

// Iniciar el servidor
startServer();
