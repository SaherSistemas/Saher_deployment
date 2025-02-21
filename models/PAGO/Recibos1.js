const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const Recibos1 = sequelize.define('Recibo1', {
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
    rbonummon: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
    },
    rbotipdocc: {
        type: DataTypes.CHAR(1),
        allowNull: false,
    },
    rbocdbann: {
        type: DataTypes.DECIMAL(4, 0),
        allowNull: true, //BANCOS
    },
    rboimdepn: {
        type: DataTypes.DATEONLY,
        allowNull: true, //0001-01-01
    },
}, {
    tableName: 'recibos1', // Cambia esto si la tabla tiene otro nombre
    timestamps: false, // Desactiva createdAt y updatedAt
    freezeTableName: true, // Evita pluralizar el nombre de la tabla
});

module.exports = Recibos1;
