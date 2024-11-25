const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js'); // Asegúrate de importar correctamente tu instancia de Sequelize

const Administradores = sequelize.define('webadministradores', {
    cd_adminweb: {
        type: DataTypes.SMALLINT,
        primaryKey: true,
        allowNull: false
    },
    nom_adminweb: {
        type: DataTypes.STRING(50),
        allowNull: true // Puedes ajustar esto según tus requisitos
    },
    activo_adminweb: {
        type: DataTypes.CHAR(1),
        allowNull: true // Puedes ajustar esto según tus requisitos
    }
}, {
    tableName: 'webadministradores', // Nombre de la tabla en PostgreSQL
    timestamps: false, // Desactivar la creación de las columnas createdAt y updatedAt
    freezeTableName: true // Evitar la pluralización automática del nombre de la tabla
});

module.exports = Administradores;
