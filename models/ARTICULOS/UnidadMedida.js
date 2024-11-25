const {DataTypes} = require('sequelize');
const sequelize = require('../../database/index.js');

const unidadmedida = sequelize.define('UnidadMedida',{
    umecdumen: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
    umedsumec: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    umedecsnc: {
        type: DataTypes.STRING(1),
        allowNull: false,
      },
    umedscorc: {
        type: DataTypes.STRING,
        allowNull: false,
      },
},{
    tableName: 'unidadmed',
    timestamps : false// Desactiva la creación de las columnas createdAt y updatedAt
})


module.exports = unidadmedida;