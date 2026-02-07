# Website Audit Akaun Masjid

Website ini untuk urus akaun masjid dengan fungsi:

- Admin login.
- Catat duit masuk / keluar.
- Lampirkan bukti (gambar/PDF).
- Auto-generate resit untuk transaksi tunai masuk.
- Generate laporan audit.
- **Cloud sync (Firebase Firestore + Storage)** supaya data boleh kongsi antara device.

## Cara buka (paling mudah)

1. Buka terminal dan masuk folder projek.
2. Jalankan:

```bash
python3 -m http.server 8000
```

3. Buka browser: `http://localhost:8000`
4. Login default: `admin` / `admin123`

## Aktifkan Cloud Sync (boleh sync)

## Cloud guna Google?

**Ya, boleh.** Dalam projek ini, cloud sync memang guna **Google Firebase** (produk Google Cloud) iaitu:

- **Cloud Firestore** untuk data transaksi.
- **Cloud Storage** untuk fail bukti (gambar/PDF).

Jadi jika anda tanya “boleh cloud guna Google ka?” jawapannya **boleh dan memang sudah disediakan** melalui Firebase config.

Secara default app jalan mode local sahaja. Untuk sync cloud:

1. Cipta projek Firebase.
2. Aktifkan **Firestore Database** dan **Storage**.
3. Salin fail config:

```bash
cp firebase-config.example.js firebase-config.js
```

4. Isi nilai config dalam `firebase-config.js`.
5. Refresh browser.

Kalau betul, atas kanan akan tunjuk: **`Mod: cloud sync aktif`**.

## Jika tidak boleh buka

- Pastikan command server masih berjalan.
- Cuba `http://127.0.0.1:8000`.
- Jika port 8000 sudah dipakai:

```bash
python3 -m http.server 8080
```

kemudian buka `http://localhost:8080`.
