const { Sequelize } = require('sequelize');
require('dotenv').config({ path: 'variables.env' });


const sequelize = new Sequelize(
    process.env.DB_NAME, // Nombre de la base de datos
    process.env.DB_USER, // Usuario
    process.env.DB_PASSWORD, // Contraseña
    {
        host: process.env.DB_HOST, // Servidor o host de la base de datos
        dialect: process.env.DB_DIALECT, // Dialecto de base de datos
        logging: false, // Desactiva logs de Sequelize
    }
);


module.exports = sequelize

