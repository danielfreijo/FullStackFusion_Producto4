const { gql } = require('apollo-server-express');
const Project = require('../models/project');

const projectTypeDefs = gql`

    type Project {
        id: ID!
        name: String!
        description: String!
        department: String
        backgroundcolor: String
        backgroundimage: String
        backgroundcolorcard: String
        backgroundcard: String
        priority: Boolean
        dateaccess: String
    }

    input ProjectInput {
        name: String
        description: String
        department: String
        backgroundcolor: String
        backgroundimage: String
        backgroundcolorcard: String
        backgroundcard: String
        priority: Boolean
        dateaccess: String
    }

    type Query {
        getProjects: [Project]
        getProject(id: ID!): Project
    }

    type Mutation {
        createProject(input: ProjectInput!): Project
        updateProject(id: ID!, input: ProjectInput!): Project
        deleteProject(id: ID!): String
    }

    type Subscription {
        projectCreated: Project
        projectUpdated: Project
        projectDeleted: ID
    }
`;

const projectResolvers = {
    Query: {
        getProjects: async () => {
            return await Project.find({});
        },
        getProject: async (_, { id }) => {
            return await Project.findById(id);
        },
    },
    
    Mutation: {
        createProject: async (_, { input }, { pubsub }) => {
            if (input.name.trim() === '' || input.description.trim() === '') {
                throw new Error('Este campo del proyecto no puede estar vacío.');
            }
            try {
                const project = new Project(input);
                const createdProject = await project.save();
                pubsub.publish('PROJECT_CREATED', { projectCreated: createdProject });
                return createdProject;
            } catch (error) {
                throw new Error('Error al crear el proyecto: ' + error.message);
            }
        },

        updateProject: async (_, { id, input }, { pubsub }) => {
            try {
                const updatedProject = await Project.findByIdAndUpdate(id, input, { new: true });
                pubsub.publish('PROJECT_UPDATED', { projectUpdated: updatedProject });
                return updatedProject;
            }catch (error) {
                throw new Error('Error al actualizar el proyecto: ' + error.message);
            }
        },

        deleteProject: async (_, { id }, { pubsub }) => {
            try{
                await Project.findByIdAndDelete(id);
                pubsub.publish('PROJECT_DELETED', { projectDeleted: id });
                return 'Proyecto eliminado correctamente.';
            }catch (error) {
                throw new Error('Error al eliminar el proyecto: ' + error.message);
            }
        },
    },

    Subscription: {
        projectCreated: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('PROJECT_CREATED')
        },
        projectUpdated: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('PROJECT_UPDATED')
        },
        projectDeleted: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('PROJECT_DELETED')
        },
    },
};

module.exports = { projectTypeDefs, projectResolvers };
