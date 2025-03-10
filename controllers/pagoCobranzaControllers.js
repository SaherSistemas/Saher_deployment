const PDFDocument = require("pdfkit");
const { Op } = require('sequelize');
const Bancos = require('../models/PAGO-COBRANZA/Bancos');
const Sequelize = require('../database/index')
const Blorecibos = require('../models/PAGO-COBRANZA/Blorecibos');
const Recibos = require('../models/PAGO-COBRANZA/Recibos');
const Recibos1 = require('../models/PAGO-COBRANZA/Recibos1');
const Recibos2 = require('../models/PAGO-COBRANZA/Recibos2');
const Remision = require('../models/CLIENTES/Remision');
const Clientes = require('../models/CLIENTES/Clientes');
const CuentasxCobrar = require('../models/CLIENTES/CuentasxCobrar');
const CuentasxCobrar1 = require('../models/CLIENTES/CuentasxCobrar1')


exports.bancos = async (req, res, next) => {
    try {
        const bancos = await Bancos.findAll({
            attributes: ['bancdbann', 'bandsbann'],
            where: { bancdbann: { [Op.ne]: 0 } },
            order: [['bancdbann', 'ASC']],
            raw: true
        });

        const bancosLimpio = bancos.map(banco => ({
            bancdbann: banco.bancdbann,
            bandsbann: banco.bandsbann.trim().toUpperCase(),
        }));

        res.status(200).json(bancosLimpio);
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
};


exports.registrarPago = async (req, res, next) => {
    const { numeroRecibo, fechaDeposito, clienteId, tipodoc, banco, totaldepositado, facturas } = req.body;
    const agente = facturas[0].agecdagen;
    try {
        const blocRecibos = await Blorecibos.findAll({
            where: {
                agecdagen: agente,
                blostatuc: 'V',
                empcdempn: 20
            }
        });

        const reciboValido = blocRecibos.some(blorecibo =>
            numeroRecibo >= blorecibo.blofolinn && numeroRecibo <= blorecibo.blofolfin
        );

        if (!reciboValido) {
            return res.status(400).json({ message: "El recibo no pertenece al Agente" });
        }

        const reciboExiste = await Recibos.findAll({
            where: {
                empcdempn: 20,
                rbocdrbon: numeroRecibo,
            }
        });

        if (reciboExiste.length > 0) {
            return res.status(400).json({ message: "El recibo ya está registrado" });
        }

        const infoRecibo = {
            empcdempn: 20,
            rbocdrbon: numeroRecibo,
            rbofecred: fechaDeposito,
            rbofeccad: '0001-01-01',
            rbofecapD: '0001-01-01',
            rboimpden: totaldepositado,
            rbototren: totaldepositado,
            rbostatuc: 'C',
            rboctnfan: facturas.length,
            rbofecpad: '0001-01-01',
            clicdclic: facturas[0].clicdclic,
            rbofolfic: '',
            rbouuidrc: ''
        };

        const infoRecibo1 = {
            empcdempn: 20,
            rbocdrbon: numeroRecibo,
            rbonummon: 1,
            rbotipdocc: tipodoc,
            rbocdbann: banco,
            rboimdepn: totaldepositado
        };
        const infoRecibo2 = facturas.map((factura, index) => ({
            empcdempn: factura.empcdempn,
            rbocdrbon: parseFloat(numeroRecibo),
            rbonofacn: index + 1,
            rbofactun: parseFloat(factura.cxcnudocn),
            rboimpfac: parseFloat(factura.total_suma),
            rbontcren: null,
            rboimpntn: null,
            rboimppan: parseFloat(factura.abono),
            rbofdigc: factura.cxcfoldic.trim(),
            rbosaldon: 0
        }));

        try {
            await Recibos.create(infoRecibo);
            await Recibos1.create(infoRecibo1);

            if (infoRecibo2.length === 1) {
                await Recibos2.create(infoRecibo2[0]); // Para un solo registro
            } else if (infoRecibo2.length > 1) {
                await Recibos2.bulkCreate(infoRecibo2); // Para múltiples registros
            }


            res.status(200).json({ message: "Pago recibido correctamente" });
        } catch (error) {
            console.error("Error al registrar el pago:", error);
            res.status(500).json({ message: "Error al registrar el pago" });
        }
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


exports.blocksRecibos = async (req, res) => {
    try {
        const { claveAgente } = req.query;

        if (!claveAgente) {
            return res.status(400).json({ mensaje: "Falta el claveAgente en la petición." });
        }

        const blocRecibos = await Blorecibos.findAll({
            where: {
                agecdagen: claveAgente,
                empcdempn: 20
            },
            order: [
                ["blofecend", "DESC"]
            ]
        });

        // Verifica si se encontraron registros
        if (blocRecibos.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron recibos para este agente." });
        }

        res.json({ mensaje: "Datos recibidos correctamente", recibos: blocRecibos || [] });


    } catch (error) {
        console.error("Error al obtener los recibos:", error);
        res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
    }
};



exports.obtenerRecibosDetalle = async (req, res) => {
    try {
        const { folioIni } = req.query;
        if (!folioIni) {
            return res.status(400).json({ message: "Se requiere folioIni" });
        }

        // Obtener el folio final desde blorecibos
        const blorecibo = await Blorecibos.findOne({
            where: {
                blofolinn: folioIni,
                empcdempn: 20
            }
        });
        if (!blorecibo) {
            return res.json([]);
        }

        const folioFin = blorecibo.dataValues.blofolfin;

        const recibos = await Recibos.findAll({
            where: {
                rbocdrbon: {
                    [Op.between]: [folioIni, folioFin]
                },
                empcdempn: 20
            },
        });
        res.json(recibos.length > 0 ? recibos : []);
    } catch (error) {
        console.error("Error al obtener recibos", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


exports.eliminarRecibos = async (req, res) => {
    const { rbocdrbon } = req.query;
    try {
        await Recibos.destroy({
            where: { rbocdrbon },
        });
        await Recibos1.destroy({
            where: { rbocdrbon },
        });
        await Recibos2.destroy({
            where: { rbocdrbon },
        });
        res.status(200).json({ message: 'Recibos eliminados exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar recibos', details: error })
    }
}
exports.generarEstadoDeCuenta = async (req, res, next) => {
    try {
        const { clicdclic } = req.params;
        const { clinomcoc } = await Clientes.findByPk(clicdclic);
        const tieneAbarrote = clinomcoc.toLowerCase().includes("abarrote");

        let facturasConPagos = [];

        if (tieneAbarrote) {
            const remisiones = await Remision.findAll({
                where: {
                    clicdclic: clicdclic,
                    empcdempn: 20,
                    remstatuc: 'A'
                },
                order: [['remfecred', 'DESC']],
                limit: 20
            });

            if (!remisiones.length) {
                facturasConPagos = [];
            } else {
                const remnufacns = remisiones.map(remision => remision.remnufacn);
                const facturasEncontradas = await CuentasxCobrar.findAll({
                    attributes: [
                        'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                        'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                        'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
                        [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
                    ],
                    where: {
                        cxcnudocn: { [Op.in]: remnufacns },
                        empcdempn: 20,
                        cxcstatuc: 'C'
                    },
                    group: [
                        'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                        'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                        'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
                    ],
                    order: [['cxcfevend', 'DESC']]
                });

                if (!facturasEncontradas.length) {
                    facturasConPagos = [];
                } else {
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

                    // Crear un mapa de pagos por documento
                    const pagosMap = pagos.reduce((map, pago) => {
                        map[pago.cxcnudocn] = parseFloat(pago.total_pagado) || 0;
                        return map;
                    }, {});

                    let resultados = [];
                    facturasEncontradas.forEach(factura => {
                        // Usar el mapa de pagos para obtener el pago correspondiente a cada factura
                        const totalPagado = pagosMap[factura.cxcnudocn] || 0;
                        const totalFactura = parseFloat(factura.dataValues.total_suma) || 0;
                        const totalDeuda = totalFactura - totalPagado;

                        // Formatear números con coma cada 3 dígitos
                        const totalFacturaFormateado = totalFactura.toLocaleString('en-US');
                        const totalPagadoFormateado = totalPagado.toLocaleString('en-US');
                        const totalDeudaFormateado = totalDeuda.toLocaleString('en-US');

                        // Formatear la fecha en formato DD/MM/AAAA con dos dígitos en día y mes
                        const fechaVencimiento = factura.cxcfevend;
                        const fecha = new Date(fechaVencimiento);
                        const dia = String(fecha.getDate()).padStart(2, '0');  // Asegura dos dígitos para el día
                        const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Asegura dos dígitos para el mes
                        const anio = fecha.getFullYear();
                        const fechaFormateada = `${dia}/${mes}/${anio}`;

                        // Asegúrate de que no queden valores `undefined`
                        factura.dataValues.total_suma = totalFacturaFormateado;
                        factura.dataValues.total_pagado = totalPagadoFormateado;
                        factura.dataValues.total_deuda = totalDeudaFormateado;

                        // Almacenar los resultados en el array
                        resultados.push({
                            factura: factura.cxcnudocn,
                            fechaVencimiento: fechaFormateada,  // Fecha ya formateada
                            totalFactura: factura.dataValues.total_suma,
                            totalPagado: factura.dataValues.total_pagado,
                            totalDeuda: factura.dataValues.total_deuda
                        });
                    });

                    facturasConPagos = resultados;
                }
            }
        } else {
            const facturas = await CuentasxCobrar.findAll({
                attributes: [
                    'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                    'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                    'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
                    [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
                ],
                where: {
                    clicdclic: clicdclic,
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
                const pagos = await CuentasxCobrar1.findAll({
                    attributes: [
                        'cxcnudocn',
                        [Sequelize.fn('SUM', Sequelize.col('cxcimppan')), 'total_pagado']
                    ],
                    where: {
                        empcdempn: 20,
                        cxcnudocn: { [Op.in]: facturas.map(factura => factura.cxcnudocn) }
                    },
                    group: ['cxcnudocn'],
                    raw: true
                });

                // Crear un mapa de pagos por documento
                const pagosMap = pagos.reduce((map, pago) => {
                    map[pago.cxcnudocn] = parseFloat(pago.total_pagado) || 0;
                    return map;
                }, {});

                let resultados = [];
                facturas.forEach(factura => {
                    // Usar el mapa de pagos para obtener el pago correspondiente a cada factura
                    const totalPagado = pagosMap[factura.cxcnudocn] || 0;
                    const totalFactura = parseFloat(factura.dataValues.total_suma) || 0;
                    const totalDeuda = totalFactura - totalPagado;

                    // Formatear números con coma cada 3 dígitos
                    const totalFacturaFormateado = totalFactura.toLocaleString('en-US');
                    const totalPagadoFormateado = totalPagado.toLocaleString('en-US');
                    const totalDeudaFormateado = totalDeuda.toLocaleString('en-US');


                    // Formatear la fecha en formato DD/MM/AAAA con dos dígitos en día y mes
                    const fechaVencimiento = factura.cxcfevend;
                    const fecha = new Date(fechaVencimiento);
                    const dia = String(fecha.getDate()).padStart(2, '0');  // Asegura dos dígitos para el día
                    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Asegura dos dígitos para el mes
                    const anio = fecha.getFullYear();
                    const fechaFormateada = `${dia}/${mes}/${anio}`;

                    // Asegúrate de que no queden valores `undefined`
                    factura.dataValues.total_suma = totalFacturaFormateado;
                    factura.dataValues.total_pagado = totalPagadoFormateado;
                    factura.dataValues.total_deuda = totalDeudaFormateado;

                    // Almacenar los resultados en el array
                    resultados.push({
                        factura: factura.cxcnudocn,
                        fechaVencimiento: fechaFormateada,  // Fecha ya formateada
                        totalFactura: factura.dataValues.total_suma,
                        totalPagado: factura.dataValues.total_pagado,
                        totalDeuda: factura.dataValues.total_deuda
                    });
                });

                facturasConPagos = resultados;
            } else {
                facturasConPagos = [];  // Si no se encuentran facturas, asignar un arreglo vacío
            }
        }

        // Crear un documento PDF
        const doc = new PDFDocument();

        // Agregar un título
        doc.fontSize(20).text('Estado de Cuenta', { align: 'center' });
        doc.moveDown();


        facturasConPagos.forEach((factura) => {
            // Validar si los datos existen antes de usarlos
            const facturaNumero = factura.factura || 'No disponible';
            const fechaVencimiento = factura.fechaVencimiento || 'No disponible';
            const totalFactura = factura.totalFactura ? `$${factura.totalFactura}` : '$0.00';
            const totalPagado = factura.totalPagado ? `$${factura.totalPagado}` : '$0.00';
            const deudaPendiente = factura.totalDeuda ? `$${factura.totalDeuda}` : '$0.00';

            doc.fontSize(12).text('• Factura: ' + facturaNumero);
            doc.text('  Fecha de Vencimiento: ' + fechaVencimiento);
            doc.text('  Total Factura: ' + totalFactura);
            doc.text('  Total Pagado: ' + totalPagado);
            doc.text('  Deuda Pendiente: ' + deudaPendiente);
            doc.moveDown(); // Deja un espacio entre las viñetas
        });


        // Enviar el archivo PDF al cliente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=estado_de_cuenta.pdf');
        doc.pipe(res);  // Esto enviará el PDF al frontend directamente.
        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error al obtener las facturas' });
    }
};

