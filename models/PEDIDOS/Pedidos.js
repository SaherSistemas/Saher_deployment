const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js'); // Ajusta la ruta según tu estructura

const Pedidos = sequelize.define('Pedido', {
  empcdempn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true, // Ajustar si es clave primaria
  },
  pdicdpdin: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: false,
    primaryKey: true, // Ajustar si es parte de la clave primaria
  },
  pdifecped: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  pdifecfad: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  pdistatuc: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
  pdifolpec: {
    type: DataTypes.CHAR(10),
    allowNull: true,
  },
  pdipaquec: {
    type: DataTypes.CHAR(25),
    allowNull: true,
  },
  pdinumguc: {
    type: DataTypes.CHAR(100),
    allowNull: true,
  },
  pditelmac: {
    type: DataTypes.CHAR(1),
    allowNull: true,
  },
  clicdclic: {
    type: DataTypes.CHAR(15),
    allowNull: true,
  },
  pdihorrec: {
    type: DataTypes.CHAR(8),
    allowNull: true,
  },
  pdihorfac: {
    type: DataTypes.CHAR(8),
    allowNull: true,
  },
  pdihorauc: {
    type: DataTypes.CHAR(8),
    allowNull: true,
  },
  paqcdpaqn: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: true,
  },
  pdiimguan: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  pdiimguin: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  pdiussurc: {
    type: DataTypes.CHAR(20),
    allowNull: true,
  },
  pdihosurc: {
    type: DataTypes.CHAR(8),
    allowNull: true,
  },
  pdiuschec: {
    type: DataTypes.CHAR(20),
    allowNull: true,
  },
  pdihochec: {
    type: DataTypes.CHAR(8),
    allowNull: true,
  },
  pdiusempc: {
    type: DataTypes.CHAR(20),
    allowNull: true,
  },
  pdihoempc: {
    type: DataTypes.CHAR(8),
    allowNull: true,
  },
}, {
  tableName: 'pedido', // Cambia esto si la tabla tiene otro nombre
  timestamps: false, // Desactiva createdAt y updatedAt
  freezeTableName: true, // Evita pluralizar el nombre de la tabla
});

module.exports = Pedidos;
