Buatkan sebuah website fotografi profesional bernama **Anulika**. Website ini akan digunakan sebagai portfolio fotografer dan sistem booking online.

## 1. Aturan Teknologi

Gunakan teknologi berikut:

* HTML5
* CSS3
* JavaScript Vanilla
* Tailwind CSS melalui CDN
* AOS (Animate On Scroll) untuk animasi
* Supabase sebagai Backend as a Service
* Supabase JavaScript Client

### Larangan

* Jangan menggunakan React
* Jangan menggunakan Vue
* Jangan menggunakan Next.js
* Jangan menggunakan framework frontend apa pun
* Jangan menggunakan template admin jadi
* Jangan menggunakan komponen atau desain yang terlihat seperti hasil AI generik
* Jangan membuat desain berlebihan, terlalu banyak gradient, glassmorphism, floating card, atau ornamen yang tidak diperlukan

Gunakan struktur kode yang rapi dan modular.

---

# 2. Konsep Website

Nama brand:

**ANULIKA**

Website harus memiliki kesan:

* Premium
* Elegan
* Editorial
* Modern
* Minimalis
* Luxury photography studio
* Clean
* Profesional
* Fokus pada visual fotografi

Desain harus terlihat seperti website studio fotografi profesional, bukan website AI template.

Gunakan:

* Tipografi yang kuat
* Banyak white space
* Layout editorial
* Foto berukuran besar sebagai elemen utama
* Grid portfolio yang rapi
* Animasi yang halus dan minimal
* Responsif untuk desktop, tablet, dan mobile

---

# 3. Halaman Publik

Buat halaman berikut:

## Home

Bagian:

* Hero section dengan visual fotografi yang kuat
* Nama brand Anulika
* Short tagline
* Call to action untuk melihat portfolio dan melakukan booking
* Preview kategori portfolio
* Preview foto terbaik
* Section tentang fotografer atau Anulika
* CTA booking
* Footer profesional

---

## Portfolio

Portfolio harus mendukung kategori yang dapat dikelola melalui CMS Admin.

Contoh kategori:

* Wedding
* Graduation
* Pre-Wedding
* Portrait
* Event
* Family
* Corporate
* Other

Setiap kategori harus dapat:

* Ditambahkan
* Diubah
* Dihapus
* Diaktifkan
* Dinonaktifkan

Jika kategori dinonaktifkan:

* Tidak muncul di website publik
* Tidak muncul pada navigation/filter portfolio publik

Contoh:

Jika admin hanya mengaktifkan:

* Wedding
* Graduation

Maka halaman publik hanya menampilkan kategori tersebut.

---

## Portfolio Detail

Setiap portfolio/project memiliki:

* Judul
* Category
* Cover image
* Multiple images
* Deskripsi
* Tanggal
* Status published atau unpublished

Gunakan gallery dengan:

* Responsive image grid
* Image preview
* Lightbox/modal ketika foto diklik
* Navigasi foto sebelumnya dan berikutnya

---

# 4. Booking System

Buat sistem booking photography.

User dapat memilih:

* Nama
* Nomor WhatsApp
* Email
* Jenis layanan atau kategori photoshoot
* Tanggal booking
* Jam booking
* Lokasi
* Catatan tambahan

Buat kalender booking.

Tanggal yang sudah penuh atau sudah memiliki booking aktif harus tidak dapat dipilih oleh user.

Admin dapat menentukan:

* Booking available
* Booking unavailable
* Blocked dates
* Fully booked dates

Booking harus disimpan ke Supabase.

Status booking:

* Pending
* Confirmed
* Rejected
* Completed
* Cancelled

Setelah booking berhasil:

1. Data booking masuk ke Supabase
2. Munculkan halaman atau modal booking success
3. User dapat menghubungi WhatsApp fotografer untuk konfirmasi

---

# 5. WhatsApp Notification Tanpa API

Tidak menggunakan WhatsApp API.

Setelah booking berhasil, buat tombol:

**Konfirmasi via WhatsApp**

Tombol harus membuka:

wa.me/628889275189

Dengan pesan yang sudah otomatis dibuat berdasarkan data booking.

Contoh format pesan:

Halo Anulika, saya baru saja melakukan booking.

Nama: [Nama]
WhatsApp: [Nomor WhatsApp]
Tanggal: [Tanggal]
Jam: [Jam]
Layanan: [Layanan]
Lokasi: [Lokasi]

Saya ingin melakukan konfirmasi booking.

Jangan mencoba melakukan blast WhatsApp otomatis tanpa API.

Website hanya membuat tombol atau redirect ke WhatsApp dengan pesan yang sudah diisi otomatis.

---

# 6. Admin Dashboard

Buat halaman admin terpisah dari website publik.

Contoh struktur:

/admin/login.html

/admin/dashboard.html

Admin dashboard harus memiliki:

* Sidebar
* Dashboard overview
* Statistics cards yang tidak berlebihan
* Booking terbaru
* Booking pending
* Total portfolio
* Status kategori
* Dark mode
* Responsive admin dashboard

Gunakan desain dashboard modern dan profesional.

Hindari:

* AI style dashboard
* Gradient berlebihan
* Card terlalu banyak
* Terlalu banyak icon
* Layout generik

---

# 7. CMS Portfolio

Admin dapat melakukan CRUD terhadap:

## Categories

* Create
* Read
* Update
* Delete
* Activate
* Deactivate

Field:

* Category name
* Slug
* Description
* Active status

---

## Portfolio

Admin dapat:

