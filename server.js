const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Menyajikan file HTML dari folder 'public'
app.use(express.static('public'));

// Menyimpan status alat dan riwayat log di memori server
let stateAlat = { kondisi: 'standby', jarak: "25.0", kekeruhan: "450" };
let riwayatLogs = [];

io.on('connection', (socket) => {
  console.log('User terhubung dengan ID:', socket.id);

  // Kirim data awal saat user masuk
  socket.emit('initData', { state: stateAlat, logs: riwayatLogs });

  // Menerima request login
  socket.on('login', (nama) => {
    let role = (nama.toLowerCase() === 'agip') ? 'Host' : 'Member';
    socket.emit('loginSuccess', { nama: nama, role: role });

    let time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' });
    let logMsg = `<span class="log-time">[${time}]</span> <span><b>[${nama}]</b> masuk sebagai <b>${role}</b>.</span>`;
    riwayatLogs.unshift(logMsg);
    if(riwayatLogs.length > 15) riwayatLogs.pop();
    
    io.emit('newLog', logMsg);
  });

  // Menerima perintah perubahan status
  socket.on('ubahStatusAlat', (data) => {
    stateAlat = data.state;
    io.emit('updateStatus', stateAlat);

    let time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second:'2-digit' });
    let logMsg = `<span class="log-time">[${time}]</span> <span><b>[${data.pelaku}]</b> mengubah alat ke mode <b>${data.state.kondisi.toUpperCase()}</b>.</span>`;
    riwayatLogs.unshift(logMsg);
    if(riwayatLogs.length > 15) riwayatLogs.pop();
    
    io.emit('newLog', logMsg);
  });

  // Menerima perintah hapus log
  socket.on('hapusLogs', () => {
    riwayatLogs = [];
    io.emit('logsCleared');
  });

  socket.on('disconnect', () => {
    console.log('User terputus:', socket.id);
  });
});

// Menjalankan server di port 3000
http.listen(3000, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🚀 SERVER MULTIPLAYER IOT BERJALAN!');
  console.log('👉 Buka di browser: http://localhost:3000');
  console.log('========================================');
});