const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index'); // Asegúrate de ajustar la ruta según tu configuración
const articulos = require('../ARTICULOS/Articulos');


const Preciogpo = sequelize.define('Preciogpo', {
  grpcdgrpn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  artcdartn: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: false,
    primaryKey: true
  },
  grpprecin: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: true
  },
  grpcoston: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: true
  },
  grpmargen: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  grpstatuc: {
    type: DataTypes.CHAR(1), // Almacena un carácter
    allowNull: true
  },
  grpfechad: {
    type: DataTypes.DATEONLY, // Solo fecha
    allowNull: true
  },
  grppreofn: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: true
  },
  grpfecofd: {
    type: DataTypes.DATEONLY, // Solo fecha
    allowNull: true
  },
  grppzalmn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: true
  },
  grpmulofc: {
    type: DataTypes.CHAR(1), // Almacena un carácter
    allowNull: true
  }
}, {
  tableName: 'preciogpo', // Nombre de la tabla
  schema: 'public', // Esquema de la tabla
  timestamps: false // Desactiva las columnas createdAt y updatedAt
});

Preciogpo.belongsTo(articulos, { foreignKey: 'artcdartn', as: 'articulo' });

module.exports = Preciogpo;
