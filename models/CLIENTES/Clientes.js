const { DataTypes } = require('sequelize');
const sequelize = require('../../database'); // Asegúrate de que la conexión a la base de datos esté correctamente configurada

const Clientes = sequelize.define('clientes', {
    clicdclic: {
        type: DataTypes.CHAR(15),
        allowNull: false,
        primaryKey: true,
    },
    clirazonc: {
        type: DataTypes.CHAR(70),
        allowNull: true,
    },
    clinomcoc: {
        type: DataTypes.CHAR(30),
        allowNull: true,
    },
    clinombrc: {
        type: DataTypes.STRING(30),
        allowNull: true,
    },
    cliappatc: {
        type: DataTypes.CHAR(30),
        allowNull: true,
    },
    cliapmatc: {
        type: DataTypes.CHAR(30),
        allowNull: true,
    },
    cliccurpc: {
        type: DataTypes.CHAR(20),
        allowNull: true,
    },
    clicvrfcc: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    clicallec: {
        type: DataTypes.CHAR(70),
        allowNull: true,
    },
    clientcac: {
        type: DataTypes.CHAR(70),
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
    clitelnuc: {
        type: DataTypes.CHAR(20),
        allowNull: true,
    },
    clifaxnuc: {
        type: DataTypes.CHAR(20),
        allowNull: true,
    },
    clilimcrn: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    cliplazon: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    clistatuc: {
        type: DataTypes.CHAR(1),
        allowNull: true,
    },
    clisaldon: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    clitpfacc: {
        type: DataTypes.CHAR(1),
        allowNull: true,
    },
    clidesctn: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
    },
    clifecald: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    clifecbad: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    clifecbld: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    clilimfan: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    grpcdgrpn: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    cliagecvn: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    cliemailc: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    clicdintn: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
    },
    cliestadc: {
        type: DataTypes.CHAR(50),
        allowNull: true,
    },
    cliciudac: {
        type: DataTypes.CHAR(50),
        allowNull: true,
    },
    climunicc: {
        type: DataTypes.CHAR(50),
        allowNull: true,
    },
    clicolonc: {
        type: DataTypes.CHAR(50),
        allowNull: true,
    },
    clicodpon: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    clictaban: {
        type: DataTypes.CHAR(15),
        allowNull: true,
    },
    climetpac: {
        type: DataTypes.CHAR(50),
        allowNull: true,
    },
    clidiavic: {
        type: DataTypes.CHAR(10),
        allowNull: true,
    },
    cliporcon: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
    },
    mepcvmepc: {
        type: DataTypes.CHAR(3),
        allowNull: true,
    },
    clibancoc: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    usccvuscc: {
        type: DataTypes.CHAR(3),
        allowNull: true,
    },
    clictacoc: {
        type: DataTypes.CHAR(20),
        allowNull: true,
    },
    rficdrfic: {
        type: DataTypes.CHAR(3),
        allowNull: true,
    }
}, {
    tableName: 'clientes', // Nombre real de la tabla en PostgreSQL
    timestamps: false, // Desactiva las columnas createdAt y updatedAt
    freezeTableName: true, // Evita que Sequelize pluralice el nombre del modelo
});

module.exports = Clientes;
