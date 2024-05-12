const { gql } = require('apollo-server-express');
const task = require('../models/task');
const pubsub = require('../pubsub')

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
        taskCreated: Task
        taskUpdated: Task
        taskDeleted: ID
        newMessage: String
    }
`;

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
        createTask: async (_, { input }, { pubsub })  => {
            if (input.title.trim() === '' || input.description.trim() === '') {
                throw new Error('Este campo de la tarea no puede estar vacío.');
            }
            try {
                const newTask = new task({ ...input });
                const savedTask = await newTask.save();
                pubsub.publish('TASK_CREATED', { taskCreated: savedTask });
                return savedTask;
            } catch (error) {
                console.log(error);
                //console.log("entrado en el catch");
                throw new Error('Error al crear la tarea.');
            }
        },

        updateTask: async (_, { id, input }, { pubsub }) => {
            try {
                const updatedTask = await task.findByIdAndUpdate(id, input, { new: true });
                pubsub.publish('TASK_UPDATED', { taskUpdated: updatedTask });
                return updatedTask;
            } catch (error) {
                throw new Error('Error al actualizar la tarea.');
            }
        },

        deleteTask: async (_, { id }, { pubsub }) => {
            try {
                await task.findByIdAndDelete(id);
                pubsub.publish('TASK_DELETED', { taskDeleted: id });
                return 'Tarea eliminada correctamente.';
            } catch (error) {
                throw new Error('Error al eliminar la tarea.');
            }
        },
    },
    
    Subscription: {
        taskCreated: {
            subscribe: () => pubsub.asyncIterator('TASK_CREATED')
        },
        taskUpdated: {
            subscribe: () => pubsub.asyncIterator('TASK_UPDATED')
        },
        taskDeleted: {
            subscribe: () => pubsub.asyncIterator('TASK_DELETED')
        }
    }
};

module.exports = { taskTypeDefs, taskResolvers };