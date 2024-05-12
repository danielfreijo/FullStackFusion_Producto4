const { gql } = require('apollo-server-express');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const subscriptiones = require('../models/pubsub');

const pubsubTypeDefs = gql`
type Subscription {
    newMessage: String
  }
`;

const publicarsubscripcion = {
    Subscription: {
        newmessage: {
            async subscribe (_, __, { pubsub} ){
                return pubsub.asyncIterator("NEW_MESSAGE")
            }
        },
      },
};

module.exports = { publicarsubscripcion };