const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const Recibos2 = sequelize.define('Recibo2', {
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
    rbonofacn: {
        type: DataTypes.DECIMAL(4, 0), //NUMERO DE FACTURAS PAGADAS 
        allowNull: false,
    },
    rbofactun: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
    },
    rbontcren: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
    },
    rboimpntn: {
        type: DataTypes.DECIMAL(13, 2),
        allowNull: true,
    },
    rboimppan: {
        type: DataTypes.DECIMAL(13, 2),
        allowNull: true,
    },
    rbofdigc: {
        type: DataTypes.CHAR(20),
        allowNull: true,
    },
    rbosaldon: {
        type: DataTypes.DECIMAL(13, 2),
        allowNull: true,
    },
}, {
    tableName: 'recibos2', // Cambia esto si la tabla tiene otro nombre
    timestamps: false, // Desactiva createdAt y updatedAt
    freezeTableName: true, // Evita pluralizar el nombre de la tabla
});

module.exports = Recibos2;
