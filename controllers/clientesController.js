const Almacenes1 = require('../models/CLIENTES/Almacenes1.js');
const Clientes = require('../models/CLIENTES/Clientes.js');
const CuentasxCobrar = require('../models/CLIENTES/CuentasxCobrar.js');
const CuentasxCobrar1 = require('../models/CLIENTES/CuentasxCobrar1.js');
const { Sequelize, Op } = require('sequelize');
const articulos = require('../models/ARTICULOS/Articulos.js');
const Remision = require('../models/CLIENTES/Remision.js');



exports.todosClientesSinCuenta = async (req, res, next) => {
  try {
    const clientes = await Clientes.findAll({
      attributes: ['clicdclic', 'clirazonc'],
      where: {
        clistatuc: 'A',
        [Op.not]: Sequelize.literal(`
                   NOT EXISTS (
                        SELECT 1 FROM webusuarios u
                        WHERE u.clvcli = clientes.clicdclic
                    )
                `)
      },
      order: [['clirazonc', 'ASC']],
      raw: true
    });


    const clientesLimpios = clientes.map(rfcCliente => ({
      clicdclic: rfcCliente.clicdclic.trim(),
      clinomcoc: rfcCliente.clirazonc.trim().toUpperCase()
    }));

    res.status(200).json(clientesLimpios);
  } catch (error) {
    res.status(500).json({ error: error.message });
    next(error);
  }
}

exports.todosClientes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.nombre || '';
    const estado = req.query.estado || 'A';

    const whereCondition = {
      ...searchTerm && { clirazonc: { [Op.iLike]: `%${searchTerm}%` } },
      ...estado && { clistatuc: estado }
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
}


exports.obtenerFacturasVencidas = async (req, res, next) => {
  try {
    const { clicdclic } = req.params;
    const facturas = await CuentasxCobrar.findAll({
      where: {
        empcdempn: 20,
        cxctpdocc: 'FAC',
        clicdclic: clicdclic
      }
    });
    return res.status(200).json(facturas);
  } catch (error) {
    next();
    return res.status(500).json({ error: 'Error al obtener las facturas.' });
  }
};


