const {DataTypes} = require('sequelize');
const sequelize = require('../../database/index.js');

const numerador = sequelize.define('numerador',{
    empcdempn: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      numcdnumn: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      numdescrc: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      numfolcon: {
        type: DataTypes.NUMBER(10),
        allowNull: false,
      },
},{
    tableName: 'numerador',
    timestamps : false// Desactiva la creación de las columnas createdAt y updatedAt
})


module.exports = numerador;