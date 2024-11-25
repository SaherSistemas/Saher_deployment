const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../database/index'); 

const Contacto = sequelize.define('Contacto', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombreCompleto: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'nombre_completo' // Mapeo con el nombre de la columna en la tabla
    },
    celular: {
        type: DataTypes.STRING(15),
        allowNull: true
    },
    correo: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: true // Valida que el correo sea en formato correcto
        }
    },
    mensaje: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    creadoEn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'creado_en' // Mapeo con el nombre de la columna en la tabla
    }
}, {
    tableName: 'webcontactos', // Nombre de la tabla en la base de datos
    timestamps: false // Evitar las columnas `createdAt` y `updatedAt`
});

module.exports = Contacto;
