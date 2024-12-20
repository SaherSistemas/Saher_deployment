const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index');

const Factura = sequelize.define('Factura', {
  empcdempn: {
    type: DataTypes.INTEGER,
    allowNull: false,

  },
  fclcdfcln: {
    type: DataTypes.NUMERIC(10, 0),
    allowNull: false,
  },
  clicdclic: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  fclfecfad: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fclfecved: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fclfecpad: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fclfeccad: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fclfecapd: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fclstatuc: {
    type: DataTypes.STRING(1),
    allowNull: true,
  },
  fclfolfisn: {
    type: DataTypes.NUMERIC(10, 0),
    allowNull: true,
  },
  fclmovinc: {
    type: DataTypes.STRING(3),
    allowNull: true,
  },
  fclfacdigc: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  fclfolpec: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  fcltelmac: {
    type: DataTypes.STRING(1),
    allowNull: true,
  },
  fcluuidfc: {
    type: DataTypes.STRING(36),
    allowNull: true,
  },
  fclgepdfc: {
    type: DataTypes.STRING(1),
    allowNull: true,
  },
  fclmotcac: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'facturas',
  timestamps: false, // Si la tabla no tiene columnas de tipo timestamp
});

module.exports = Factura;
