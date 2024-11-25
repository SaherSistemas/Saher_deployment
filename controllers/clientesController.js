const Almacenes1 = require('../models/CLIENTES/Almacenes1.js');
const Clientes = require('../models/CLIENTES/Clientes.js');
const CuentasxCobrar = require('../models/CLIENTES/CuentasxCobrar.js');
const CuentasxCobrar1 = require('../models/CLIENTES/CuentasxCobrar1.js');
const { Sequelize, Op, } = require('sequelize');
const Preciogpo = require('../models/CLIENTES/PrecioGpo.js');
const articulos = require('../models/ARTICULOS/Articulos.js');
const Caducidades = require('../models/ARTICULOS/Caducidades.js');



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
      raw: true // Para obtener resultados como objetos simples de JavaScript
    });

    // Limpiar espacios en blanco adicionales
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
    const page = parseInt(req.query.page) || 1; // Número de página, por defecto 1
    const limit = parseInt(req.query.limit) || 50; // Cantidad de registros por página, por defecto 50
    const offset = (page - 1) * limit;
    const searchTerm = req.query.nombre || ''; // Término de búsqueda, por defecto vacío
    const estado = req.query.estado || 'A'; // Estado, por defecto 'A' para activos

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

    // Responde con los resultados de la consulta
    return res.status(200).json(facturas);
  } catch (error) {
    console.error('Error al obtener las facturas:', error);
    next();
    return res.status(500).json({ error: 'Error al obtener las facturas.' });
  }
};


exports.totalFacturas = async (req, res, next) => {
  try {
    const { claveUsuario } = req.params;
    // Paso 1: Obtener las facturas y el total de cada una
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

    // Paso 2: Obtener los pagos asociados a cada factura
    for (const factura of facturas) {
      const pagos = await CuentasxCobrar1.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('cxcimppan')), 'total_pagado']
        ],
        where: {
          clicdclic: factura.clicdclic,
          empcdempn: factura.empcdempn,
          cxcnudocn: factura.cxcnudocn// Usamos el número de documento para filtrar los pagos
        },
        raw: true
      });

      const totalPagado = pagos[0]?.total_pagado || 0;
      // Asegurarte que totalFactura es un número flotante con 2 decimales
      const totalFactura = Math.round(parseFloat(factura.dataValues.total_suma) * 100) / 100;

      const totalDeuda = Math.round((totalFactura - totalPagado) * 100) / 100;

      // Agregar la deuda al resultado de la factura
      factura.dataValues.total_pagado = Math.round(totalPagado * 100) / 100;
      factura.dataValues.total_deuda = totalDeuda;
    }

    res.status(200).json(facturas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el grupo' });
  }
}

