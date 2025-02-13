const Agentes = require('../models/AGENTES/Agentes.js');
const Clientes = require('../models/CLIENTES/Clientes.js');
const { Sequelize, Op } = require('sequelize');

exports.todosAgentesSinCuenta = async (req, res, next) => {
    try {
        const agentes = await Agentes.findAll({
            attributes: ['agecdagen', 'agedsagec', 'agecallec'],
            where: {
                agestatuc: 'A',
                [Op.not]: Sequelize.literal(`
                   NOT EXISTS (
                        SELECT 1 FROM webusuarios u
                        WHERE u.clvage = Agentes.agecdagen
                    )
                `)
            },
            order: [['agedsagec', 'ASC']],
            raw: true // Para obtener resultados como objetos simples de JavaScript
        });

        res.status(200).json(agentes);
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
};


exports.todosAgentes = async (req, res, next) => {
    try {
        const agentes = await Agentes.findAll({
            attributes: ['agecdagen', 'agedsagec', 'agestatuc'],
            raw: true, // Para obtener resultados como objetos simples de JavaScript
            order: [['agestatuc', 'ASC']]
        });

        res.status(200).json(agentes);
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
};


/*DESACTIVAR ARTICULO */
exports.activarYDesactivarAgente = async (req, res, next) => {
    try {
        let nuevoVa = ''
        const activoONo = await Agentes.findOne({
            attributes: ['agestatuc'],
            where: {
                agecdagen: req.body.agecdagen,
            },
        });
        /*const nuevoVa = null
    /*SI ES A CAMBIAR a D SI ES D cambiar a A */
        if (activoONo.agestatuc == 'A') {
            nuevoVa = 'B'
        }
        else if (activoONo.agestatuc == 'B') {
            nuevoVa = 'A'
        }


        /*ACTUALIZAR EL ESTATUS DEL AGENTE */
        await Agentes.update(
            { agestatuc: nuevoVa },
            { where: { agecdagen: req.body.agecdagen } }
        );
        res.status(200).json({ mensaje: 'Estatus actualizado correctamente' });

    } catch (error) {
        res.status(400).json({ error: error.message });
        next(error)
    }
};




exports.misClientes = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.nombre || '';
        const estado = req.query.estado || 'A';
        const { idAgente } = req.params;

        const whereCondition = {
            ...(searchTerm && {
                [Op.or]: [
                    { clirazonc: { [Op.iLike]: `%${searchTerm}%` } },
                    { clinomcoc: { [Op.iLike]: `%${searchTerm}%` } }
                ]
            }),
            ...(estado && { clistatuc: estado }),
            ...(idAgente && { cliagecvn: idAgente })
        };

        const { count, rows } = await Clientes.findAndCountAll({
            where: whereCondition,
            offset: offset,
            limit: limit,
            order: [['clirazonc', 'ASC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            items: rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
};





