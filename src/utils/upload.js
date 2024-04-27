const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Cấu hình Multer để lưu trữ tệp trong thư mục 'uploads'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/public/uploads'); // Đường dẫn đến thư mục lưu trữ tệp
    },
    filename: function (req, file, cb) {
        // Lấy phần mở rộng của file
        const ext = path.extname(file.originalname);
        // Tạo tên file mới bằng UUID để đảm bảo tính duy nhất
        const filename = uuidv4() + ext;
        cb(null, filename); // Sử dụng tên gốc của tệp
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
