// subscriptions.js
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',  // Cambia esto por la URL correcta de tu servidor GraphQL
});

export function subscribeToProjects(onProjectReceived) {
    const query = `subscription {
        projectCreated {
            id
            name
            description
        }
    }`;

    return client.subscribe(
        { query },
        {
            next: data => {
                console.log('Data received:', data);
                onProjectReceived(data.data.projectCreated);
            },
            error: err => console.error('Subscription error:', err),
            complete: () => console.log('Subscription complete'),
        }
    );
}
