<div align="center">

# 🧮 Math Tug of War

**Tarik Tambang Matematika — Real-Time 1v1 Multiplayer Educational Game**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7+-black.svg)](https://socket.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*[Bahasa Indonesia](#indonesian) | [English](#english)*

![Game Banner](https://img.shields.io/badge/Math%20Tug%20of%20War-1v1%20Real--Time%20⚡-blueviolet)

</div>

---

## 🇮🇩 Indonesian

### 🎮 Apa itu Math Tug of War?

**Math Tug of War** adalah game edukasi kompetitif real-time 1v1 yang menggabungkan adu ketangkasan mental (aritmatika cepat) dengan dinamika tarik tambang klasik. Pemain bersaing menarik tali ke arah zona mereka dengan menyelesaikan soal matematika secepat dan setepat mungkin.

### ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| ⚡ **Quick Match** | Matchmaking otomatis untuk menemukan lawan secara acak |
| 🏠 **Private Room** | Buat room dengan kode 6-digit dan ajak teman |
| 🎯 **3 Tingkat Kesulitan** | Mudah (SD), Standar (SMP), Hardcore (SMA-Mahasiswa) |
| 🎨 **Dual Input Mode** | Pilihan Ganda (4 opsi) atau Numpad/Keyboard |
| 📊 **Real-time Sync** | WebSocket sinkronisasi posisi tali 60 FPS |
| 🔥 **Combo System** | Streak jawaban benar meningkatkan force (max 1.5x) |
| ❄️ **Anti-Cheat** | Jawaban TIDAK pernah dikirim ke client |
| 📱 **Responsive** | Mobile (360px) & Desktop (1920px) friendly |
| 🔄 **Rematch** | Main lagi dengan lawan yang sama |
| 📈 **Match Stats** | Akurasi, kecepatan, force, streak |

### 🚀 Quick Start

#### Prasyarat
- Node.js v18+ 
- npm atau yarn

#### Instalasi

```bash
# Clone repository
git clone https://github.com/rakasyau/math-tug-of-war.git
cd math-tug-of-war

# Install dependencies
npm install

# Jalankan server
npm start
```

Buka `http://localhost:3000` di browser.

#### Development Mode (Auto-reload)

```bash
npm run dev
```

### 🎯 Cara Bermain

1. **Pilih Mode**: Quick Match atau Private Room
2. **Jika Private Room**: 
   - Pemain 1 klik "Buat Room" → catat kode 6 digit
   - Pemain 2 klik "Gabung Room" → masukkan kode
3. **Klik READY** → tunggu lawan juga ready
4. **Jawab soal** secepat mungkin!
5. **Tali bergeser** berdasarkan force yang dihasilkan
6. **Menangkan** dengan menarik tali ke zona kamu!

### ⚙️ Formula Force

```
F(t) = F_base × max(e^(-λ × t), 0.20) × C_combo
```

| Parameter | Nilai | Deskripsi |
|-----------|-------|-----------|
| F_base | 12-20 | Daya tarik maksimal (berdasarkan difficulty) |
| λ | 0.35 | Faktor peluruhan eksponensial |
| M_min | 0.20 | Pengali minimum (20% dari base) |
| C_combo | 1.0-1.5 | Pengali kombo beruntun |

#### Contoh Output Force

| Waktu Respon | Efisiensi | Force (Medium) | Kategori |
|-------------|-----------|----------------|----------|
| ≤ 0.5 detik | 84-100% | 12.6 - 15.0 | ⚡ Godlike |
| 1.0 detik | 70% | 10.6 | 🔥 Fast |
| 2.0 detik | 50% | 7.4 | 👍 Normal |
| 5.0 detik | 20% (min) | 3.0 | 🐌 Slow |

### 🏗️ Arsitektur

```
math-tug-of-war/
├── 📄 package.json
├── 📄 README.md
├── 📁 server/
│   ├── 📄 index.js              # Express + Socket.io server
│   └── 📁 game/
│       ├── 📄 MathEngine.js          # Generator soal + kalkulasi force
│       ├── 📄 GameRoom.js            # State machine per room
│       └── 📄 GameRoomManager.js     # Room lifecycle & matchmaking
├── 📁 client/
│   ├── 📄 index.html            # Main HTML
│   ├── 📁 css/
│   │   └── 📄 style.css         # Dark theme, responsive
│   └── 📁 js/
│       └── 📄 game.js           # Socket.io client & DOM
└── 📁 test/
    └── 📄 integration.js       # Integration tests
```

### 🔌 WebSocket Protocol

#### Client → Server
| Event | Deskripsi |
|-------|-----------|
| `QUICK_MATCH` | Cari lawan random |
| `CREATE_ROOM` | Buat room private |
| `JOIN_ROOM` | Gabung room dengan kode |
| `PLAYER_READY` | Tandai siap bermain |
| `START_GAME` | Mulai pertandingan |
| `SUBMIT_ANSWER` | Kirim jawaban |

#### Server → Client
| Event | Deskripsi |
|-------|-----------|
| `ROOM_JOINED` | Konfirmasi masuk room |
| `GAME_STATE_UPDATE` | Update posisi tali (real-time) |
| `NEW_QUESTION` | Soal berikutnya (tanpa jawaban!) |
| `MATCH_OVER` | Hasil akhir + statistik |
| `ANSWER_RESULT` | Hasil jawaban (benar/salah) |

### 🛡️ Security

- ✅ Jawaban **TIDAK PERNAH** dikirim ke client
- ✅ Validasi semua input di server
- ✅ Timestamp mikrodetik untuk deteksi automation
- ✅ Server-authoritative architecture

### 📱 Screenshots

```
┌────────────────────────────────────────────────────────┐
│ [ROOM: 782910]          MATCH TIME: 01:24              │
├────────────────────────────────────────────────────────┤
│   (Player 1 - YOU)              (Player 2 - ENEMY)     │
│   ┌────────┐                          ┌────────┐       │
│   │ 🤠 84  │                          │ 🤖 52  │       │
│   └────────┘                          └────────┘       │
│   Streak: 3x 🔥                        Streak: 0x     │
│                                                        │
│              🚩══════════════════════                  │
│   [-100] ◄───|═══════╪═══════|───► [+100]            │
│                    TALI                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│              SOAL MATEMATIKA ANDA                      │
│                   7 × 8 − 14                           │
│              [████████████░░░░░░] Force: 11.4          │
│                                                        │
│            ┌────────────┬────────────┐                 │
│            │  [1]  42   │  [2]  48   │                 │
│            ├────────────┼────────────┤                 │
│            │  [3]  52   │  [4]  40   │                 │
│            └────────────┴────────────┘                 │
└────────────────────────────────────────────────────────┘
```

### 🤝 Contributing

Kontribusi sangat diterima! Silakan buka issue atau pull request.

### 📄 License

[MIT](LICENSE) — Bebas digunakan dan dimodifikasi.

---

## 🇬🇧 English

### 🎮 What is Math Tug of War?

**Math Tug of War** is a real-time 1v1 competitive educational game that combines mental arithmetic challenges with classic tug-of-war mechanics. Players compete to pull the rope toward their zone by solving math problems as quickly and accurately as possible.

### ✨ Features

- ⚡ Quick Match with random matchmaking
- 🏠 Private rooms with 6-digit codes
- 🎯 3 difficulty levels (Easy, Medium, Hard)
- 🎨 Multiple choice & Numpad input modes
- 📊 60 FPS real-time rope synchronization
- 🔥 Combo streak system (up to 1.5x force)
- ❄️ Anti-cheat: answers never sent to clients
- 📱 Mobile & Desktop responsive
- 🔄 Instant rematch system
- 📈 Detailed post-match statistics

### 🚀 Quick Start

```bash
git clone https://github.com/rakasyau/math-tug-of-war.git
cd math-tug-of-war
npm install
npm start
```

Open `http://localhost:3000`

### 📄 License

MIT

---

<div align="center">

**[⬆ Back to Top](#-math-tug-of-war)**

Made with ❤️ by [rakasyau](https://github.com/rakasyau)

</div>
