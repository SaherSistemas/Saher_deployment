const { DataTypes } = require('sequelize');
const sequelize = require('../../database/index.js');
const Clientes = require('../CLIENTES/Clientes.js');
const Agentes = require('../AGENTES/Agentes.js');
const Administradores = require('../ADMINISTRADORES/Administradores.js');

const usuarios = sequelize.define('webusuarios', {
    usuarioweb: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true
    },
    contraweb: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    clvcli: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    clvage: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    clvadmin: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    statusadmin: {
        type: DataTypes.CHAR(1),
        allowNull: false,
        defaultValue: 'A'
    },
    fechainiciosesion: {
        type: DataTypes.DATE,
    },
    cant_pedidos: {
        type: DataTypes.NUMBER(10, 0)
    }
}, {
    tableName: 'webusuarios', // Asegúrate de que coincida con el nombre de tu tabla en PostgreSQL
    timestamps: false, // Desactiva la creación de las columnas createdAt y updatedAt
    freezeTableName: true,
})


usuarios.belongsTo(Clientes, { foreignKey: 'clvcli', as: 'cliente' });
usuarios.belongsTo(Agentes, { foreignKey: 'clvage', as: 'agente' });
usuarios.belongsTo(Administradores, { foreignKey: 'clvadmin', as: 'administrador' });


module.exports = usuarios;