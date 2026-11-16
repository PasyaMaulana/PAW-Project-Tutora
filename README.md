# PAW-Project-Tutora (Tutora)
> Perancangan Aplikasi Web Pembelajaran Adaptif Berbasis Artificial Intelligence untuk Mahasiswa

Tugas Proyek Berkelanjutan — Mata Kuliah Pengembangan Aplikasi Web (PAW)  
Implementasi Arsitektur **Model-View-Controller (MVC)** menggunakan **Node.js**, **Express.js**, **EJS**, **Tailwind CSS**, dan **PostgreSQL (Sequelize)** dengan fitur **REST API CRUD** dan antarmuka manajemen data interaktif.

---

## 📁 Struktur Folder

Sesuai ketentuan standar MVC penugasan:

```text
PAW-Project-Tutora/
├── config/
│   ├── index.js             # Konfigurasi aplikasi & port
│   └── database.js          # Konfigurasi koneksi PostgreSQL (Sequelize)
├── controllers/
│   ├── apiController.js     # Controller REST API CRUD (/api/topics & /api/status)
│   └── topicController.js   # Controller antarmuka web CRUD frontend EJS
├── logs/
│   ├── .gitkeep
│   └── logger.md            # Catatan riwayat request HTTP format Markdown
├── middlewares/
│   └── logger.js            # Custom middleware logger (terminal console & markdown)
├── models/
│   ├── index.js             # Inisialisasi Sequelize & ekspor model
│   └── topicModel.js        # Model data topik pembelajaran & operasi database
├── routes/
│   ├── api.js               # Routing endpoint REST API CRUD
│   ├── web.js               # Routing antarmuka web CRUD frontend
│   └── index.js             # Agregator seluruh routing aplikasi
├── utils/
│   ├── format.js            # Helper: format tanggal WIB, parsing levels, validasi ID
│   └── seed.js              # Script seeding data awal topik ke PostgreSQL
├── views/
│   ├── partials/
│   │   ├── head.ejs         # Tag head, font Plus Jakarta Sans, Tailwind CDN & Iconify
│   │   ├── alert.ejs        # Komponen notifikasi flash message (sukses/gagal)
│   │   └── footer.ejs       # Komponen footer identitas kelompok
│   ├── topics/
│   │   ├── create.ejs       # Form antarmuka tambah topik baru (CREATE)
│   │   └── edit.ejs         # Form antarmuka ubah topik & hapus (UPDATE & DELETE)
│   └── index.ejs            # Tampilan utama: Hero, live status, & katalog topik (READ)
├── public/
│   └── images/
│       └── tutora-logo.png  # Logo resmi aplikasi Tutora
├── .env                     # Variabel environment koneksi database & port
├── .env.example             # Template konfigurasi environment
├── .gitignore               # Berkas yang dikecualikan dari Git
├── app.js                   # Entry point utama Express server & DB sync
└── package.json             # Metadata, scripts (start, dev, seed) & dependensi
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
Jalankan perintah berikut untuk menyinkronkan tabel `topics` dan mengisi data modul pembelajaran awal ke PostgreSQL:
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

Akses aplikasi melalui browser:
- **Frontend Utama**: [http://localhost:3000](http://localhost:3000)
- **Form Tambah Topik**: [http://localhost:3000/topics/create](http://localhost:3000/topics/create)
- **API Status**: [http://localhost:3000/api/status](http://localhost:3000/api/status)
- **REST API Topics**: [http://localhost:3000/api/topics](http://localhost:3000/api/topics)

---

## 📡 Endpoint REST API (CRUD)

Backend menyediakan endpoint REST API lengkap yang terhubung langsung ke database PostgreSQL:

| HTTP Method | Endpoint | Fungsi | Status Code |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/status` | Mengecek uptime server & status koneksi database | 200 OK |
| **GET** | `/api/topics` | Mengambil seluruh data topik dari database | 200 OK |
| **GET** | `/api/topics/:id` | Mengambil detail 1 topik berdasarkan ID | 200 OK / 404 Not Found |
| **POST** | `/api/topics` | Menambahkan topik baru ke database | 201 Created / 400 Bad Request |
| **PUT** | `/api/topics/:id` | Memperbarui topik berdasarkan ID | 200 OK / 404 Not Found |
| **DELETE** | `/api/topics/:id` | Menghapus topik berdasarkan ID dari database | 200 OK / 404 Not Found |

### Contoh Request & Response REST API

#### 1. `GET /api/topics` (Membaca Seluruh Data)
**Response:**
```json
{
  "success": true,
  "total": 6,
  "data": [
    {
      "id": 1,
      "nama": "Pengembangan Aplikasi Web (Express.js & MVC)",
      "kategori": "Web Development",
      "deskripsi": "Bimbingan konsep arsitektur MVC, routing Express.js, REST API CRUD, middleware logger, dan view engine EJS.",
      "icon": "lucide:globe",
      "levels": ["Pemula", "Menengah", "Lanjut"],
      "createdAt": "2026-11-10T13:44:21.000Z",
      "updatedAt": "2026-11-10T13:44:21.000Z"
    }
  ]
}
```

