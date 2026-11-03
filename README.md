# PAW-Project-Tutora (Tutora)

Implementasi Arsitektur **Model-View-Controller (MVC)** menggunakan **Node.js**, **Express.js**, **EJS**, **Tailwind CSS**, dan **PostgreSQL (Sequelize)**.

---

## 📁 Struktur Folder

Sesuai ketentuan penugasan Week 7:

```text
PAW-Project-Tutora/
├── config/
│   ├── index.js          # Konfigurasi aplikasi & port
│   └── database.js       # Konfigurasi koneksi PostgreSQL (Sequelize)
├── controllers/
│   ├── apiController.js  # Mengatur endpoint /api/status dan /api/produk
│   └── homeController.js # Mengatur rendering halaman frontend EJS
├── logs/
│   ├── .gitkeep
│   └── logger.md         # Catatan log request HTTP format Markdown
├── middlewares/
│   └── logger.js         # Custom middleware logger (terminal & file markdown)
├── models/
│   ├── index.js          # Inisialisasi Sequelize & model database
│   └── produkModel.js    # Model data modul pembelajaran adaptif
├── routes/
│   ├── api.js            # Routing endpoint API
│   ├── web.js            # Routing halaman web utama
│   └── index.js          # Agregator seluruh routing aplikasi
├── utils/
│   ├── format.js         # Helper pemformat Rupiah dan tanggal
│   └── seed.js           # Script seeding data modul awal ke database
├── views/
│   ├── partials/
│   │   ├── head.ejs      # Tag head, font Google, Tailwind CSS CDN
│   │   └── footer.ejs    # Komponen footer aplikasi
│   └── index.ejs         # Tampilan antarmuka utama pengguna
├── .env                  # Konfigurasi environment (DB, PORT)
├── .env.example          # Contoh template konfigurasi
├── .gitignore            # Berkas yang dikecualikan dari Git
├── app.js                # Entry point utama aplikasi Express
└── package.json          # Metadata & dependensi project
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- **Node.js** (v18 ke atas) & **npm**
- **PostgreSQL** sudah terpasang dan aktif di komputer.
- Buat database baru di PostgreSQL (misalnya melalui pgAdmin atau terminal psql):
  ```sql
  CREATE DATABASE tutora_db;
  ```

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` (atau edit file `.env` yang sudah ada):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password_postgres_kamu
DB_NAME=tutora_db
```

### 3. Isi Data Awal ke Database (Seeding)
Jalankan perintah berikut untuk membuat tabel `produks` dan mengisi data modul pembelajaran adaptif:
```bash
npm run seed
```

### 4. Menjalankan Server Aplikasi
Jalankan aplikasi dengan salah satu perintah berikut:

- **Mode Development (dengan reload otomatis menggunakan nodemon):**
  ```bash
  npm run dev
  ```
- **Mode Normal:**
  ```bash
  npm start
  ```

Buka browser dan akses:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Status**: [http://localhost:3000/api/status](http://localhost:3000/api/status)
- **API Produk**: [http://localhost:3000/api/produk](http://localhost:3000/api/produk)

---

## 📡 Endpoint API

### 1. `GET /api/status`
Mengembalikan status server, uptime, dan kesiapan koneksi database.
**Contoh Respons:**
```json
{
  "status": "ok",
  "app": "Tutora",
  "version": "v1.0",
  "serverTime": "2026-11-03T17:28:00.000Z",
  "uptime": 15,
  "database": {
    "dialect": "postgresql",
    "status": "connected"
  }
}
```

### 2. `GET /api/produk`
Mengembalikan daftar topik pembelajaran adaptif Tutora (Pure AI bimbingan belajar, tanpa harga & stok).
**Contoh Respons:**
```json
{
  "success": true,
  "total": 6,
  "data": [
    {
      "id": 1,
      "nama": "Pengembangan Aplikasi Web (Express.js & MVC)",
      "kategori": "Web Development",
      "deskripsi": "Bimbingan konsep arsitektur MVC, routing Express.js, custom middleware logger, dan view engine EJS.",
      "icon": "lucide:globe",
      "levels": ["Pemula", "Menengah", "Lanjut"]
    }
  ]
}
```

---

## 📝 Middleware Logger
Setiap request HTTP yang masuk akan otomatis:
1. Ditampilkan langsung di terminal / console backend (Metode, Endpoint, Status Code, Durasi, IP, Timestamp).
2. Dicatat rapi ke dalam tabel Markdown di file `logs/logger.md`.

---

## 📸 Tangkapan Layar & Bukti Pengujian

### 1. Tampilan Frontend Aplikasi (EJS & Tailwind CSS)

#### A. Halaman Utama (Hero Section & Status Server Live)
<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/0155bb06-ade7-4bdd-945d-ce4c8c90de9e" />


#### B. Katalog Topik Pembelajaran Adaptif
<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/a584d1ee-ff44-4585-b083-e229ed15d55f" />


### 2. Bukti Pengujian Endpoint via Postman

#### A. Pengujian `GET /api/status`
<img width="1919" height="1035" alt="image" src="https://github.com/user-attachments/assets/22973f6d-81a4-421b-8ff7-81c91022ace0" />


#### B. Pengujian `GET /api/produk`
<img width="1919" height="1034" alt="image" src="https://github.com/user-attachments/assets/f5d0e7b3-c677-4a7c-b67c-b3fe9e7c0430" />


---

## 👥 Tim Pengembang (Kelompok 4)
- Abi Nayana Faiq (20240140036)
- Marchdilo Kemal Hakim (20240140041)
- Khoirul Arif Pratama (20240140011)
- Muhammad Zaki Andika (20240140048)
- Bima Baraja (20240140015)
- Pasya Achmadinedja Maulana (20240140035)
- Rafi Arif Nugroho (20240140007)
