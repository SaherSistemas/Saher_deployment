const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const clasificacion = sequelize.define('clasificacion', {
    artclasic: {
        type: DataTypes.STRING(1),
        allowNull: false,
        primaryKey: true,
    },
    artcladsc: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    artclaapc: {
        type: DataTypes.STRING(1),
        allowNull: true,
    },
    artporcon: {
        type: DataTypes.NUMBER(5,2),
        allowNull: false,
    },
}, {
    tableName: 'clasificacion',
    timestamps: false// Desactiva la creación de las columnas createdAt y updatedAt
})


module.exports = clasificacion;