exports.claveGrp = async (req, res, next) => {
  try {
    const { clicdclic } = req.params;
    // Consulta para obtener solo el grpcdgrpn
    const rfcCliente = await Clientes.findOne({
      attributes: ['grpcdgrpn'],  // Solo se selecciona el campo grpcdgrpn
      where: {
        clicdclic: clicdclic  // Busca por la clave del rfcCliente
      }
    });

    if (rfcCliente) {
      res.status(200).json(rfcCliente);
    } else {
      res.status(404).json({ error: 'Cliente no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener el grupo:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el grupo' });
  }
};


exports.obtenerDatosPorGrupo = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; // Número de página, por defecto 1
    const limit = parseInt(req.query.limit) || 52; // Cantidad de registros por página, por defecto 50
    const offset = (page - 1) * limit;
    const searchTerm = req.query.nombre || ''; // Término de búsqueda, por defecto vacío

    const grupo = req.query.grupoPrecio; // Grupo de precio desde el query


    //TERMINO DE BUSQUEDA 
    const whereCondition = {
      ...searchTerm && {
        [Op.or]: [
          { artdsartc: { [Op.iLike]: `%${searchTerm}%` } },
          { artdsgenc: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      }
    };
    // Obtener los artículos del almacén
    const { count: totalAlmacen, rows: articulosAlmacenPru } = await Almacenes1.findAndCountAll({
      attributes: ['empcdempn', 'almexistn'],
      include: [{
        model: articulos,
        as: 'articulo', // Alias definido en la asociación
        attributes: ['artcdartn', 'artdsartc', 'artdsgenc', 'artemporn'],
        where: whereCondition
      }],
      where: { empcdempn: 20, almcdalmn: 1 },
      offset: offset,
      limit: limit
    });

    // Obtener los precios del grupo
    const articulosPrecGrup = await Preciogpo.findAll({
      attributes: ['grpcdgrpn', 'artcdartn', 'grpprecin'],
      include: [{
        model: articulos,
        as: 'articulo',
        attributes: ['artcdartn', 'artdsartc', 'artdsgenc'],
        where: whereCondition
      }],
      where: { grpcdgrpn: grupo }
    });

    // Obtener la caducidad más próxima
    const caducidadesProximas = await Caducidades.findAll({
      attributes: ['empcdempn','artcdartn', 'cadfeccad', 'cadpiezan'],
      where: {
        empcdempn:20,
        cadfeccad: { [Op.gte]: new Date() }, // Filtrar por caducidades futuras
        cadpiezan: { [Op.gt]: 0 }  // Filtrar donde cadpiezan sea mayor que 0
      }
    });

    // Convertir los resultados a formato JSON para facilitar la manipulación
    const articulosAlmacenData = articulosAlmacenPru.map(item => item.toJSON());
    const articulosPrecioData = articulosPrecGrup.map(item => item.toJSON());
    const caducidadesData = caducidadesProximas.map(item => item.toJSON());

    // Unir los resultados de almacén y precios
    const articulosCombinados = articulosAlmacenData.map(almacen => {
      const precio = articulosPrecioData.find(precio => precio.artcdartn === almacen.articulo.artcdartn);

      // Buscar la caducidad más próxima para cada artículo
      const caducidad = caducidadesData
        .filter(cad => cad.artcdartn === almacen.articulo.artcdartn)
        .sort((a, b) => new Date(a.cadfeccad) - new Date(b.cadfeccad))[0]; // Ordenar por fecha de caducidad más próxima

      return {
        ...almacen, // Datos de Almacenes1
        precioGrupo: precio ? precio.grpprecin : null, // Añadir el precio si existe
        caducidad: caducidad ? caducidad.cadfeccad : null // Añadir la caducidad más próxima
      };
    });

    res.status(200).json({
      totalItems: totalAlmacen,
      totalPages: Math.ceil(totalAlmacen / limit),
      currentPage: page,
      items: articulosCombinados
    });
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los datos' });
  }
};


exports.obtenerDetalles = async (req, res, next) => {
  const { artcdartn } = req.params;

  try {
    // Obtener los datos del artículo en almacén
    const productoAlmacen = await Almacenes1.findOne({
      attributes: ['empcdempn', 'almexistn'],
      include: [{
        model: articulos,
        as: 'articulo', // Alias definido en la asociación
        attributes: ['artcdartn', 'artdsartc', 'artdsgenc', 'artemporn'],
        where: {
          artcdartn: artcdartn // Filtrando por el código de artículo (el valor recibido)
        }
      }],
      where: { empcdempn: 20, almcdalmn: 1 },
    });

    if (!productoAlmacen) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si se encuentra el producto, enviar los detalles
    res.status(200).json(productoAlmacen);
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    // Manejo de error con respuesta HTTP
    res.status(500).json({ error: 'Error al obtener los datos del producto' });
  }
};

exports.obtenerRFC = async (req, res, next) => {
  try {
    const { clicdclic } = req.params;
    // Consulta para obtener solo el grpcdgrpn
    const rfcCliente = await Clientes.findOne({
      attributes: ['clicvrfcc'],  // Solo se selecciona el campo grpcdgrpn
      where: {
        clicdclic: clicdclic  // Busca por la clave del rfcCliente
      }
    });

    if (rfcCliente) {
      res.status(200).json(rfcCliente);
    } else {
      res.status(404).json({ error: 'Cliente no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener el grupo:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el grupo' });
  }
};
