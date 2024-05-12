const { Schema, model } = require('mongoose');

const pubsubSchema = new Schema({
    newMessage: {
        type: String,
    },
}); 