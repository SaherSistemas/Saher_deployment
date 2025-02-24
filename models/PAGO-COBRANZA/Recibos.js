const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const Recibos = sequelize.define('Recibo', {
    empcdempn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    rbocdrbon: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
        primaryKey: true,
    },
    rbofecred: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    rbofeccad: {
        type: DataTypes.DATEONLY,
        allowNull: true, //0001-01-01
    },
    rbofecapd: {
        type: DataTypes.DATEONLY,
        allowNull: true, //0001-01-01
    },
    rboimpden: {
        type: DataTypes.DECIMAL(13, 2),
        allowNull: false,
    },
    rbototren: {
        type: DataTypes.DECIMAL(13, 2),
        allowNull: true,
    },
    rbostatuc: {
        type: DataTypes.CHAR(1),
        allowNull: false,
    },
    rboctnfan: {
        type: DataTypes.DECIMAL(4, 0),
        allowNull: true,
    },
    rbofecpad: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    clicdclic: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    rbofolfic: {
        type: DataTypes.CHAR(20),
        allowNull: true,
    },
    rbouuidrc: {
        type: DataTypes.CHAR(36),
        allowNull: true,
    },
}, {
    tableName: 'recibos', // Cambia esto si la tabla tiene otro nombre
    timestamps: false, // Desactiva createdAt y updatedAt
    freezeTableName: true, // Evita pluralizar el nombre de la tabla
});

module.exports = Recibos;
