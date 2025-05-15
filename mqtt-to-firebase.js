
const mqtt = require('mqtt');
const admin = require('firebase-admin');
const axios = require('axios');
const serviceAccount = require("./heart-rate-iot-abcbf-firebase-adminsdk-fbsvc-2ced2c8b7c.json");

// ====== Firebase Setup ======
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://heart-rate-iot-abcbf-default-rtdb.firebaseio.com" 
});

const db = admin.database();

// ====== MQTT Setup ======
const mqttUser = "anggajananda398@gmail.com";
const mqttPassword = "@Jananda11"; // ganti sesuai akun MaQiaTTo
const mqttTopic = "anggajananda398@gmail.com/HeartRateIot";

const client = mqtt.connect('mqtt://maqiatto.com', {
  username: mqttUser,
  password: mqttPassword
});

// ====== Blynk Setup ======
const blynkToken = "6h5iFIjOCNrKwUB_nGyhVZESPbt-ehmw"; // 
// ====== MQTT Listener ======
client.on('connect', () => {
  console.log("MQTT Connected");
  client.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error("Subscribe error:", err);
    } else {
      console.log(`Subscribed to topic: ${mqttTopic}`);
    }
  });
});

client.on('message', async (topic, message) => {
  const bpm = message.toString();
  const timestamp = Date.now();

  console.log(`BPM Received: ${bpm}`);

  try {
    // ===== Simpan ke Firebase Realtime =====
    await db.ref("HeartRateRealtime").set({
      bpm: bpm,
      timestamp: timestamp
    });

    // ===== Simpan ke Firebase History =====
    await db.ref("HeartRateHistory").push({
      bpm: bpm,
      timestamp: timestamp
    });

    // ===== Kirim ke Blynk (Virtual Pin V0) =====
    const blynkUrl = `https://blynk.cloud/external/api/update?token=${blynkToken}&v0=${bpm}`;
    await axios.get(blynkUrl);

    console.log("✅ Data terkirim ke Firebase & Blynk");
  } catch (err) {
    console.error("❌ Error saat proses:", err.message);
  }
});

