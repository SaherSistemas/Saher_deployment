const now = new Date();
const PDFDocument = require('pdfkit');
const { Sequelize, Op } = require('sequelize');
const nodemailer = require('nodemailer');
const Pedidos = require('../models/PEDIDOS/Pedidos')
const Pedido1 = require('../models/PEDIDOS/Pedidos1');
const Clientes = require('../models/CLIENTES/Clientes');
const CuentasxCobrar = require('../models/CLIENTES/CuentasxCobrar');
const Remision = require('../models/CLIENTES/Remision');
const articulos = require('../models/ARTICULOS/Articulos');
const iva = require('../models/ARTICULOS/Iva');
const numerador = require('../models/ARTICULOS/Numerador');
const Agentes = require('../models/AGENTES/Agentes');
const Factura = require('../models/CLIENTES/Facturas');


exports.actualizarPedido = async (req, res, next) => {
    try {
        const { pdicdpdin, carrito } = req.body;

        const cliente = await Pedidos.findOne({
            where:
            {
                pdicdpdin,
                empcdempn: 20
            },
            attributes: ['clicdclic'],
        })
        // Verificar saldo del cliente
        const saldoCliente = await Clientes.findByPk(cliente.dataValues.clicdclic.trim(), {
            attributes: ['clilimcrn', 'clisaldon']
        });
        const saldoDisponible = saldoCliente.dataValues.clilimcrn - saldoCliente.dataValues.clisaldon;

        // Calcular total de pedidos pendientes de facturar
        const pedidosPendientesDeFacturar = await Pedidos.findAll({
            where: {
                clicdclic: cliente.dataValues.clicdclic.trim(),
                pdistatuc: { [Op.in]: ['C', 'R', 'P'] },
                empcdempn: 20
            },
            attributes: ['pdicdpdin']
        });

        let totalPedidosPendientes = 0;
        if (pedidosPendientesDeFacturar && pedidosPendientesDeFacturar.length > 0) {
            for (const pedido of pedidosPendientesDeFacturar) {
                const pdicdpdin = pedido.dataValues.pdicdpdin;

                const articulosPedido = await Pedido1.findAll({
                    where: {
                        pdicdpdin,
                        empcdempn: 20
                    }
                });

                for (const articulo of articulosPedido) {
                    const precioArticulo = articulo.dataValues.pdiprevtn;
                    const cantidad = articulo.dataValues.pdicntpdn;

                    const articuloInfo = await articulos.findOne({
                        where: { artcdartn: articulo.dataValues.artcdartn },
                        attributes: ['ivacdivan']
                    });

                    const ivaP = await iva.findByPk(articuloInfo.dataValues.ivacdivan);
                    const ivaPorciento = ivaP.ivaporcen;

                    totalPedidosPendientes += (precioArticulo * cantidad) * (1 + ivaPorciento / 100);
                }
            }
        }

        // Calcular total del nuevo pedido
        let totalNuevoPedido = 0;
        for (const item of carrito) {
            const { cantidad, precioReal, articulo } = item;
            const { artcdartn } = articulo;

            const articuloInfo = await articulos.findOne({
                where: { artcdartn },
                attributes: ['ivacdivan']
            });

            const ivaP = await iva.findByPk(articuloInfo.dataValues.ivacdivan);
            const ivaPorciento = ivaP.ivaporcen;

            totalNuevoPedido += (precioReal * cantidad) * (1 + ivaPorciento / 100);
        }


        const totalPedidoCliente = totalPedidosPendientes + totalNuevoPedido;
        if (totalPedidoCliente > saldoDisponible) {
            return res.status(403).json({
                mensaje: 'El total del pedido nuevo y los pendientes excede el saldo disponible.',
            });
        }
        await Pedido1.destroy({ where: { pdicdpdin } });


        const nuevosArticulosPedido = carrito.map((item) => ({
            empcdempn: 20,
            pdicdpdin,
            artcdartn: item.articulo.artcdartn,
            pdiaplofc: 'N',
            pdidescrc: item.articulo.artdsartc.substring(0, 5),
            pdicntpdn: item.cantidad,
            pdicntsun: item.cantidad,
            pdicntchn: 0,
            pdiprevtn: item.precioReal,
            pdipranon: item.precioReal,
            pdiaplagc: '',
            pdipasilc: '',
            pdianaqun: 0,
            pdiniveln: 0,
            pdiposicn: 0,
            pdipesokn: 0,
        }))
        await Pedido1.bulkCreate(nuevosArticulosPedido)

        res.json({ mensaje: 'Pedido actualizado correctamente.' })
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
};


exports.generarCotizacion = async (req, res, next) => {
    const { carrito } = req.body;

    try {
        const doc = new PDFDocument({ margin: 40 });

        // Configuración de la respuesta HTTP
        res.setHeader('Content-Disposition', 'attachment; filename=pedido.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        try {
            // 🔹 Logo
            doc.image('ic_Saher_sinBg.png', 40, 40, { width: 100 });

            // 🔹 Título
            doc.fillColor("#333")
                .fontSize(18)
                .text("Cotización de Pedido", { align: "center" })
                .moveDown(1);

            // 🔹 Información del Cliente
            doc.fontSize(12)
                .text(`Fecha: ${new Date().toLocaleDateString()}`, { align: "right" })
                .moveDown()
                .text("Detalles del Cliente:", { underline: true, bold: true })
                .text("Nombre: Cliente Ejemplo")
                .text("Dirección: Calle Falsa 123")
                .text("Teléfono: 123-456-7890")
                .moveDown();

            // 🔹 Encabezado de la Tabla
            const yInicial = doc.y;
            doc.rect(40, yInicial, 520, 25).fill("#f2f2f2").stroke();
            doc.fillColor("#000").fontSize(12).text("Producto", 50, yInicial + 7)
                .text("Cantidad", 280, yInicial + 7, { width: 100, align: "right" })
                .text("Precio", 390, yInicial + 7, { width: 100, align: "right" })
                .text("Total", 500, yInicial + 7, { width: 100, align: "right" });

            doc.moveDown();

            // 🔹 Línea separadora
            doc.strokeColor("#666").moveTo(40, doc.y).lineTo(560, doc.y).stroke().moveDown(0.5);

            // 🔹 Contenido de la Tabla
            carrito.forEach((item) => {
                doc.fontSize(11)
                    .text(item.articulo.artdsartc, 50, doc.y, { width: 220 })
                    .text(item.cantidad.toString(), 280, doc.y, { width: 100, align: "right" })
                    .text(`$${item.precioReal.toFixed(2)}`, 390, doc.y, { width: 100, align: "right" })
                    .text(`$${(item.precioReal * item.cantidad).toFixed(2)}`, 500, doc.y, { width: 100, align: "right" })
                    .moveDown(0.5);
                doc.strokeColor("#666").moveTo(40, doc.y).lineTo(560, doc.y).stroke().moveDown();
            });

            // 🔹 Total en Rojo y en Negrita
            const total = carrito.reduce((sum, item) => sum + item.precioReal * item.cantidad, 0);
            doc.fillColor("red").fontSize(14)
                .text(`Total a Pagar: $${total.toFixed(2)}`, { align: "right", bold: true })
                .moveDown(1);
        } catch (error) {
            console.error("Error al generar contenido del PDF:", error);
        }

        doc.end();
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Error al generar el PDF" });
        }
    }
};



