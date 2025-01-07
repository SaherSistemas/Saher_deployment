const Almacenes1 = require('../models/CLIENTES/Almacenes1.js');
const Clientes = require('../models/CLIENTES/Clientes.js');
const CuentasxCobrar = require('../models/CLIENTES/CuentasxCobrar.js');
const CuentasxCobrar1 = require('../models/CLIENTES/CuentasxCobrar1.js');
const { Sequelize, Op, literal } = require('sequelize');
const Preciogpo = require('../models/CLIENTES/PrecioGpo.js');
const articulos = require('../models/ARTICULOS/Articulos.js');
const Caducidades = require('../models/ARTICULOS/Caducidades.js');
const Pedidos = require('../models/PEDIDOS/Pedidos.js');
const numerador = require('../models/ARTICULOS/Numerador.js');
const Pedido1 = require('../models/PEDIDOS/Pedidos1.js');
const Remision = require('../models/CLIENTES/Remision.js');
const nodemailer = require('nodemailer');
const Factura = require('../models/CLIENTES/Facturas.js');


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
    console.error('Error al obtener las facturas:', error);
    next();
    return res.status(500).json({ error: 'Error al obtener las facturas.' });
  }
};


exports.totalFacturas = async (req, res, next) => {
  try {
    const { claveUsuario } = req.params;

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

    for (const factura of facturas) {
      const pagos = await CuentasxCobrar1.findAll({
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('cxcimppan')), 'total_pagado']
        ],
        where: {
          clicdclic: factura.clicdclic,
          empcdempn: factura.empcdempn,
          cxcnudocn: factura.cxcnudocn
        },
        raw: true
      });

      const totalPagado = pagos[0]?.total_pagado || 0;

      const totalFactura = Math.round(parseFloat(factura.dataValues.total_suma) * 100) / 100;

      const totalDeuda = Math.round((totalFactura - totalPagado) * 100) / 100;


      factura.dataValues.total_pagado = Math.round(totalPagado * 100) / 100;
      factura.dataValues.total_deuda = totalDeuda;
    }
    // Si no se encuentran facturas, buscar las remisiones
    if (facturas.length === 0) {
      const remisiones = await Remision.findAll({
        where: {
          clicdclic: claveUsuario,
          empcdempn: 20,
          remstatuc: 'A'
        }
      });
      const remnufacns = remisiones.map(remision => remision.remnufacn);

      let facturasEncontradas = [];
      for (const remnufacn of remnufacns) {
        const facturasRem = await CuentasxCobrar.findAll({
          attributes: [
            'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
            'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
            'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
            [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
          ],
          where: {
            cxcnudocn: remnufacn,
            empcdempn: 20,
            cxcstatuc: 'C'
          },
          group: [
            'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
            'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
            'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
          ]
        });
        if (facturasRem.length > 0) {
          facturasEncontradas.push(...facturasRem);
        }
      }


      // Calcular pagos y deudas
      for (const factura of facturasEncontradas) {
        const pagos = await CuentasxCobrar1.findAll({
          attributes: [
            [Sequelize.fn('SUM', Sequelize.col('cxcimppan')), 'total_pagado']
          ],
          where: {
            empcdempn: factura.empcdempn,
            cxcnudocn: factura.cxcnudocn
          },
          raw: true
        });

        const totalPagado = pagos[0]?.total_pagado || 0;
        const totalFactura = Math.round(parseFloat(factura.dataValues.total_suma) * 100) / 100;
        const totalDeuda = Math.round((totalFactura - totalPagado) * 100) / 100;

        factura.dataValues.total_pagado = Math.round(totalPagado * 100) / 100;
        factura.dataValues.total_deuda = totalDeuda;
      }

      return res.status(200).json(facturasEncontradas);
    } else {
      return res.status(200).json(facturas);
    }

  } catch (error) {
    console.error('Error:', error);
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
    console.error('Error al obtener el grupo:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el grupo' });
  }
};


