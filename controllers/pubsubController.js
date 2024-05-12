const { gql } = require('apollo-server-express');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const subscriptiones = require('../models/pubsub');

const POST_ADDED = 'POST_ADDED';

const pubTypeDefs = gql`
    type Subscription {
        postHello: String!
    }
    
    type Query {
        hello: String!
    }
    
    type Mutation {
        addHello(hello: String!): String!
    }
`;

const pubResolvers = {
    Subscription: {
        postHello: {
            subscribe: () => pubsub.asyncIterator([POST_ADDED])
        }
    },

    Query: {
        hello (obj, args) {
            const arr = ["aaaaaa", "bbbbb", "cccccccc"];
            return arr[args.id]
        }
    },

    Mutation: {
        async addHello (obj, args) {
            await pubsub.publish(POST_ADDED, {postHello: args.hello})
            return args.hello
        }
    }
};

module.exports = { pubTypeDefs, pubResolvers };