exports.totalFacturas = async (req, res, next) => {
  try {
    const { claveUsuario } = req.params;
    const { clinomcoc } = await Clientes.findByPk(claveUsuario)
    const tieneAbarrote = clinomcoc.toLowerCase().includes("abarrote");
    if (tieneAbarrote) {
      const remisiones = await Remision.findAll({
        where: {
          clicdclic: claveUsuario,
          empcdempn: 20,
          remstatuc: 'A'
        },
        order: [['remfecred', 'DESC']],
        limit: 20
      });

      if (!remisiones.length) {
        return res.status(200).json([]);
      }

      const remnufacns = remisiones.map(remision => remision.remnufacn);
      // Traer todas las facturas en una sola consulta
      const facturasEncontradas = await CuentasxCobrar.findAll({
        attributes: [
          'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
          'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
          'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
          [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
        ],
        where: {
          cxcnudocn: { [Op.in]: remnufacns }, // Optimización para buscar todas las facturas de una vez
          empcdempn: 20,
          cxcstatuc: 'C'
        },
        group: [
          'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
          'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
          'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
        ],
        order: [['cxcfevend', 'DESC']] // Ordenar facturas por fecha de vencimiento descendente
      });
      if (!facturasEncontradas.length) {
        return res.status(200).json([]);
      }
      // Traer pagos en una sola consulta
      const pagos = await CuentasxCobrar1.findAll({
        attributes: [
          'cxcnudocn',
          [Sequelize.fn('SUM', Sequelize.col('cxcimppan')), 'total_pagado']
        ],
        where: {
          empcdempn: 20,
          cxcnudocn: { [Op.in]: facturasEncontradas.map(factura => factura.cxcnudocn) }
        },
        group: ['cxcnudocn'],
        raw: true
      });

      // Convertir pagos a un mapa para acceso rápido
      const pagosMap = pagos.reduce((acc, pago) => {
        acc[pago.cxcnudocn] = pago.total_pagado || 0;
        return acc;
      }, {});

      // Calcular deuda por factura
      facturasEncontradas.forEach(factura => {
        const totalPagado = pagosMap[factura.cxcnudocn] || 0;
        const totalFactura = Math.round(parseFloat(factura.dataValues.total_suma) * 100) / 100;
        const totalDeuda = Math.round((totalFactura - totalPagado) * 100) / 100;

        factura.dataValues.total_pagado = Math.round(totalPagado * 100) / 100;
        factura.dataValues.total_deuda = totalDeuda;
      });

      return res.status(200).json(facturasEncontradas);

    } else {
      const facturas = await CuentasxCobrar.findAll({
        attributes: [
          'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
          'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
          'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
          [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
        ],
        where: {
          clicdclic: claveUsuario,
          empcdempn: 20,
          cxcstatuc: 'C'
        },
        group: [
          'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
          'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
          'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
        ]
      });

      if (facturas.length > 0) {
        for (const factura of facturas) {
          const pagos = await CuentasxCobrar1.findAll({
            attributes: [[Sequelize.fn('SUM', Sequelize.col('cxcimppan')), 'total_pagado']],
            where: {
              clicdclic: factura.clicdclic,
              empcdempn: factura.empcdempn,
              cxcnudocn: factura.cxcnudocn,
              empcdempn: 20
            },
            raw: true
          });

          const totalPagado = pagos[0]?.total_pagado || 0;
          const totalFactura = Math.round(parseFloat(factura.dataValues.total_suma) * 100) / 100;
          const totalDeuda = Math.round((totalFactura - totalPagado) * 100) / 100;

          factura.dataValues.total_pagado = Math.round(totalPagado * 100) / 100;
          factura.dataValues.total_deuda = totalDeuda;
        }
        return res.status(200).json(facturas);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al obtener las facturas' });
  }
};




exports.claveGrp = async (req, res, next) => {
  try {
    const { clicdclic } = req.params;

    const rfcCliente = await Clientes.findOne({
      attributes: ['grpcdgrpn'],
      where: {
        clicdclic: clicdclic
      }
    });

    if (rfcCliente) {
      res.status(200).json(rfcCliente);
    } else {
      res.status(404).json({ error: 'Cliente no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener el grupo' });
  }
};



exports.obtenerDetalles = async (req, res, next) => {
  const { artcdartn } = req.params;

  try {

    const productoAlmacen = await Almacenes1.findOne({
      attributes: ['empcdempn', 'almexistn'],
      include: [{
        model: articulos,
        as: 'articulo',
        attributes: ['artcdartn', 'artdsartc', 'artdsgenc', 'artemporn'],
        where: {
          artcdartn: artcdartn
        }
      }],
      where: { empcdempn: 20, almcdalmn: 1 },
    });

    if (!productoAlmacen) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }


    res.status(200).json(productoAlmacen);
  } catch (error) {

    res.status(500).json({ error: 'Error al obtener los datos del producto' });
  }
};

exports.obtenerRFC = async (req, res, next) => {
  try {
    const { clicdclic } = req.params;

    const cliente = await Clientes.findOne({
      attributes: ['clicvrfcc', 'clinomcoc'], // Incluye clinomcoc en los atributos a consultar
      where: {
        clicdclic: clicdclic
      }
    });

    if (cliente) {
      // Verificar si clinomcoc contiene la palabra "ABARROTES"
      if (cliente.clinomcoc && cliente.clinomcoc.toUpperCase().includes('ABARROTES')) {
        res.status(200).json({ clicvrfcc: 'XAXX010101000' });
      } else {
        res.status(200).json({ clicvrfcc: cliente.clicvrfcc });
      }
    } else {
      res.status(404).json({ error: 'Cliente no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener el RFC' });
  }
};








exports.obtenerDatosCliente = async (req, res, next) => {
  try {
    const { claveUsuario } = req.query;

    if (!claveUsuario) {
      return res.status(400).json({ message: 'Faltan parámetros' });
    }

    let infoUsuario;

    infoUsuario = await Clientes.findOne({
      where: {
        clicdclic: claveUsuario.trim()
      }
    });

    if (!infoUsuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(infoUsuario);
  } catch (error) {
    console.error("Error en el controlador perfil:", error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}