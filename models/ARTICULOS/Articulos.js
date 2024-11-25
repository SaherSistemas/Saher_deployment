const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');

/*ADAPTAR A LA FARMACIA SAHER */
const articulos = sequelize.define('articulos', {
  artcdartn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  artdsartc: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artdsgenc: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artclfisc: {
    type: DataTypes.CHAR,
    allowNull: false,
    defaultValue: 'B'
  },
  ivacdivan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  arttpartc: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '0'
  },
  arttempon: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 3
  },
  artcaducc: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'S'
  },
  artclasic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artredevc: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'S'
  },
  artemporn: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ubiclaven: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  artpfarmn: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artpfardn: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artppubln: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artpfarpn: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artultcon: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.01
    //CHECAR
  },
  artmargen: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artdxppan: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artcodbac: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artexistn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: false,
    defaultValue: 0.0
  },
  artstatuc: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'A'
  },
  artfabric: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artfecald: {
    type: DataTypes.DATEONLY,
    allowNull: false,

  },
  artfecbld: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  artimageb: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  artpmo1n: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artpmo2n: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artpmo3n: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artpmo4n: {
    type: DataTypes.DECIMAL(9, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artpzvirn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: false,
    defaultValue: 0.00
  },
  artdiainc: {
    type: DataTypes.STRING(1),
    allowNull: false,
    defaultValue: 'X'
  },
  artmaximn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: false,
    defaultValue: 0.00
  },
  artminimn: {
    type: DataTypes.DECIMAL(13, 4),
    allowNull: false,
    defaultValue: 0.00
  },
  arttipprc: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artvabcoc: {
    type: DataTypes.STRING(1),
    allowNull: false,
    defaultValue: 'N'
  },
  artgplgsn: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  artfeccad: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: '0001-01-01'
  },
  artdescon: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artoftren: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  umecdumen: {
    type: DataTypes.SMALLINT,
    allowNull: false,
  },
  gofcdgofn: {
    type: DataTypes.DECIMAL(10),
    allowNull: false,
    defaultValue: 0.00
  },
  artcompon: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  artpasilc: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  artanaqun: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  artniveln: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  artposicn: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  artpesokn: {
    type: DataTypes.DECIMAL(7, 4),
    allowNull: false,
    defaultValue: 0
  },
  satclavec: {
    type: DataTypes.STRING,
    allowNull: false,

  },
}, {
  tableName: 'articulos',
  timestamps: false  // Desactiva la creación de las columnas createdAt y updatedAt
});


module.exports = articulos