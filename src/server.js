require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors'); //https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
const app = express();
const route = require('./routes');
const morgan = require('morgan'); //HTTP request logger middleware

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// Require Database
const connectDB = require('./configs/connectDB');
// Require Middleware
const notFoundMiddleware = require('./middlewares/not-found');
const errorHandlerMiddleware = require('./middlewares/error-handler');
const genData = require('./mock/genData');

app.use(
    cors({
        origin: ['http://localhost:3000', 'http://localhost:3006'], // Thay thế bằng tên miền hoặc nguồn gốc của trang web bạn muốn cho phép truy cập
        credentials: true, // Bật cho phép gửi cookie và thông tin xác thực
    }),
);

app.use(morgan());
app.use(bodyParser.json());
app.use(cookieParser(process.env.JWT_SECRET));
//Read form data so web can access req.body contents
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// if (process.env.NODE_ENV === 'production') {
//     app.use(csrfMiddleware);

//     //when we first load the page, we get the XSRF token from the Client
//     app.all('*', (req, res, next) => {
//         res.cookie('XSRF-TOKEN', req.csrfToken(), { sameSite: 'none', secure: true });
//         next();
//     });

//     app.get('/csrf', (req, res) => {
//         res.send({ csrfToken: req.csrfToken() });
//     });
// }

//Routes init
route(app);

// app.use(express.static('public'));
// app.get('/public/uploads', express.static('/public/uploads'));
// app.use(express.static(path.join(__dirname, '/public/uploads')));

if (process.env.NODE_ENV === 'production') {
    //Static files
    // app.use(express.static(path.join(__dirname, '/public')));
    app.use(express.static(path.join(__dirname, '/build/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'build', 'dist', 'index.html'));
    });
}

app.use('/public', express.static(path.join(__dirname, 'public')));

// Invoke Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 4000;

const start = async () => {
    try {
        // Connect database
        await connectDB(process.env.MONGO_URL);
        genData();
        app.listen(port, () => console.log(`🚀 Server is listening on port ${port}... ${__dirname}`));
    } catch (error) {
        console.log(error);
    }
};

start();