* Menambahkan portfolio
* Mengubah portfolio
* Menghapus portfolio
* Mengaktifkan atau menonaktifkan portfolio
* Menentukan cover image
* Upload multiple images
* Memilih kategori

Gunakan Supabase Storage untuk menyimpan gambar.

---

# 8. Booking Management

Admin dapat:

* Melihat seluruh booking
* Melihat detail booking
* Filter berdasarkan tanggal
* Filter berdasarkan status
* Mengubah status booking
* Menghapus booking jika diperlukan
* Melihat calendar booking
* Memblokir tanggal tertentu

Dashboard booking harus jelas dan mudah digunakan.

---

# 9. Authentication

Login hanya untuk Admin.

Gunakan:

Supabase Auth

Tidak ada:

* Register publik
* Login customer
* Customer dashboard

Hanya admin yang dapat login.

Buat role:

* Admin
* Editor

Admin memiliki akses penuh.

Editor dapat:

* Mengelola portfolio
* Mengelola category
* Melihat booking

Tetapi editor tidak dapat:

* Mengelola user admin
* Mengubah role user
* Menghapus admin utama

---

# 10. User Management

Admin dapat melakukan CRUD user.

Fitur:

* Tambah user
* Edit user
* Hapus user
* Reset password
* Activate/deactivate user
* Mengubah role

Gunakan Supabase Auth.

Data tambahan user seperti role harus disimpan di tabel Supabase profile.

Pastikan admin dashboard tidak dapat diakses jika belum login.

Buat:

* Auth guard
* Session check
* Redirect ke login jika tidak authenticated
* Logout

---

# 11. Dark Mode

Website publik dan Admin Dashboard harus mendukung:

* Light mode
* Dark mode

Gunakan:

* Toggle button
* localStorage

Theme pilihan user harus tetap tersimpan setelah refresh.

Pastikan semua halaman mendukung dark mode dengan baik.

---

# 12. Supabase Database

Buat struktur database dan SQL untuk tabel berikut:

profiles

categories

portfolios

portfolio_images

bookings

blocked_dates

Contoh relasi:

profiles
→ data admin dan editor

categories
→ kategori portfolio

portfolios
→ project photography

portfolio_images
→ multiple images dalam satu portfolio

bookings
→ data booking client

blocked_dates
→ tanggal yang tidak tersedia

Buatkan:

* SQL create table
* Primary key
* Foreign key
* Index yang diperlukan
* Timestamp
* Row Level Security
* RLS Policy

---

# 13. Supabase Storage

Buat bucket:

portfolio-images

Gunakan bucket tersebut untuk:

* Cover image
* Gallery portfolio

Buat dokumentasi cara mengatur:

* Bucket
* RLS policy
* Upload
* Delete
* Public image URL

---

# 14. Keamanan

Sangat penting:

Jangan pernah memasukkan Supabase Secret Key atau Service Role Key ke frontend.

Frontend hanya menggunakan:

* SUPABASE_URL
* SUPABASE_PUBLISHABLE_KEY / ANON KEY

Buat file konfigurasi:

js/config.js

Contoh:

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

Semua operasi sensitif harus diamankan menggunakan:

* RLS
* Supabase Auth
* Role checking

Jangan hanya menyembunyikan tombol di frontend untuk security.

---

# 15. Struktur Project

Gunakan struktur seperti:

/
│
├── index.html
├── portfolio.html
├── portfolio-detail.html
├── booking.html
├── about.html
│
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── bookings.html
│   ├── portfolio.html
│   ├── categories.html
│   ├── users.html
│   └── settings.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── config.js
│   ├── supabase.js
│   ├── main.js
│   ├── portfolio.js
│   ├── booking.js
│   ├── dark-mode.js
│   ├── auth.js
│   │
│   └── admin/
│       ├── dashboard.js
│       ├── bookings.js
│       ├── portfolio.js
│       ├── categories.js
│       └── users.js
│
└── assets/
└── images/

---

# 16. Coding Requirements

Setiap halaman harus:

* Berfungsi secara nyata
* Tidak hanya UI mockup
* Terhubung ke Supabase
* Memiliki loading state
* Memiliki empty state
* Memiliki error handling
* Memiliki success notification
* Responsive

Jangan menggunakan:

* Data dummy permanen
* Fungsi kosong
* Tombol yang tidak berfungsi
* Placeholder dashboard yang tidak memiliki implementasi

Jika membutuhkan data contoh, data tersebut harus mudah dihapus dan diganti dengan data Supabase.

---

# 17. SEO

Buat basic SEO:

* Meta title
* Meta description
* Open Graph
* Semantic HTML
* Alt text untuk gambar

---

# 18. Final Requirement

Sebelum selesai:

1. Buat seluruh struktur project.
2. Implementasikan website publik.
3. Implementasikan Admin Dashboard.
4. Implementasikan Supabase integration.
5. Buat file SQL database lengkap.
6. Implementasikan authentication.
7. Implementasikan CMS portfolio.
8. Implementasikan booking system.
9. Implementasikan dark mode.
10. Implementasikan WhatsApp confirmation.
11. Periksa seluruh halaman dan JavaScript untuk memastikan tidak ada broken link atau tombol yang tidak berfungsi.

Jangan membuat desain generik atau AI slop.

Prioritaskan kualitas visual dan usability.

Website harus terasa seperti produk fotografi premium yang benar-benar siap dikembangkan dan digunakan.

Jangan berhenti hanya pada desain. Implementasikan semua fitur hingga dapat digunakan.

Jika ada informasi Supabase yang belum tersedia, gunakan placeholder yang jelas dan buatkan komentar lokasi yang harus saya isi.
