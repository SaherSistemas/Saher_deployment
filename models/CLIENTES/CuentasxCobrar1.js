const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index');  // Asegúrate de importar tu instancia de sequelize

const CtasxCob1 = sequelize.define('CtasxCob1', {
  empcdempn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  clicdclic: {
    type: DataTypes.CHAR(15),
    allowNull: false,
    primaryKey: true
  },
  cxctpdocc: {
    type: DataTypes.CHAR(3),
    allowNull: false,
    primaryKey: true
  },
  cxcnudocn: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: false,
    primaryKey: true
  },
  cxcnupagn: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    primaryKey: true
  },
  cxcimppan: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  cxcnurecn: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: true
  },
  cxcfepagd: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  cxcstafac: {
    type: DataTypes.CHAR(1),
    allowNull: true
  },
  cxcimpden: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  }
}, {
  tableName: 'ctasxcob1',
  schema: 'public',
  timestamps: false  // Si no quieres que Sequelize maneje createdAt y updatedAt
});

module.exports = CtasxCob1;
