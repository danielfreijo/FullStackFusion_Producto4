//var exampleWS = new WebSocket("ws://localhost:4000/api/subscriptions", "protocolOne");

document.addEventListener('DOMContentLoaded', function() {
    const { ApolloClient, InMemoryCache, HttpLink, split } = window.ApolloClient;
    const { WebSocketLink } = window.ApolloClient.link.ws;
    const { getMainDefinition } = window.ApolloClient.utilities;

    // WebSocket link for subscriptions
    const wsLink = new WebSocketLink({
        uri: 'ws://localhost:4000/api/subscriptions', 
        options: {
            reconnect: true 
        }
    });

    // HTTP link for normal queries and mutations
    const httpLink = new HttpLink({
        uri: 'http://localhost:4000/api',
    });

    const splitLink = split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === 'OperationDefinition' && 
                definition.operation === 'subscription'
            );
        },
        wsLink, 
        httpLink, 
    );

    const client = new ApolloClient({
        link: splitLink,
        cache: new InMemoryCache()
    });

    window.apolloClient = client;

});