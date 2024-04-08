const arraysAreEqual = (arr1, arr2) => {
    // Kiểm tra xem độ dài của hai mảng có bằng nhau không

    if (!arr1 || !arr2) {
        if (!arr1 && !arr2) {
            return true;
        }
        return false;
    }
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Kiểm tra từng phần tử của mảng
    for (let i = 0; i < arr1.length; i++) {
        // So sánh từng phần tử của hai mảng
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    // Nếu đã kiểm tra hết tất cả các phần tử và không tìm thấy sự khác biệt, hai mảng giống nhau
    return true;
};

module.exports = arraysAreEqual;