#### 2. `POST /api/topics` (Menambahkan Data Baru)
**Headers:** `Content-Type: application/json`  
**Request Body:**
```json
{
  "nama": "Cloud Computing & DevOps",
  "kategori": "Infrastructure",
  "deskripsi": "Arsitektur cloud AWS/GCP, Docker containerization, Kubernetes, dan CI/CD pipeline.",
  "icon": "lucide:cloud",
  "levels": ["Pemula", "Menengah"]
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Data topik berhasil ditambahkan ke database",
  "data": {
    "id": 7,
    "nama": "Cloud Computing & DevOps",
    "kategori": "Infrastructure",
    "deskripsi": "Arsitektur cloud AWS/GCP, Docker containerization, Kubernetes, dan CI/CD pipeline.",
    "icon": "lucide:cloud",
    "levels": ["Pemula", "Menengah"]
  }
}
```

#### 3. `PUT /api/topics/:id` (Memperbarui Data)
**Request Body:**
```json
{
  "nama": "Cloud Computing & Modern DevOps Architecture",
  "deskripsi": "Diperbarui: Pembelajaran microservices, Docker, Kubernetes, dan automation testing."
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Data topik berhasil diperbarui di database",
  "data": {
    "id": 7,
    "nama": "Cloud Computing & Modern DevOps Architecture",
    "kategori": "Infrastructure",
    "deskripsi": "Diperbarui: Pembelajaran microservices, Docker, Kubernetes, dan automation testing."
  }
}
```

#### 4. `DELETE /api/topics/:id` (Menghapus Data)
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Topik dengan ID 7 berhasil dihapus dari database"
}
```

---

## 🖥️ Antarmuka Web Frontend (CRUD)

Pengguna dapat melakukan seluruh operasi data langsung melalui browser:

| Operasi | Rute Web | Aksi di Frontend |
| :--- | :--- | :--- |
| **READ** | `GET /` | Menampilkan seluruh topik yang diambil langsung dari database PostgreSQL |
| **CREATE** | `GET /topics/create` & `POST /topics` | Form penambahan topik baru dengan validasi dan notifikasi sukses |
| **UPDATE** | `GET /topics/:id/edit` & `POST /topics/:id/update` | Form perubahan data topik yang telah terisi data lama |
| **DELETE** | `POST /topics/:id/delete` | Tombol hapus pada kartu topik dilengkapi dialog konfirmasi browser |

---

## 📝 Middleware Logger
Middleware logger mencatat setiap request HTTP yang masuk ke server:
1. **Console Terminal**: Menampilkan metode (GET, POST, PUT, DELETE), endpoint, status HTTP, durasi (ms), dan alamat IP.
2. **File Log**: Dicatat rapi ke dalam tabel Markdown di file `logs/logger.md`.

---

## 📸 Tangkapan Layar & Bukti Pengujian

### 1. Tampilan Frontend Aplikasi (EJS & Tailwind CSS)

#### A. Halaman Utama (Hero Section & Status Server Live)
<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/0155bb06-ade7-4bdd-945d-ce4c8c90de9e" />

#### B. Katalog Topik Pembelajaran Adaptif (Fitur Edit & Hapus Terintegrasi)
<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/a584d1ee-ff44-4585-b083-e229ed15d55f" />

#### C. Antarmuka Form Tambah Topik Baru (CREATE)
<img width="1914" height="909" alt="image" src="https://github.com/user-attachments/assets/b360934e-570f-4c31-92bd-a1f6f5ae879e" />

#### D. Antarmuka Form Edit Topik (UPDATE)
<img width="1919" height="912" alt="image" src="https://github.com/user-attachments/assets/64cf5a7c-4c1e-466f-bf71-73246b50af59" />


---

### 2. Bukti Pengujian Endpoint via Postman

#### A. Pengujian `GET /api/status`
<img width="1919" height="1035" alt="image" src="https://github.com/user-attachments/assets/22973f6d-81a4-421b-8ff7-81c91022ace0" />

#### B. Pengujian `GET /api/topics` (Membaca Seluruh Data)
<img width="1919" height="1034" alt="image" src="https://github.com/user-attachments/assets/f5d0e7b3-c677-4a7c-b67c-b3fe9e7c0430" />

#### C. Pengujian `POST /api/topics` (Menambahkan Data Baru)
<img width="1919" height="1034" alt="image" src="https://github.com/user-attachments/assets/4f1f3858-5323-4526-ab54-f1578f66f9f0" />

#### D. Pengujian `PUT /api/topics/:id` (Memperbarui Data)
<img width="1919" height="1033" alt="image" src="https://github.com/user-attachments/assets/ed8e424f-8d66-4fc0-b70a-8d618f88aa1f" />

#### E. Pengujian `DELETE /api/topics/:id` (Menghapus Data)
<img width="1919" height="1031" alt="image" src="https://github.com/user-attachments/assets/a0912cce-491a-4e9d-bcc5-08e31cc97395" />

---

## 👥 Tim Pengembang (Kelompok 4)
- Abi Nayana Faiq (20240140036)
- Marchdilo Kemal Hakim (20240140041)
- Khoirul Arif Pratama (20240140011)
- Muhammad Zaki Andika (20240140048)
- Bima Baraja (20240140015)
- Pasya Achmadinedja Maulana (20240140035)
- Rafi Arif Nugroho (20240140007)
