const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const Agentes = sequelize.define('agentes', {
    agecdagen: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        primaryKey: true // Define la clave primaria como agecdagen
    },
    agedsagec: {
        type: DataTypes.CHAR(70),
        allowNull: true,
    },
    agecallec: {
        type: DataTypes.CHAR(70),
        allowNull: true,
    },
    ageentcac: {
        type: DataTypes.CHAR(70),
        allowNull: true,
    },
    agecdestn: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    agecdciun: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    agecdcoln: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    agetelefc: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    agecelulc: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    ageplazac: {
        type: DataTypes.CHAR(50),
        allowNull: true,
    },
    agecdgrpn: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    agestatuc: {
        type: DataTypes.CHAR(1),
        allowNull: true,
    },
    agefecald: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    agefecbad: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    agerutpec: {
        type: DataTypes.CHAR(150),
        allowNull: true,
    },
    agepresun: {
        type: DataTypes.NUMERIC(12, 2),
        allowNull: true,
    },
    ageprepzn: {
        type: DataTypes.NUMERIC(13, 4),
        allowNull: true,
    },
    agepreren: {
        type: DataTypes.NUMERIC(10, 0),
        allowNull: true,
    },
    agecvalmn: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    agecolunn: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    agecolnoc: {
        type: DataTypes.CHAR(10),
        allowNull: true,
    },
    agevalgun: {
        type: DataTypes.NUMERIC(12, 2),
        allowNull: true,
    }
}, {
    tableName: 'agentes', // Asegúrate de que coincida con el nombre de tu tabla en PostgreSQL
    timestamps: false, // Desactiva la creación de las columnas createdAt y updatedAt
    freezeTableName: true,
});

module.exports = Agentes;
