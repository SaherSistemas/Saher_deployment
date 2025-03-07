const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js'); // Ajusta la ruta según tu estructura

const Paqueterias = sequelize.define('Paqueteria', {
    paqcdpaqn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true, // Ajustar si es clave primaria
    },
    paqrazonc: {
        type: DataTypes.CHAR(150),
        allowNull: false,
    },
    paqnomcoc: {
        type: DataTypes.CHAR(100),
        allowNull: true,
    },
    paqcallenc: {
        type: DataTypes.CHAR(150),
        allowNull: true,
    },
    estcdestn: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    ciucdciun: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    colcdcoln: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    paqfecald: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    paqfecbad: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    paqcontac: {
        type: DataTypes.CHAR(100),
        allowNull: true,
    },
    paqtele1c: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    paqtele2c: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    paqcelulc: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    paqstatuc: {
        type: DataTypes.CHAR(1),
        allowNull: true,
    },
    ppaqcoston: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
}, {
    tableName: 'paqueterias', // Cambia esto si la tabla tiene otro nombre
    timestamps: false, // Desactiva createdAt y updatedAt
    freezeTableName: true, // Evita pluralizar el nombre de la tabla
});

module.exports = Paqueterias;