exports.hacerPedido = async (req, res, next) => {
    const { empcdempn, pdifecped, pdihorrec, clicdclic, carrito } = req.body;

    const facturasVencidas = await CuentasxCobrar.findAll({
        attributes: [
            'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
            'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
            'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
            [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
        ],
        where: {
            clicdclic: clicdclic,
            empcdempn: 20,
            cxcstatuc: 'C',
            cxcfevend: { [Op.lte]: new Date(new Date() - 1000 * 24 * 60 * 60 * 1000) },//CAMBIAR A 10 DIAS 
        },
        group: [
            'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
            'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
            'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
        ]
    });

    if (facturasVencidas.length > 0) {
        return res.status(403).json({
            mensaje: 'No puedes realizar un pedido debido a que tienes facturas vencidas con más de 10 días vencidas.',
        });
    }

    const remisiones = await Remision.findAll({
        where: {
            clicdclic,
            empcdempn: 20,
            remstatuc: 'A'
        }
    });

    for (const remision of remisiones) {
        const facturasRem = await CuentasxCobrar.findAll({
            attributes: [
                'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
                [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
            ],
            where: {
                cxcnudocn: remision.remnufacn,
                empcdempn: 20,
                cxcstatuc: 'C',
                cxcfevend: { [Op.lte]: new Date(new Date() - 1000 * 24 * 60 * 60 * 1000) }, //CAMBIAR A 10 DIAS 
            },
            group: [
                'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
            ]
        });

        if (facturasRem.length > 0) {
            return res.status(403).json({
                mensaje: 'No puedes realizar un pedido debido a que tienes remisiones vencidas con más de 10 días vencida.',
            });
        }
    }

    // Verificar saldo del cliente
    const saldoCliente = await Clientes.findByPk(clicdclic.trim(), {
        attributes: ['clilimcrn', 'clisaldon']
    });
    const saldoDisponible = saldoCliente.dataValues.clilimcrn - saldoCliente.dataValues.clisaldon;
    // Calcular total de pedidos pendientes de facturar
    const pedidosPendientesDeFacturar = await Pedidos.findAll({
        where: {
            clicdclic,
            pdistatuc: { [Op.in]: ['C', 'R', 'P', 'Z'] },
            empcdempn: 20
        },
        attributes: ['pdicdpdin']
    });

    let totalPedidosPendientes = 0;
    if (pedidosPendientesDeFacturar && pedidosPendientesDeFacturar.length > 0) {
        for (const pedido of pedidosPendientesDeFacturar) {
            const pdicdpdin = pedido.dataValues.pdicdpdin;

            const articulosPedido = await Pedido1.findAll({
                where: {
                    pdicdpdin,
                    empcdempn: 20
                }
            });

            for (const articulo of articulosPedido) {
                const precioArticulo = articulo.dataValues.pdiprevtn;
                const cantidad = articulo.dataValues.pdicntpdn;

                const articuloInfo = await articulos.findOne({
                    where: { artcdartn: articulo.dataValues.artcdartn },
                    attributes: ['ivacdivan']
                });

                const ivaP = await iva.findByPk(articuloInfo.dataValues.ivacdivan);
                const ivaPorciento = ivaP.ivaporcen;

                totalPedidosPendientes += (precioArticulo * cantidad) * (1 + ivaPorciento / 100);
            }
        }
    }

    // Calcular total del nuevo pedido
    let totalNuevoPedido = 0;
    for (const item of carrito) {
        const { cantidad, precioReal, articulo } = item;
        const { artcdartn } = articulo;

        const articuloInfo = await articulos.findOne({
            where: { artcdartn },
            attributes: ['ivacdivan']
        });

        const ivaP = await iva.findByPk(articuloInfo.dataValues.ivacdivan);
        const ivaPorciento = ivaP.ivaporcen;

        totalNuevoPedido += (precioReal * cantidad) * (1 + ivaPorciento / 100);
    }

    const totalPedidoCliente = totalPedidosPendientes + totalNuevoPedido;
    if (totalPedidoCliente > saldoDisponible) {
        return res.status(403).json({
            mensaje: 'El total del pedido nuevo y los pendientes excede el saldo disponible.',
        });
    }


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
        const numEnter = parseInt(numfolcon, 10);
        sigRegistro = numEnter + 1;
    }
    const nuevoPedido = {
        empcdempn: empcdempn,
        pdicdpdin: sigRegistro,
        pdifecped: pdifecped,
        pdifecfad: '0001-01-01',
        pdistatuc: 'Z',
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
    const correoAgente = await Agentes.findOne({
        attributes: ['ageplazac'],
        where: {
            agecdagen: agente.dataValues.cliagecvn,
        }
    })

    const email = correoAgente.dataValues?.ageplazac;
    if (email) {

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
      
          <h3>Detalle del Pedido</h3>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th>Código Artículo</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              ${carrito.map(item => {
                const { articulo, cantidad, precioReal } = item;
                return `
                  <tr>
                    <td>${articulo.artcdartn}</td>
                    <td>${articulo.artdsartc}</td>
                    <td>${cantidad}</td>
                    <td>${precioReal}</td>
                  </tr>
                `;
            }).join('')}
            </tbody>
          </table>
      
          <p>Gracias por usar nuestro sistema.</p>
        `,
        };

        await transporter.sendMail(correo);

    } else {
        console.log('No se encontró un email asociado para esta clave.');
    }
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
        res.status(500).json({ mensaje: "Error al obtener los pedidos." });
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
            return res.status(200).json({ message: 'No se encontraron pedidos para los clientes asociados' });
        }

        // Añade la razón social al resultado
        const pedidosConRazonSocial = pedidos.map(pedido => ({
            ...pedido.toJSON(),
            clirazonc: clienteMap[pedido.clicdclic]
        }));

        res.status(200).json(pedidosConRazonSocial);
    } catch (error) {

        res.status(500).json({ error: error.message });
    }
};



exports.detallePedido = async (req, res) => {
    try {
        const { pedidoId } = req.params;

        const detalles = await Pedido1.findAll({
            where: {
                pdicdpdin: pedidoId,
                empcdempn: 20
            },
            include: [
                {
                    model: articulos,
                    as: 'articulos',
                    attributes: ['artdsartc', 'ivacdivan'],
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



exports.pedidoCaptura = async (req, res, next) => {
    try {

        const { clicdclic } = req.query;

        const pedidoEnCaptura = await Pedidos.findAll({
            where:
            {
                clicdclic: clicdclic,
                [Op.or]: [
                    { pdistatuc: 'E' },
                ],
                empcdempn: 20
            }
        })


        return res.status(200).json({
            pedidoEnCaptura: pedidoEnCaptura,
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Hubo un problema.',
            details: error.message
        });
    }
};
exports.pedidoCotizacion = async (req, res, next) => {
    try {

        const { clicdclic } = req.query;

        const pedidoEnCotizacion = await Pedidos.findAll({
            where:
            {
                clicdclic: clicdclic,
                [Op.or]: [
                    { pdistatuc: 'Z' }
                ],
                empcdempn: 20
            }
        })


        return res.status(200).json({
            pedidoEnCotizacion: pedidoEnCotizacion,
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Hubo un problema.',
            details: error.message
        });
    }
};

exports.procesarPedido = async (req, res, next) => {
    const { pdicdpdin } = req.body;
    try {
        await Pedidos.update(
            {
                pdistatuc: 'C',
                pdifecped: now.toISOString().split('T')[0],
                pdihorrec: now.toTimeString().split(' ')[0]
            },
            { where: { pdicdpdin } }
        )


        res.json({ mensaje: 'Pedido procesado correctamente.' });
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }
}

exports.cambiarEnCaptura = async (req, res, next) => {
    const { pdicdpdin, clienteId } = req.body;
    try {
        const pedidosEnCaptura = await Pedidos.findAll(
            {
                where: {
                    clicdclic: clienteId,
                    pdistatuc: 'E',
                    empcdempn: 20
                }
            }
        )
        if (pedidosEnCaptura.length > 0) {
            return res.status(404).json({ message: 'Ya tiene un pedido en captura' });
        }
        await Pedidos.update(
            {
                pdistatuc: 'E',
            },
            { where: { pdicdpdin } }
        )
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }
}