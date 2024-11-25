const { DataTypes } = require('sequelize');
const sequelize = require('../../database'); // Asegúrate de que la conexión a la base de datos esté correctamente configurada

const CuentasxCobrar = sequelize.define('cuentasxcobrar', {
    empcdempn: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    clicdclic: {
        type: DataTypes.CHAR(15),
        allowNull: false,
    },
    cxctpdocc: {
        type: DataTypes.CHAR(3),
        allowNull: false,
    },
    cxcnudocn: {
        type: DataTypes.NUMERIC(10, 0),
        allowNull: false,
    },
    cxcfolfin: {
        type: DataTypes.NUMERIC(10, 0),
        allowNull: true,
    },
    cxcfedocd: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cxcfeulpd: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cxcporcon: {
        type: DataTypes.NUMERIC(4, 2),
        allowNull: true,
    },
    cxcfevend: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cxcfecand: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cxcstatuc: {
        type: DataTypes.CHAR(1),
        allowNull: true,
    },
    agecdagen: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    cxcivapon: {
        type: DataTypes.NUMERIC(4, 2),
        allowNull: true,
    },
    cxcpagvic: {
        type: DataTypes.CHAR(1),
        allowNull: true,
    },
    cxcfoldic: {
        type: DataTypes.CHAR(20),
        allowNull: true,
    },
    cxcsubton: {
        type: DataTypes.NUMERIC(12, 2),
        allowNull: true,
    },
    cxcimivan: {
        type: DataTypes.NUMERIC(12, 2),
        allowNull: true,
    },
    cxcimpcon: {
        type: DataTypes.NUMERIC(12, 2),
        allowNull: true,
    },
    cxctocivn: {
        type: DataTypes.NUMERIC(12, 2),
        allowNull: true,
    },
}, {
    tableName: 'ctasxcob', // Nombre real de la tabla en PostgreSQL
    timestamps: false, // Desactiva las columnas createdAt y updatedAt
    freezeTableName: true, // Evita que Sequelize pluralice el nombre del modelo
});
module.exports = CuentasxCobrar;
