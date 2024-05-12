const { Schema, model } = require('mongoose');

const projectSchema = new Schema({
    /*_id: Schema.Types.ObjectId, esto es agregado automaticamente por Mongoose*/
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        enum: ['Desarrollo', 'Diseño', 'Marketing'], 
        default: 'Desarrollo',
    },
    backgroundcolor: {
        type: String,
        default: '#000000',
    },
    backgroundimage: {
        type: String,
        default: "",
    },
    backgroundcolorcard: {
        type: String,
        default: '#000000',
    },
    backgroundcard: {
        type: String,
        default: "",
    },  
    priority: {
        type: Boolean,
        default: false, 
    },
    dateaccess: {
        type: Date,
        default: Date.now,
    },
});

module.exports = model('Project', projectSchema);
    