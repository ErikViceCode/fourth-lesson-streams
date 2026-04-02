import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const PORT =  process.env.PORT || 8000;

const app = express();


app.use(express.static('public'));

const uploadDir = path.join('public', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.post('/upload', (req, res) => {

    let fileName = req.headers['filename'] || 'file.txt';

    fileName = path.basename(fileName);

    if (!fileName.endsWith('.txt')) {
        fileName += '.txt';
    }

    const filePath = path.join(uploadDir, fileName);

    if (fs.existsSync(filePath)) {
        return res.status(409).send('Файл вже існує');
    }
    const writeStream = fs.createWriteStream(filePath);

    writeStream.on('error', (err) => {
        res.status(500).send('Помилка завантаження');
    })

    req.pipe(writeStream);

    writeStream.on('finish', () => {
        res.send('Успішно завантажив файдл')
    });


});

    app.get('/download', (req, res) => {
        let fileName = req.query.filename || 'sample-2mb.txt';

        if (!fileName.endsWith('.txt')) {
            fileName += '.txt';
        }

        fileName = path.basename(fileName);

        let filePath = path.join('public', fileName);

        if (!fs.existsSync(filePath)) {
            filePath = path.join('public', 'uploads', fileName);
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Файл не знайдено');
        }

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        fs.createReadStream(filePath).pipe(res);
    });


    app.get('/download-compression', (req, res) => {
        let fileName = req.query.filename;

        if (!fileName) {
            fileName = 'sample-2mb.txt';
        }

        fileName = path.basename(fileName);

        let filePath = path.join('public', fileName);

        if (!fs.existsSync(filePath)) {
            filePath = path.join('public', 'uploads', fileName);
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Файла немає');
        }

        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.gz"`);

        const readStream = fs.createReadStream(filePath);
        const gzip = zlib.createGzip();

        gzip.on('error', () => {
            if (!res.headersSent) {
                res.status(500).send('Помилка стиснення');
            }
        });

        readStream.on('error', () => {
            res.status(500).send('Помилка читання файлу');
        });

        readStream.pipe(gzip).pipe(res);


    })


    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`);
    });

