const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index');  // Asegúrate de que esta sea la ruta correcta a tu instancia de Sequelize

const WebImage = sequelize.define('WebImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,  // Asegura que el id sea autoincremental
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,  // Tipo MIME de la imagen (e.g., 'image/jpeg', 'image/png')
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,  // Nombre del archivo
    allowNull: false,
  },
  data: {
    type: DataTypes.BLOB('long'),  // Para almacenar los datos binarios de la imagen
    allowNull: false,
  },
}, {
  tableName: 'webimages',
  timestamps: false,  // Si no necesitas campos de timestamps (createdAt, updatedAt), desactívalos
});

module.exports = WebImage;
