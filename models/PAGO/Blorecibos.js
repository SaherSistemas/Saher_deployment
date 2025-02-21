const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const Blorecibos = sequelize.define('blorecibo', {
    empcdempn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    blofolinn: {
        type: DataTypes.NUMBER(10, 0),
        allowNull: false,
    },
    agecdagen: {
        type: DataTypes.SMALLINT,
        allowNull: false,
    },
    blofecend: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    blofecfid: {
        type: DataTypes.DATE,
        allowNull: true, //0001-01-01
    },
    blofolfin: {
        type: DataTypes.NUMBER(10, 0),
        allowNull: false,
    },
    blostatuc: {
        type: DataTypes.CHAR(1),
        allowNull: false,
    },
    blototfon: {
        type: DataTypes.SMALLINT,
        allowNull: false,
    },
    blousuidc: {
        type: DataTypes.CHAR(20),
        allowNull: false,
    },
}, {
    tableName: 'blorecibos', // Cambia esto si la tabla tiene otro nombre
    timestamps: false, // Desactiva createdAt y updatedAt
    freezeTableName: true, // Evita pluralizar el nombre de la tabla
});

module.exports = Blorecibos;
