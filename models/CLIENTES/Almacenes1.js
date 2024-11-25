const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index'); // Asegúrate de ajustar la ruta según tu configuración
const articulos = require('../ARTICULOS/Articulos');

const Almacenes1 = sequelize.define('Almacenes1', {
  empcdempn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  almcdalmn: {
    type: DataTypes.SMALLINT,
    allowNull: false,
  },
  artcdartn: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  almexistn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: true
  },
  almstatuc: {
    type: DataTypes.CHAR(1), // Almacena un carácter
    allowNull: true
  },
  almultctn: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: true
  },
  almcfeultd: {
    type: DataTypes.DATEONLY, // Solo fecha
    allowNull: true
  },
  almcosprn: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: true
  },
  almapartn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: true
  },
  almminpzn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: true
  },
  almmaxpzn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: true
  },
  almcontec: {
    type: DataTypes.CHAR(5), // Almacena hasta 5 caracteres
    allowNull: true
  },
  almconnin: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  almconpon: {
    type: DataTypes.SMALLINT,
    allowNull: true
  },
  almconnun: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'almacenes1', // Nombre de la tabla
  schema: 'public', // Esquema de la tabla
  timestamps: false // Desactiva las columnas createdAt y updatedAt
});

Almacenes1.belongsTo(articulos, {
  foreignKey: 'artcdartn', // Asegúrate de usar el nombre correcto de la columna en la tabla almacenes1
  as: 'articulo' // Alias utilizado para la relación
});

module.exports = Almacenes1;