# Website Audit Akaun Masjid

Website ini untuk urus akaun masjid dengan fungsi:

- Admin login.
- Catat duit masuk / keluar.
- Lampirkan bukti (gambar/PDF).
- Auto-generate resit untuk transaksi tunai masuk.
- Generate laporan audit.
- Butang **Padam** untuk buang transaksi yang tersalah masuk.
- **Cloud sync (Firebase Firestore + Storage)** supaya data boleh kongsi antara device.

## Guna terus di GitHub Pages

Laman live:

- https://cikgufathan.github.io/surauaudit/

Login default:

- Username: `admin`
- Password: `admin123`

## Cara buka lokal (paling mudah)

1. Buka terminal dan masuk folder projek.
2. Jalankan:

```bash
python3 -m http.server 8000
```

3. Buka browser: `http://localhost:8000`
4. Login default: `admin` / `admin123`

## Cloud guna Google?

**Ya, boleh.** Dalam projek ini, cloud sync guna **Google Firebase** (produk Google Cloud):

- **Cloud Firestore** untuk data transaksi.
- **Cloud Storage** untuk fail bukti (gambar/PDF).

## Aktifkan Cloud Sync (boleh sync)

Jika `firebase-config.js` sudah ada nilai `projectId`, cloud sync akan auto aktif.

1. Cipta projek Firebase.
2. Aktifkan **Firestore Database** dan **Storage**.
3. Isi fail `firebase-config.js` ikut projek anda.
4. Refresh browser.

Kalau betul, atas kanan akan tunjuk: **`Mod: cloud sync aktif`**.

## Jika tidak boleh buka

- Pastikan command server masih berjalan.
- Cuba `http://127.0.0.1:8000`.
- Jika port 8000 sudah dipakai:

```bash
python3 -m http.server 8080
```

kemudian buka `http://localhost:8080`.
