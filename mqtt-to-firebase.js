// mqtt-to-firebase.js

const mqtt = require("mqtt");
const admin = require("firebase-admin");
const moment = require("moment");

// Load Firebase service account key
const serviceAccount = require("./adminsecurekey.json");

// Inisialisasi Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://heart-rate-iot-abcbf-default-rtdb.firebaseio.com",
});

const db = admin.database();

// Koneksi ke broker MQTT MaQiaTTo
const options = {
  host: "maqiatto.com",
  port: 1883,
  username: "anggajananda398@gmail.com",
  password: "Jananda11", 
  clientId: "esp32-listener-" + Math.random().toString(16).substr(2, 8),
};

const topic = "anggajananda398@gmail.com/HeartRateIot";
const client = mqtt.connect(options);

client.on("connect", () => {
  console.log("✅ MQTT connected");
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to topic: ${topic}`);
    } else {
      console.error("❌ Subscribe error:", err);
    }
  });
});

client.on("message", async (topic, message) => {
  try {
    const rawData = message.toString();
    const bpm = parseFloat(rawData) / 1000;
    const time = moment().format("YYYY-MM-DD HH:mm:ss");

    // Data input untuk perhitungan
    const HR = bpm;
    const W = 60; // Berat badan (kg)
    const A = 20; // Usia (tahun)
    const T = 1;  // Waktu dalam menit

    // Kalori berdasarkan rumus
    const QL =
      (((-55.0969 + 0.6309 * HR + 0.1988 * W + 0.2017 * A) * T) / 60) /
      4.184;
    const QP =
      (((-20.4022 + 0.4472 * HR - 0.1263 * W + 0.074 * A) * T) / 60) /
      4.184;

    // Data untuk disimpan
    const data = {
      bpm: parseFloat(bpm.toFixed(1)),
      kaloriLaki: parseFloat(QL.toFixed(2)),
      kaloriPerempuan: parseFloat(QP.toFixed(2)),
      timestamp: time,
    };

    // Push ke Firebase Realtime Database
    await db.ref("heartrate-history").push(data);

    console.log("📥 Received & stored:", data);
  } catch (err) {
    console.error("❌ Error processing message:", err);
  }
});

client.on("error", (err) => {
  console.error("❌ MQTT connection error:", err);
});



