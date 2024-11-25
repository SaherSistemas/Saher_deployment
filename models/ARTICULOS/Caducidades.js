const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

const Caducidades = sequelize.define('Caducidades', {
  empcdempn: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  artcdartn: {
    type: DataTypes.NUMERIC(10, 0),
    allowNull: false
  },
  cadlotecc: {
    type: DataTypes.CHAR(20),
    allowNull: false
  },
  cadfeccad: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cadpiezan: {
    type: DataTypes.NUMERIC(13, 4),
    allowNull: true
  },
  cadapartn: {
    type: DataTypes.NUMERIC(13, 4),
    allowNull: true
  }
}, {
  tableName: 'caducidades',
  schema: 'public', // Esto es importante si estás utilizando un esquema
  timestamps: false // Si no tienes campos como createdAt y updatedAt
});

module.exports = Caducidades;