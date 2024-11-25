const Administrador = require('../models/ADMINISTRADORES/Administradores');
const { Sequelize, Op } = require('sequelize');

exports.todosAdminSinCuenta = async (req, res, next) => {
    try {
        const administrador = await Administrador.findAll({
            attributes: ['cd_adminweb', 'nom_adminweb'],
            where: {
                activo_adminweb: 'A',
                [Op.not]: Sequelize.literal(`
                   NOT EXISTS (
                        SELECT 1 FROM webusuarios u
                        WHERE u.clvadmin = webadministradores.cd_adminweb
                    )
                `)
            },
            order: [['nom_adminweb', 'ASC']],
            raw: true // Para obtener resultados como objetos simples de JavaScript
        });


        res.status(200).json(administrador);
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
}

exports.administradores = async (req, res, next) => {
    try {
        const administrador = await Administrador.findAll({
            attributes: ['cd_adminweb', 'nom_adminweb', 'activo_adminweb'],
            order: [['activo_adminweb', 'ASC']],
            raw: true // Para obtener resultados como objetos simples de JavaScript
        });


        res.status(200).json(administrador);
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
}

exports.desactivarUsarios = async (req, res, next) => {
    try {
        const activoONo = await Administrador.findOne({
            attributes: ['activo_adminweb'],
            where: {
                cd_adminweb: req.body.cd_adminweb,
            },
        });
        if (activoONo.activo_adminweb == 'A') {
            nuevoVa = 'D'
        }
        else if (activoONo.activo_adminweb == 'D') {
            nuevoVa = 'A'
        }

        await Administrador.update(
            { activo_adminweb: nuevoVa },
            { where: { cd_adminweb: req.body.cd_adminweb } }
        );
        res.status(200).json({ mensaje: 'Estatus actualizado correctamente' });

    } catch (error) {
        res.status(400).json({ error: error.message });
        next(error)
    }
}

exports.cod_admin = async (req, res, next) => {
    try {
        const resultado = await Administrador.findOne({
            attributes: ['cd_adminweb'],
            order: [['cd_adminweb', 'DESC']]
        });

        // Si existe un resultado, accede al valor de cd_adminweb y suma 1
        const siguienteCodigo = resultado ? parseInt(resultado.cd_adminweb) + 1 : 1;

        res.status(200).json(siguienteCodigo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el último código' });
    }
};

exports.nuevoAdministrador = async (req, res, next) => {
    try {
        const { cd_adminweb, nom_adminweb, activo_adminweb } = req.body;

        const nuevoAdminis = {
            cd_adminweb,
            nom_adminweb,
            activo_adminweb
        };

        // Creación del administrador
        const adminCreado = await Administrador.create(nuevoAdminis);

        res.status(201).json({ mensaje: 'Se agregó el administrador correctamente', adminCreado });
    } catch (error) {
        console.error('Error al guardar el administrador:', error.message);
        res.status(500).json({ error: `Ocurrió un error al guardar el administrador: ${error.message}` });
        next(error);
    }
};




