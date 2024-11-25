const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para guardar los archivos de forma temporal
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../images'));  // Directorio donde se guardarán las imágenes temporalmente
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-monkeywit-' + file.originalname);  // Nombre único para cada archivo
  },
});

const fileUpload = multer({
  storage: diskStorage,
}).single('image');  // Nombre del campo de formulario que contiene la imagen

// Función para manejar la subida de la imagen
exports.subirImagen = (req, res, next) => {
  fileUpload(req, res, async (err) => {
    if (err) {
      return res.status(500).send('Error uploading file: ' + err.message);  // Maneja errores de carga
    }

    if (!req.file) {
      return res.status(400).send('No file uploaded');  // Si no hay archivo en la solicitud
    }

    try {
      // Lee el archivo subido como datos binarios
      const { originalname, mimetype } = req.file;
      const imageData = fs.readFileSync(path.join(__dirname, '../images', req.file.filename));

      // Guarda la imagen en la base de datos (ajusta según tu modelo)
      const newImage = await WebImage.create({
        type: mimetype,
        name: originalname,
        data: imageData,
      });

      // Elimina el archivo temporal una vez guardado en la base de datos
      fs.unlinkSync(path.join(__dirname, '../images', req.file.filename));

      // Responde con el ID de la imagen guardada
      res.status(201).json({
        message: 'Image uploaded successfully',
        imageId: newImage.id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error processing the image');
    }
  });
};
