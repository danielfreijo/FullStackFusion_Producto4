const { gql } = require('apollo-server-express');
const task = require('../models/task');
const { PubSub }  = require('graphql-subscriptions');
const taskTypeDefs = gql`

    type Task {
        id: ID!
        project_id: ID!
        title: String!
        description: String!
        responsible: [String]
        enddate: String!
        ended: Boolean
        notes: String
        status: String
        pathFile: String
    }

    input TaskInput {
        project_id: ID
        title: String
        description: String
        responsible: [String]
        enddate: String
        ended: Boolean
        notes: String
        status: String
        pathFile: String
    }

    type Query {
        getTasksByProjectId(projectId: ID!): [Task]
        getTask(id: ID!): Task
    }       

    type Mutation {
        createTask(input: TaskInput!): Task
        updateTask(id: ID!, input: TaskInput!): Task
        deleteTask(id: ID!): String
    }

    type Subscription {
        taskAdded: String
        # taskAdded: Task
    }
`;

const pubSub = new PubSub();
const taskResolvers = { 
    Query: {
        getTasksByProjectId: async (_, { projectId }) => {
            return await task.find({ project_id: projectId});
        },
        getTask: async (_, { id }) => {
            return await task
                .findById(id)
                .populate('project_id');    
        }
    },

    Mutation: { 
        createTask: async (_, { input }, { pubsub }) => {
            if (input.title.trim() === '' || input.description.trim() === '') {
                throw new Error('Este campo de la tarea no puede estar vacío.');
            }
            try {
                //console.log(input);
                //console.log("entrado en el try");
                const newTask = new task({ ...input });
                console.log("se deberia llamar a pubsub.publish('TASK_ADDED', { taskAdded: newTask })");                
                await newTask.save();
                pubSub.publish('TASK_ADDED',
                
                 { taskAdded: "Tarea creada, mensaje desde pubSub." }); // \{ taskAdded: newTask }
                return newTask;
            } catch (error) {
                console.log(error);
                //console.log("entrado en el catch");
                throw new Error('Error al crear la tarea.');
            }
        },
        updateTask: async (_, { id, input }) => {
            try {
                return await task.findByIdAndUpdate(id, input, { new: true });
            } catch (error) {
                throw new Error('Error al actualizar la tarea.');
            }
        },
        deleteTask: async (_, { id }) => {
            try {
                await task.findByIdAndDelete(id);
                return 'Tarea eliminada correctamente.';
            } catch (error) {
                throw new Error('Error al eliminar la tarea.');
            }
        }
    },
    Subscription: {
        taskAdded: {
            subscribe: () => pubSub.asyncIterator('TASK_ADDED'),
        }
    }
};

module.exports = { taskTypeDefs, taskResolvers };