exports.obtenerDatosPorGrupo = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 52;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.nombre || '';

    const grupo = req.query.grupoPrecio;



    const whereCondition = {
      ...searchTerm && {
        [Op.or]: [
          { artdsartc: { [Op.iLike]: `%${searchTerm}%` } },
          { artdsgenc: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      artstatuc: 'A'
    };

    const { count: totalAlmacen, rows: articulosAlmacenPru } = await Almacenes1.findAndCountAll({
      attributes: ['empcdempn', 'almexistn'],
      include: [{
        model: articulos,
        as: 'articulo',
        attributes: ['artcdartn', 'artdsartc', 'artdsgenc', 'artemporn'],
        where: whereCondition
      }],
      where: { empcdempn: 20, almcdalmn: 1 },
      offset: offset,
      limit: limit
    });


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


    const caducidadesProximas = await Caducidades.findAll({
      attributes: ['empcdempn', 'artcdartn', 'cadfeccad', 'cadpiezan'],
      where: {
        empcdempn: 20,
        cadfeccad: { [Op.gte]: new Date() },
        cadpiezan: { [Op.gt]: 0 }
      }
    });


    const articulosAlmacenData = articulosAlmacenPru.map(item => item.toJSON());
    const articulosPrecioData = articulosPrecGrup.map(item => item.toJSON());
    const caducidadesData = caducidadesProximas.map(item => item.toJSON());

    const articulosCombinados = articulosAlmacenData.map(almacen => {
      const precio = articulosPrecioData.find(precio => precio.artcdartn === almacen.articulo.artcdartn);


      const caducidad = caducidadesData
        .filter(cad => cad.artcdartn === almacen.articulo.artcdartn)
        .sort((a, b) => new Date(a.cadfeccad) - new Date(b.cadfeccad))[0];

      return {
        ...almacen,
        precioGrupo: precio ? precio.grpprecin : null,
        caducidad: caducidad ? caducidad.cadfeccad : null
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
    console.error('Error al obtener el producto:', error);

    res.status(500).json({ error: 'Error al obtener los datos del producto' });
  }
};

exports.obtenerRFC = async (req, res, next) => {
  try {
    const { clicdclic } = req.params;

    const rfcCliente = await Clientes.findOne({
      attributes: ['clicvrfcc'],
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
    console.error('Error al obtener el grupo:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el grupo' });
  }
};

exports.obtenerDatosPorGrupoParaPedido = async (req, res, next) => {
  try {
    const searchTerm = req.query.nombre || '';
    const grupo = req.query.grupoPrecio;

    const whereCondition = {
      ...searchTerm && {
        [Op.or]: [
          { artdsartc: { [Op.iLike]: `%${searchTerm}%` } },
          { artdsgenc: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      }
    };

    // Agregar límite a la consulta de Almacenes1
    const articulosAlmacenPru = await Almacenes1.findAll({
      attributes: ['empcdempn', 'almexistn'],
      include: [{
        model: articulos,
        as: 'articulo',
        attributes: ['artcdartn', 'artdsartc', 'artdsgenc', 'artemporn'],
        where: whereCondition
      }],
      where: {
        empcdempn: 20, almcdalmn: 1,
      },
      order: [
        [literal('almexistn DESC')]
      ],
      limit: 20 // Limita los resultados a los primeros 20
    });

    // Agregar límite a la consulta de Preciogpo
    const articulosPrecGrup = await Preciogpo.findAll({
      attributes: ['grpcdgrpn', 'artcdartn', 'grpprecin', 'grppreofn', 'grpfecofd'],
      include: [{
        model: articulos,
        as: 'articulo',
        attributes: ['artcdartn', 'artdsartc', 'artdsgenc'],
        where: whereCondition
      }],
      where: { grpcdgrpn: grupo },
      limit: 20 // Limita los resultados a los primeros 20
    });

    // Agregar límite a la consulta de Caducidades
    const caducidadesProximas = await Caducidades.findAll({
      attributes: ['empcdempn', 'artcdartn', 'cadfeccad', 'cadpiezan'],
      where: {
        empcdempn: 20,
        cadfeccad: { [Op.gte]: new Date() },
        cadpiezan: { [Op.gt]: 0 }
      },
      limit: 20 // Limita los resultados a los primeros 20
    });

    const articulosAlmacenData = articulosAlmacenPru.map(item => item.toJSON());
    const articulosPrecioData = articulosPrecGrup.map(item => item.toJSON());
    const caducidadesData = caducidadesProximas.map(item => item.toJSON());

    const articulosCombinados = articulosAlmacenData.map(almacen => {
      const precio = articulosPrecioData.find(precio => precio.artcdartn === almacen.articulo.artcdartn);

      const caducidad = caducidadesData
        .filter(cad => cad.artcdartn === almacen.articulo.artcdartn)
        .sort((a, b) => new Date(a.cadfeccad) - new Date(b.cadfeccad))[0];

      let precioReal = null;
      if (precio) {
        if (precio.grppreofn && new Date(precio.grpfecofd) >= new Date()) {
          precioReal = precio.grppreofn;
        } else {
          precioReal = precio.grpprecin;
        }
      }

      return {
        ...almacen,
        precioGrupo: precio ? precio.grpprecin : null,
        caducidad: caducidad ? caducidad.cadfeccad : null,
        grppreofn: precio ? precio.grppreofn : null,
        grpfecofd: precio ? precio.grpfecofd : null,
        precioReal: precioReal
      };
    });

    res.status(200).json(articulosCombinados);
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los datos' });
  }
};


exports.hacerPedido = async (req, res, next) => {
  const resultado = await numerador.findOne({
    attributes: ['numfolcon'],
    where: {
      numcdnumn: 14,
      empcdempn: 20,
    },
  });
  let sigRegistro = 0;

  if (resultado) {
    const numfolcon = resultado.numfolcon;
    console.log('Numfolcon', numfolcon)
    const numEnter = parseInt(numfolcon, 10);
    sigRegistro = numEnter + 1;
  }
  console.log(sigRegistro)
  const { empcdempn, pdifecped, pdihorrec, clicdclic, carrito } = req.body;

  const nuevoPedido = {
    empcdempn: empcdempn,
    pdicdpdin: sigRegistro,
    pdifecped: pdifecped,
    pdifecfad: '0001-01-01',
    pdistatuc: 'P',
    pdifolpec: '',
    pdipaquec: '',
    pdinumguc: '',
    pditelmac: 'T',
    clicdclic: clicdclic,
    pdihorrec: pdihorrec,
    pdihorfac: '',
    pdihorauc: '',
    paqcdpaqn: 0,
    pdiimguan: 0,
    pdiimguin: 0,
    pdiussurc: '',
    pdihosurc: '',
    pdiuschec: '',
    pdihochec: '',
    pdiusempc: '',
    pdihoempc: '',
  };


  const pedidoEncabezado = await Pedidos.create(nuevoPedido);



  const pedidos = carrito.map((item) => {
    const { almexistn, articulo, precioGrupo, caducidad, grppreofn, grpfecofd, precioReal, cantidad } = item;
    const { artcdartn, artdsartc, artdsgenc, artemporn } = articulo;


    const pdidescrc = artdsartc.substring(0, 5);


    const pdiaplofc = grppreofn !== '0.00' && grppreofn !== precioReal ? 'S' : 'N';


    return {
      empcdempn: 20,
      pdicdpdin: sigRegistro,
      artcdartn,
      pdiaplofc,
      pdidescrc,
      pdicntpdn: cantidad,
      pdicntsun: cantidad,
      pdicntchn: 0,
      pdiprevtn: precioReal,
      pdipranon: precioReal,
      pdiaplagc: '',
      pdipasilc: '',
      pdianaqun: 0,
      pdiniveln: 0,
      pdiposicn: 0,
      pdipesokn: 0,
    };
  });

  await Pedido1.bulkCreate(pedidos);


  const ulti = sigRegistro
  await numerador.update(
    { numfolcon: ulti },
    { where: { numcdnumn: 14, empcdempn: 20 } }
  )
  const agente = await Clientes.findOne({
    attributes: ['cliagecvn'],
    where: {
      clicdclic: clicdclic,
    }
  })

  const diccionario = {
    25: "mezariverapedroluis@gmail.com",
    19: "mezariverapedroluis@gmail.com",
    13: "mezariverapedroluis@gmail.com",
    5: "mezariverapedroluis@gmail.com",
    4: "mezariverapedroluis@gmail.com"
  };


  if (agente && agente.cliagecvn) {
    const key = agente.cliagecvn;
    const email = diccionario[key];

    if (email) {
      console.log(`El email asociado es: ${email}`);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'farmacias.saher@gmail.com',
          pass: 'ahpa uwpg bkoa lulp',
        },
      });

      const nomCliente = await Clientes.findOne({
        attributes: ['clirazonc'],
        where: {
          clicdclic: clicdclic,
        }
      })

      const correo = {
        from: 'farmacias.saher@gmail.com',
        to: `${email}`,
        subject: `Nuevo Pedido Realizado: ${sigRegistro}`,
        html: `
        <h1>Pedido Realizado</h1>
        <p>Se ha realizado un nuevo pedido con el siguiente folio:</p>
        <p><strong>Pedido: ${sigRegistro}</strong></p>
        <p><strong>Cliente:</strong> ${nomCliente.dataValues.clirazonc}</p>
        <p><strong>Fecha:</strong> ${pdifecped}</p>
        <p>Gracias por usar nuestro sistema.</p>
      `,
      };

      await transporter.sendMail(correo);

      console.log('Correo enviado con éxito.');
    } else {
      console.log('No se encontró un email asociado para esta clave.');
    }
  } else {
    console.log('No se encontró el agente.');
  }
  /*
    25:  FABIAN RENTERIA
    19: NUBIA SAMANTA
    13:ESTEBAN 
    5: LUCANO
    4: DAGOBERTO
    LUCANO, ESTEBAN, FABIAN RENTERIA, DAGOBERTO
  
  */


  res.json({ mensaje: 'Pedido realizado y correo enviado.' });

};
exports.pedido = async (req, res, next) => {
  try {
    const cliente = req.query.clicdclic;
    const { fechaInicio, fechaFin } = req.query;

    // Validación de parámetros
    if (!cliente || !fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: "Parámetros incompletos: cliente, fechaInicio o fechaFin." });
    }

    // Obtener los pedidos
    const pedidos = await Pedidos.findAll({
      attributes: [
        "empcdempn",
        "pdicdpdin", // Número de pedido (folio)
        "pdifecped",
        "pdiussurc",
        "pdiuschec",
        "pdiusempc",
        "pdihorfac",
        "clicdclic",
        "pdifecfad",
        "pdistatuc"
      ],
      where: {
        clicdclic: cliente,
        empcdempn: 20,
        pdifecped: {
          [Op.between]: [fechaInicio, fechaFin],
        }
      },
      order: [
        ['pdifecped', 'DESC'] // Ordenar por fecha de pedido descendente
      ],
    });

    // Obtener las facturas
    const facturas = await Factura.findAll({
      attributes: [
        'fclfacdigc', // Folio digital de la factura
        'fclfolpec',  // Folio del pedido
      ],
      where: {
        clicdclic: cliente,
        empcdempn: 20,
      },
    });

    // Crear un mapa para emparejar las facturas con los pedidos
    const facturaMap = facturas.reduce((map, factura) => {
      map[factura.fclfolpec.trim()] = factura.fclfacdigc.trim();
      return map;
    }, {});


    // Combinar pedidos con su respectiva factura digital
    const pedidosConFacturas = pedidos.map((pedido) => {
      const pedidoJSON = pedido.toJSON(); // Convertir a JSON para manejar fácilmente el objeto
      return {
        ...pedidoJSON,
        facturaDigital: facturaMap[pedidoJSON.pdicdpdin.trim()] || null,
      };
    });

    res.json({ pedidos: pedidosConFacturas });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ mensaje: "Error al obtener los pedidos." });
  }
};

