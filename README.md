# Milktea House - API + UI + MongoDB

Project shop tra sua gom UI Tailwind CSS va API Node.js dung MongoDB qua Mongoose.

## Yeu cau

- Node.js 18+
- MongoDB dang chay local hoac MongoDB Atlas

## Cai dat

```bash
npm install
```

Mac dinh project ket noi:

```text
mongodb://127.0.0.1:27017/milktea_house
```

Neu dung MongoDB Atlas hoac database khac, set bien moi truong:

```bash
set MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER/milktea_house
```

De gui OTP ve Gmail that, can tao Google App Password va set:

```bash
set EMAIL_USER=your-gmail@gmail.com
set EMAIL_PASS=your-google-app-password
set EMAIL_ALLOW_INVALID_TLS=true
```

Gmail App Password khong phai mat khau Gmail dang nhap binh thuong. Tai khoan Google can bat 2-Step Verification, sau do tao App Password cho Mail.
Neu may dev bao loi `self-signed certificate in certificate chain` khi gui OTP, giu `EMAIL_ALLOW_INVALID_TLS=true`. Khi deploy production, nen dat `NODE_ENV=production` va bo bien nay de bat kiem tra TLS day du.

## Nap du lieu mau

```bash
npm run seed
```

Script nay se tao:

- 1 tai khoan thanh vien demo
- 8 san pham tra sua co danh muc, gia, ton kho, so luong da ban, topping, khuyen mai va nhieu hinh anh

Tai khoan demo:

```text
Email: thanhvien@milktea.vn
Mat khau: 123456
```

## Chay web

```bash
npm start
```

Mo trinh duyet:

```text
http://localhost:3000/login.html
```

## API

```text
POST /api/login
POST /api/register
POST /api/verify-register
POST /api/forgot-password
POST /api/verify-reset-otp
POST /api/reset-password
GET  /api/me
GET  /api/meta
GET  /api/home
GET  /api/products?search=&category=&topping=&stock=&priceMin=&priceMax=&sort=
GET  /api/products/:id
GET  /api/products/:id/related
```

## Noi luu du lieu mau

Du lieu seed nam trong:

```text
data/store.js
```

Muon them san pham co san, them object vao mang `products`, sau do chay lai:

```bash
npm run seed
```
