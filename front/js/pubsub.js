import { gql, useSubscription } from '@apollo/client';

// Utilizar la suscripción en un componente de React
function MessageList() {
  const { data, loading, error } = useSubscription(NEW_MESSAGE_SUBSCRIPTION);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <ul>
      {data.newMessage.map(({ id, content, author }) => (
        <li key={id}>
          <strong>{author}:</strong> {content}
        </li>
      ))}
    </ul>
  );
}

import { ApolloClient, InMemoryCache, split } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Crea un enlace HTTP
const httpLink = createHttpLink({
  uri: '/api', // Ruta de tu servidor GraphQL
});

// Crea un enlace WebSocket
const wsLink = new WebSocketLink({
  uri: `ws://${window.location.host}/subscriptions`, // Ruta de tus suscripciones WebSocket
  options: {
    reconnect: true,
  },
});

// Utiliza split para dividir las solicitudes entre el enlace HTTP y el enlace WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink,
);

// Crea el cliente de Apollo
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;