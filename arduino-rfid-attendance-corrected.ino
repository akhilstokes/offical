#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <LiquidCrystal_I2C.h>

/* ===== WIFI DETAILS ===== */
const char* ssid = "AKHIL";
const char* password = "akhilnknk";

/* ===== SERVER ===== */
// CORRECTED: Changed port from 3000 to 5000 and added /api/attendance/rfid path
const char* serverUrl = "http://10.208.100.39:5000/api/attendance/rfid";

/* ===== NTP ===== */
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 19800;   // IST
const int   daylightOffset_sec = 0;

/* ===== RFID PINS ===== */
#define SS_PIN   5
#define RST_PIN  27

/* ===== OBJECTS ===== */
MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

/* ===== DEBOUNCE ===== */
unsigned long lastReadTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  /* LCD INIT */
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("RFID Attendance");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(1500);

  /* WIFI */
  WiFi.begin(ssid, password);
  lcd.clear();
  lcd.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
  lcd.clear();
  lcd.print("WiFi Connected");

  /* TIME */
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Time Sync Failed");
    lcd.setCursor(0, 1);
    lcd.print("Time Error");
  } else {
    Serial.println("Time Synced");
  }

  /* RFID */
  SPI.begin(18, 25, 23, SS_PIN);
  pinMode(SS_PIN, OUTPUT);
  digitalWrite(SS_PIN, HIGH);
  rfid.PCD_Init();
  delay(1000);

  lcd.clear();
  lcd.print("System Ready");
  lcd.setCursor(0, 1);
  lcd.print("Tap RFID Card");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // debounce (server also protects)
  if (millis() - lastReadTime < 3000) {
    rfid.PICC_HaltA();
    return;
  }
  lastReadTime = millis();

  /* READ UID */
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  /* TIME */
  struct tm timeinfo;
  getLocalTime(&timeinfo);
  char dateStr[20];
  char timeStr[20];
  strftime(dateStr, sizeof(dateStr), "%d-%m-%Y", &timeinfo);
  strftime(timeStr, sizeof(timeStr), "%H:%M:%S", &timeinfo);

  /* SERIAL OUTPUT */
  Serial.println("---------------------------");
  Serial.println("UID  : " + uid);
  Serial.println("Date : " + String(dateStr));
  Serial.println("Time : " + String(timeStr));
  Serial.println("---------------------------");

  /* SEND TO SERVER */
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{";
    jsonPayload += "\"uid\":\"" + uid + "\",";
    jsonPayload += "\"date\":\"" + String(dateStr) + "\",";
    jsonPayload += "\"time\":\"" + String(timeStr) + "\"";
    jsonPayload += "}";

    Serial.println("Sending to: " + String(serverUrl));
    Serial.println("Payload: " + jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.println("Response: " + response);
      
      lcd.clear();
      lcd.print("Attendance OK");
      lcd.setCursor(0, 1);
      lcd.print(timeStr);
    } else if (httpResponseCode == 404) {
      Serial.println("Error: RFID card not registered");
      String response = http.getString();
      Serial.println("Response: " + response);
      
      lcd.clear();
      lcd.print("Card Not Found");
      lcd.setCursor(0, 1);
      lcd.print("Register First");
    } else if (httpResponseCode == 400) {
      String response = http.getString();
      Serial.println("Response: " + response);
      
      lcd.clear();
      lcd.print("Already Done");
      lcd.setCursor(0, 1);
      lcd.print("Today");
    } else {
      String response = http.getString();
      Serial.println("Response: " + response);
      
      lcd.clear();
      lcd.print("Server Error");
      lcd.setCursor(0, 1);
      lcd.print(String(httpResponseCode));
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
    lcd.clear();
    lcd.print("WiFi Lost");
  }

  delay(2000);
  lcd.clear();
  lcd.print("Tap RFID Card");
  rfid.PICC_HaltA();
}
