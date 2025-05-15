

const mqtt = require("mqtt");
const admin = require("firebase-admin");
const express = require("express");

// ========== FIREBASE SETUP ==========
const serviceAccount = require("./heart-rate-iot-abcbf-firebase-adminsdk-fbsvc-2ced2c8b7c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://heart-rate-iot-abcbf-default-rtdb.firebaseio.com" 
});

const db = admin.database();
const bpmRef = db.ref("bpmRealtime");
const historyRef = db.ref("bpmHistory");

// ========== MQTT SETUP ==========
const mqttUser = "anggajananda398@gmail.com";
const mqttPassword = "@Jananda11"; 
const mqttTopic = "anggajananda398@gmail.com/HeartRateIot";

const options = {
  host: "maqiatto.com",
  port: 1883,
  protocol: "mqtt",
  username: mqttUser,
  password: mqttPassword
};

const client = mqtt.connect(options);

client.on("connect", () => {
  console.log("MQTT Connected");
  client.subscribe(mqttTopic, (err) => {
    if (err) {
      console.error("Subscribe error:", err);
    } else {
      console.log("Subscribed to topic:", mqttTopic);
    }
  });
});

client.on("message", (topic, message) => {
  const bpm = parseInt(message.toString());
  if (!isNaN(bpm) && bpm > 30 && bpm < 200) {
    console.log("BPM diterima:", bpm);

    // Simpan ke Firebase Realtime (untuk data live)
    bpmRef.set({
      value: bpm,
      timestamp: Date.now()
    });

    // Simpan ke Firebase History (data historis)
    historyRef.push({
      value: bpm,
      timestamp: Date.now()
    });
  } else {
    console.log("Data BPM tidak valid:", message.toString());
  }
});

// ========== WEB SERVER UNTUK UPTIMEROBOT ==========
const app = express();

app.get("/", (req, res) => {
  res.send("Listener aktif dan berjalan!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server aktif di port ${PORT}`);
});


