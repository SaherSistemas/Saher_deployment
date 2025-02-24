const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const Bancos = sequelize.define('banco', {
    bancdbann: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    bandsbann: {
        type: DataTypes.CHAR(50),
        allowNull: false,
    },
    banctabanc: {
        type: DataTypes.CHAR(20),
        allowNull: false,
    },
    banclabec: {
        type: DataTypes.CHAR(18),
        allowNull: true,
    },
    bancvsatn: {
        type: DataTypes.NUMBER(10),
        allowNull: true, //0001-01-01
    },
    banrfcbac: {
        type: DataTypes.CHAR(15),
        allowNull: false,
    },
}, {
    tableName: 'bancos', // Cambia esto si la tabla tiene otro nombre
    timestamps: false, // Desactiva createdAt y updatedAt
    freezeTableName: true, // Evita pluralizar el nombre de la tabla
});

module.exports = Bancos;
