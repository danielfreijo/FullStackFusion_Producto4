import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP connection to the API
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/api',  // Asegúrate de que este es el endpoint correcto para las consultas y mutaciones
});

// WebSocket link for subscriptions
const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,  // Asegúrate que esto apunta a la ruta correcta para suscripciones
  options: {
    reconnect: true,
  }
});

// Usar split para dirigir las consultas a su respectivo link dependiendo del tipo de operación
const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
});

export default client;
