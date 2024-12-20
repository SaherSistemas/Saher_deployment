const Agentes = require('../models/AGENTES/Agentes.js');
const Clientes = require('../models/CLIENTES/Clientes.js');
const Pedidos = require('../models/PEDIDOS/Pedidos.js');
const { Sequelize, Op } = require('sequelize');
const Pedido1 = require('../models/PEDIDOS/Pedidos1.js');
const articulos = require('../models/ARTICULOS/Articulos.js');

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

exports.pedidosDiaAgente = async (req, res, next) => {
    try {
        const { fecha, agenteId } = req.query;

        if (!fecha || !agenteId) {
            return res.status(400).json({ message: 'Faltan parámetros: fecha y agenteId son requeridos' });
        }

        // Obtén los clientes asociados al agente
        const clientesAgente = await Clientes.findAll({
            where: { cliagecvn: agenteId },
            attributes: ['clicdclic', 'clirazonc']
        });

        const clienteMap = clientesAgente.reduce((map, cliente) => {
            map[cliente.clicdclic] = cliente.clirazonc;
            return map;
        }, {});

        const clienteIds = Object.keys(clienteMap);

        if (clienteIds.length === 0) {
            return res.status(404).json({ message: 'El agente no tiene clientes asignados' });
        }

        // Obtén los pedidos
        const pedidos = await Pedidos.findAll({
            where: {
                pdifecped: fecha,
                clicdclic: clienteIds,
                empcdempn: 20
            }
        });

        if (pedidos.length === 0) {
            return res.status(404).json({ message: 'No se encontraron pedidos para los clientes asociados' });
        }

        // Añade la razón social al resultado
        const pedidosConRazonSocial = pedidos.map(pedido => ({
            ...pedido.toJSON(),
            clirazonc: clienteMap[pedido.clicdclic]
        }));

        res.status(200).json(pedidosConRazonSocial);
    } catch (error) {
        console.error("Error al consultar pedidos del día para el agente:", error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};


exports.detallePedido = async (req, res) => {
    try {
        const { pedidoId } = req.params; // Recibe el id del pedido desde la ruta

        const detalles = await Pedido1.findAll({
            where: {
                pdicdpdin: pedidoId,
                empcdempn:20
            },
            include: [
                {
                    model: articulos,
                    as: 'articulos',
                    attributes: ['artdsartc'], // Solo traemos el nombre del artículo
                },
            ],
        });
        
        if (detalles.length === 0) {
            return res.status(404).json({ message: 'No se encontraron detalles para este pedido.' });
        }

        res.status(200).json(detalles);
    } catch (error) {
        console.error('Error al consultar detalles del pedido:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};


exports.misClientes = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1; // Número de página, por defecto 1
      const limit = parseInt(req.query.limit) || 50; // Cantidad de registros por página, por defecto 50
      const offset = (page - 1) * limit;
      const searchTerm = req.query.nombre || ''; // Término de búsqueda, por defecto vacío
      const estado = req.query.estado || 'A'; // Estado, por defecto 'A' para activos
      const { idAgente } = req.params; // Extrae idAgente desde la URL
  
      const whereCondition = {
        ...searchTerm && { clirazonc: { [Op.iLike]: `%${searchTerm}%` } },
        ...estado && { clistatuc: estado },
        ...idAgente && { cliagecvn: idAgente } // Nueva condición
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


  