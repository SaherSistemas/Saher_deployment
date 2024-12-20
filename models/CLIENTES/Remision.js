const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index'); // Ajusta la ruta a tu conexión de Sequelize

const Remision = sequelize.define('Remision', {
    empcdempn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    remcdremn: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
        primaryKey: true,
    },
    clicdclic: {
        type: DataTypes.STRING(15),
        allowNull: true,
    },
    remnufacn: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
    },
    remfecred: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    remnubuln: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    remfeccad: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    remstatuc: {
        type: DataTypes.CHAR(1),
        allowNull: true,
    },
}, {
    tableName: 'remision',
    schema: 'public',
    timestamps: false, // Evita que Sequelize intente usar columnas 'createdAt' y 'updatedAt'
});

module.exports = Remision;
