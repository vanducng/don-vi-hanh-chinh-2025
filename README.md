# Đơn vị hành chính 2025 - VnExpress Data Crawler

Web crawler để thu thập dữ liệu về việc sắp xếp lại các đơn vị hành chính cấp xã từ **VnExpress**: https://vnexpress.net/tra-cuu-3-321-phuong-xa-tren-ca-nuoc-sau-sap-xep-4903454.html

## Mô tả

Script này crawl dữ liệu từ trang tra cứu của VnExpress về 3.321 phường, xã trên cả nước sau sắp xếp. Dữ liệu bao gồm:

- **Tỉnh/Thành phố**: Đơn vị hành chính cấp tỉnh
- **Phường, xã mới**: Tên phường/xã sau khi sắp xếp
- **Phường, xã trước sáp nhập**: Danh sách các phường/xã trước khi sắp xếp

## Dữ liệu mẫu

Dưới đây là 10 hàng đầu từ dữ liệu đã crawl:

| Tỉnh | Phường, xã mới | Phường, xã trước sáp nhập |
|-------|----------------|---------------------------|
| An Giang | An Biên | Thị trấn Thứ Ba, Xã Đông Yên, Xã Hưng Yên |
| An Giang | An Châu | Thị trấn An Châu, Xã Hòa Bình Thạnh, Xã Vĩnh Thành |
| An Giang | An Cư | Xã Văn Giáo, Xã Vĩnh Trung, Xã An Cư |
| An Giang | An Minh | Thị trấn Thứ Mười Một, Xã Đông Hưng, Xã Đông Hưng B |
| An Giang | An Phú | Thị trấn An Phú, Xã Vĩnh Hội Đông, Xã Phú Hội, Xã Phước Hưng |
| An Giang | Ba Chúc | Thị trấn Ba Chúc, Xã Lạc Quới, Xã Lê Trì |
| An Giang | Bình An | Xã Bình An (huyện Châu Thành), Xã Vĩnh Hòa Hiệp, Xã Vĩnh Hòa Phú |
| An Giang | Bình Đức | Phường Bình Khánh, Phường Bình Đức, Xã Mỹ Khánh |
| An Giang | Bình Giang | Không sáp nhập |
| An Giang | Bình Hòa | Xã Bình Thạnh, Xã An Hòa, Xã Bình Hòa |

## Yêu cầu hệ thống

- Python 3.8+
- Chrome browser
- uv (Python package manager)

## Cài đặt

### 1. Cài đặt uv (nếu chưa có)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Clone hoặc tải về project

```bash
git clone <repository-url>
cd don-vi-hanh-chinh-2025
```

## Sử dụng

### Chạy crawler

```bash
uv run crawl.py
```

Script sẽ tự động:

- Cài đặt các dependencies cần thiết
- Khởi tạo Chrome driver
- Crawl dữ liệu từ tất cả 333 trang
- Lưu dữ liệu vào file `data.csv`
- Ghi log chi tiết vào file `crawl.log`

### Theo dõi tiến trình

Script sẽ hiển thị tiến trình real-time:

```
2025-07-03 13:25:53,481 - INFO - Loading page (attempt 1/5): https://vnexpress.net/...
2025-07-03 13:29:10,634 - INFO - Extracted 10 rows from page 1 (Total: 10)
2025-07-03 13:29:16,235 - INFO - Extracted 9 rows from page 2 (Total: 19)
...
```

### Dừng và tiếp tục

- **Dừng**: Nhấn `Ctrl+C` để dừng crawler
- **Tiếp tục**: Chạy lại `uv run crawl.py` - script sẽ ghi đè file cũ và bắt đầu từ đầu

## Kết quả

### File output

- **`data.csv`**: Dữ liệu chính với 3 cột (Tỉnh, Phường xã mới, Phường xã trước sáp nhập)
- **`crawl.log`**: Log chi tiết quá trình crawling (ghi đè mỗi lần chạy mới)

### Ví dụ dữ liệu

```csv
Tỉnh,Phường xã mới,Phường xã trước sáp nhập
An Giang,Bình Mỹ,"Xã Bình Thủy, Xã Bình Chánh, Xã Bình Mỹ"
An Giang,Bình Sơn,Không sáp nhập
Bắc Ninh,An Lạc,"Xã Lệ Viễn, Xã An Lạc"
```

## Tính năng

### ✅ Crawling đáng tin cậy

- **Retry logic**: 5 lần thử lại cho mỗi thao tác
- **Exponential backoff**: Tăng dần thời gian chờ giữa các lần thử
- **JavaScript navigation**: Sử dụng JavaScript click để điều hướng đáng tin cậy

### ✅ Theo dõi tiến trình

- **Real-time logging**: Hiển thị tiến trình trên console và file
- **Progress tracking**: Lưu dữ liệu sau mỗi trang
- **Error handling**: Ghi log chi tiết các lỗi xảy ra

### ✅ Hiệu suất cao

- **Headless browser**: Chạy Chrome ở chế độ ẩn
- **Optimized options**: Tối ưu Chrome options cho performance
- **Smart waiting**: Chờ đợi thông minh cho dynamic content

## Cấu trúc project

```
don-vi-hanh-chinh-2025/
├── crawl.py          # Script crawler chính
├── README.md         # Hướng dẫn này
├── .gitignore       # Git ignore rules
├── data.csv         # Dữ liệu output (sau khi chạy)
└── crawl.log        # Log file (sau khi chạy)
```

## Xử lý lỗi

### Lỗi thường gặp

1. **Chrome driver không tìm thấy**

   ```
   Solution: Script tự động tải Chrome driver, đảm bảo Chrome browser đã được cài đặt
   ```

2. **Timeout khi load trang**

   ```
   Solution: Script có retry logic, sẽ tự động thử lại 5 lần
   ```

3. **Không tìm thấy dữ liệu**
   ```
   Solution: Kiểm tra file crawl.log để xem chi tiết lỗi
   ```

### Debug

Để debug chi tiết hơn, mở file `crawl.log` và tìm các dòng ERROR hoặc WARNING.

## Nguồn dữ liệu

**URL gốc**: https://vnexpress.net/tra-cuu-3-321-phuong-xa-tren-ca-nuoc-sau-sap-xep-4903454.html

Dữ liệu được crawl từ bảng tương tác Flourish embed trong trang VnExpress.

## Thời gian chạy

- **Ước tính**: 30-45 phút cho toàn bộ 333 trang
- **Tốc độ**: ~10 rows/page, ~5-6 giây/page
- **Tổng dữ liệu**: Khoảng 3.000+ rows

## Lưu ý

- Script tuân thủ robots.txt và có delay hợp lý giữa các request
- Dữ liệu được lưu với encoding UTF-8 để hỗ trợ tiếng Việt
- Log file được ghi đè mỗi lần chạy mới để tránh tích lũy dung lượng
