const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const catservicios = sequelize.define('catservicios', {
    satclavec: {
        type: DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true,
    },
    satdsserc: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    sativaden: {
        type: DataTypes.NUMBER(1,0),
        allowNull: true,
    }
}, {
    tableName: 'catservicios',
    timestamps: false// Desactiva la creación de las columnas createdAt y updatedAt
})


module.exports = catservicios;