const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const iva = sequelize.define('iva', {
    ivacdivan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    ivadescrc: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    ivaporcen: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    ivacvsatc: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    ivaretiec: {
        type: DataTypes.STRING(1),
        allowNull: false,
    },
    ivatraslc: {
        type: DataTypes.STRING(1),
        allowNull: false,
    },
    ivadssatc: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
}, {
    tableName: 'iva',
    timestamps: false// Desactiva la creación de las columnas createdAt y updatedAt
})


module.exports = iva;