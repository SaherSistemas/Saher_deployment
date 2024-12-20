const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index'); // Ajusta la ruta a tu configuración de Sequelize
const articulos = require('../ARTICULOS/Articulos');

const Pedido1 = sequelize.define('Pedido1', {
    empcdempn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    pdicdpdin: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
        primaryKey: true,
    },
    artcdartn: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
        primaryKey: true,
    },
    pdiaplofc: {
        type: DataTypes.CHAR(1),
    },
    pdidescrc: {
        type: DataTypes.STRING(5),
    },
    pdicntpdn: {
        type: DataTypes.DECIMAL(13, 4),
    },
    pdicntsun: {
        type: DataTypes.DECIMAL(13, 4),
    },
    pdicntchn: {
        type: DataTypes.DECIMAL(13, 4),
    },
    pdiprevtn: {
        type: DataTypes.DECIMAL(9, 2),
    },
    pdipranon: {
        type: DataTypes.DECIMAL(9, 2),
    },
    pdiaplagc: {
        type: DataTypes.CHAR(1),
    },
    pdipasilc: {
        type: DataTypes.STRING(5),
    },
    pdianaqun: {
        type: DataTypes.INTEGER,
    },
    pdiniveln: {
        type: DataTypes.SMALLINT,
    },
    pdiposicn: {
        type: DataTypes.SMALLINT,
    },
    pdipesokn: {
        type: DataTypes.DECIMAL(7, 4),
    }
}, {
    tableName: 'pedido1',
    timestamps: false,
});

Pedido1.belongsTo(articulos, {foreignKey:'artcdartn', as:'articulos'});

module.exports = Pedido1;
