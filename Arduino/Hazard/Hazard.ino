/*
  Hazard.ino is a short program written for Mobile Computer course
  of Master Degree in Computer Science. 

  Authors:
    Fabio De Pasquale
    Cosimo Lovascio

  Last update: 
    June 08th, 2017
*/
#include <Adafruit_NeoPixel.h>
#include <SoftwareSerial.h>
#include <pcmConfig.h>
#include <pcmRF.h>
#include <TMRpcm.h>
#include <SD.h>


//constants for strip led
const int STATUS_LED_PIN = 5;
const int STRIP_STATUS_LED_LENGTH = 3;
const int LED_PIN = 6;
const int STRIP_LED_LENGTH = 297;
const char LED_OFF = '0';
const char LED_RED = '1';
const char LED_GREEN = '2';
const char LED_ORANGE = '3';
const char LED_BLUE = '4';
const char LED_YELLOW = '5';
const char LED_WHITE = '6';

//constants for esp8266 wifi module
const int ESP_PIN_TX = 11;
const int ESP_PIN_RX = 12;

const boolean DEBUG = false;

//constants for speaker and sd card reader
const int SPEAKER_PIN = 46;
const int CARD_READER_PIN = 53;
const char SOUNDCODE_DECREASE_EMERGENCY = '1';
const char SOUNDCODE_INCREASE_CONTAGION = '2';
const char SOUNDCODE_BONUS_CARD = '3';
const char SOUNDCODE_BUILD_STRONGHOLD = '4';
const char SOUNDCODE_WIN_GAME = '5';
const char SOUNDCODE_LOSE_GAME = '6';
const char SOUNDCODE_SOLVE_EMERGENCY = '7';
const char SOUNDCODE_EMERGENCY_START = '8';
const char SOUNDCODE_TURN_START = '9';
const char SOUNDCODE_MOVE_PAWN = 'a';
const char SOUNDCODE_TAKE_RESOURCES = 'b';
const char SOUNDCODE_CHOOSE_CARD = 'c';

//constants for buttons
const int BUTTON_ONE_PIN = 30;
const int BUTTON_TWO_PIN = 32;
const int BUTTON_THREE_PIN = 34;
const int BUTTON_FOUR_PIN = 36;
const String BUTTON_API = "/b";

//constants for commands
const char LED_COMMAND = 'L';
const char SOUND_COMMAND = 'S';

//constants for server configuration
//const String IP_BOARD = "192.168.4.1";
const String IP_SERVER = "192.168.4.2";
const int PORT_NUMBER = 6883;
const String IP_TABLET = "192.168.4.3";

Adafruit_NeoPixel stripStatusLed = Adafruit_NeoPixel(STRIP_STATUS_LED_LENGTH, STATUS_LED_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip = Adafruit_NeoPixel(STRIP_LED_LENGTH, LED_PIN, NEO_GRB + NEO_KHZ800);
SoftwareSerial esp8266(ESP_PIN_TX, ESP_PIN_RX); 
TMRpcm tmrpcm;

int ping_delay = 990;
int deviceToCheck = 1;

/*
* Setup function.
*/
void setup() {
  tmrpcm.speakerPin = SPEAKER_PIN;
  Serial.begin(9600);
  
  if (!SD.begin(CARD_READER_PIN)) {
    Serial.println("SD initialization failed.");
    return;
  }
  tmrpcm.setVolume(5);
  tmrpcm.play("start.wav");
  delay(4000);
  
  stripStatusLed.begin();
  stripStatusLed.show();
  
  strip.begin();
  strip.show(); // initialize all pixels to 'off'
  
  Serial.begin(9600);
  esp8266.begin(9600);
   
  sendData("AT+RST\r\n",1000,DEBUG);            // reset module
  sendData("AT+CWMODE=2\r\n",500,DEBUG);       // configure as access point
  sendData("AT+CIFSR\r\n",500,DEBUG);          // get ip address
  sendData("AT+CIPMUX=1\r\n",500,DEBUG);       // configure for multiple connections
  sendData("AT+CIPSERVER=1,80\r\n",500,DEBUG); // turn on server on port 80

  //initialize buttons' pins
  pinMode(BUTTON_ONE_PIN, INPUT);
  pinMode(BUTTON_TWO_PIN, INPUT);

}

/*
* Loop cycle.
*/
void loop() {
  readingFromService();
  sendingFromButtons();
  checkStatus();
}

/*
* Check the components availability .
*/
void checkStatus() {

  if (ping_delay > 200) {

    //board is up
    stripStatusLed.setPixelColor(2, stripStatusLed.Color(0, 255, 0)); 
    stripStatusLed.show();

    if (deviceToCheck == 0){
      
      //check tablet
      pingTest(IP_TABLET,  0, 200); 
      deviceToCheck = 1;
    } else {

      //check server
      pingTest(IP_SERVER,  1, 200); 
      deviceToCheck = 0;
    }
    
    ping_delay = 0;
  }

  ping_delay++;
  
  delay(10);
  
}

/**
 * Ping test to the specified IP.
 * Params: ip - ip address;
           ledNumber - the status led number in the strip;
           pingTime - time between every ping test
 */
void pingTest(String ip, int ledNumber, int pingTime){
    
    String server_check = sendData("AT+PING=\""+ ip  + "\"\r\n", pingTime, DEBUG);
    server_check = server_check.substring(22, server_check.length()-2);
    
    if (server_check.length() == 0) {
        stripStatusLed.setPixelColor(ledNumber, strip.Color(155, 0, 0));
    } 
    else {
        server_check = server_check.substring(1, server_check.length());
        if(server_check.length() > 5){
            stripStatusLed.setPixelColor(ledNumber, stripStatusLed.Color(155, 50, 0));
        }
        else{
            if (server_check.toInt() < 100) {
                stripStatusLed.setPixelColor(ledNumber, stripStatusLed.Color(0, 155, 0));
            } 
            else {
                stripStatusLed.setPixelColor(ledNumber, stripStatusLed.Color(155, 50, 0));
            }
        }
    }

    stripStatusLed.show();
}

/* 
* Checks if some message was received from the server.
*/
void readingFromService() {

  // check if the esp is sending a message 
  if (esp8266.available()) { 
    if (esp8266.find("+IPD,")) {
      
      //Serial.println("listening");
      delay(1000); // wait for the serial buffer to fill up (read all the serial data)
       
      // get the connection id so that we can then disconnect
      // subtract 48 because the read() function returns
      // the ASCII decimal value and 0 (the first decimal number) starts at 48
      int connectionId = esp8266.read() - 48;  

      String closeCommand = "AT+CIPCLOSE="; 
      closeCommand += connectionId; // append connection id
      closeCommand += "\r\n";
      
      // close connection and retrive the message
      String input = sendData(closeCommand, 2000, DEBUG); 
      processInputCommand(input);
      //Serial.println(input);
       
     }
  }
}

/*
* Sends a message to a server if a button was pressed.
*/
void sendingFromButtons() {
  if (digitalRead(BUTTON_ONE_PIN)) {
    sendGetRequest("0"); 
  }
     
  delay(10);
    
  if (digitalRead(BUTTON_TWO_PIN)) {
    sendGetRequest("1"); 
  }
   
  delay(10);
  
  if (digitalRead(BUTTON_THREE_PIN)) {
    sendGetRequest("2"); 
  }
   
  delay(10);
  
  if (digitalRead(BUTTON_FOUR_PIN)) {
    sendGetRequest("3"); 
  }
   
  delay(10);
}

/*
* Sends a GET request to the server.
* Params: buttonId - the button pressed
*/
void sendGetRequest(String buttonId) {
  
  String command = "AT+CIPSTART=0,\"TCP\",";
  command += "\"";
  command += IP_SERVER;
  command += "\",";
  command += PORT_NUMBER;
  command += "\r\n";

  sendData(command, 500, DEBUG);
  sendData("AT+CIPSEND=0,25\r\n", 500, DEBUG);
  
  String request = "GET ";
  request += BUTTON_API + buttonId;
  sendData(request, 500, DEBUG);
  
  sendData(" \r\n", 200, DEBUG);
  sendData(" \r\n", 200, DEBUG);
  sendData(" \r\n", 200, DEBUG);

  sendData("AT+CIPCLOSE=0\r\n", 500, DEBUG);
  
}


/*
* Reads the input string received from the server.
* Params: input - the string with the commands to process
*/
void processInputCommand(String input) {

  int i = 0; //start index of input command
  int inputSize = input.length();
  
  //Serial.println(input);
  
  for (int k = 0; k < 2; k++) {

    while (!(input.charAt(i) == '-' 
      && input.charAt(i + 1) == 'I' 
      && input.charAt(i + 2) == 'S' 
      && input.charAt(i + 3) == 'T' 
      && input.charAt(i + 4) == '-')) {
            
      i++; 
      if (i >= inputSize) {
        Serial.println("Error: command not found");
        return;
      }
    }

    i += 5;
  }
     
  int j = i;
  while (!(input.charAt(j) == '-' 
    && input.charAt(j + 1) == 'I' 
    && input.charAt(j + 2) == 'S' 
    && input.charAt(j + 3) == 'T' 
    && input.charAt(j + 4) == '-')) {

    j++;
    if (j >= inputSize) {
      Serial.println("Error: command not found");
      return;
    }
  }
  
  String command = input.substring(i, j);
    
  Serial.print("Command: ");
  Serial.println(input.substring(i, j));

  char command_code = command.charAt(0);

  switch (command_code) {
    case LED_COMMAND:
      for (int i = 0; i < STRIP_LED_LENGTH; i++) {
        char led = command.charAt(i + 1);
        processLedCommand(led, i);
      }
      break;

    case SOUND_COMMAND:
      processSoundCommand(command.charAt(1));
      break;

    default:
      Serial.println("Command unknown");
      break;
  }   
}

/*
* Plays a sound for the given sound code.
* Params: sound - the sound code
*/
void processSoundCommand(char sound) {
  switch(sound) {

    Serial.println(sound);
    
    case SOUNDCODE_DECREASE_EMERGENCY:
      tmrpcm.setVolume(5);
      tmrpcm.play("1.wav");
      break;

    case SOUNDCODE_INCREASE_CONTAGION:
      tmrpcm.setVolume(5);
      tmrpcm.play("2.wav");
      break;

    case SOUNDCODE_BONUS_CARD:
      tmrpcm.setVolume(5);
      tmrpcm.play("3.wav");
      break;

    case SOUNDCODE_BUILD_STRONGHOLD:
      tmrpcm.setVolume(5);
      tmrpcm.play("4.wav");
      break;

    case SOUNDCODE_WIN_GAME:
      tmrpcm.setVolume(5);
      tmrpcm.play("5.wav");
      break;

    case SOUNDCODE_LOSE_GAME:
      tmrpcm.setVolume(5);
      tmrpcm.play("6.wav");
      break;

    case SOUNDCODE_SOLVE_EMERGENCY:
      tmrpcm.setVolume(5);
      tmrpcm.play("7.wav");
      break;

    case SOUNDCODE_EMERGENCY_START:
      tmrpcm.setVolume(5);
      tmrpcm.play("8.wav");
      break;

    case SOUNDCODE_TURN_START:
      tmrpcm.setVolume(5);
      tmrpcm.play("9.wav");
      break;

    case SOUNDCODE_MOVE_PAWN:
      tmrpcm.setVolume(5);
      tmrpcm.play("a.wav");
      break;

    case SOUNDCODE_TAKE_RESOURCES:
      tmrpcm.setVolume(5);
      tmrpcm.play("b.wav");
      break;

    case SOUNDCODE_CHOOSE_CARD:
      tmrpcm.setVolume(5);
      tmrpcm.play("c.wav");
      break;

    default:
      Serial.println("Sound unknown");
      break;
  }
}

/*
* Changes the color for the given led code
* Params: ledColor - a code for a led color;
          ledNumber - the led number in the board
*/
void processLedCommand(char ledColor, uint16_t ledNumber) {
  switch (ledColor) {

    case LED_OFF:
      strip.setPixelColor(ledNumber, strip.Color(0, 0, 0));
      strip.show();
      break;

    case LED_RED:
      strip.setPixelColor(ledNumber, strip.Color(255, 0, 0));
      strip.show();
      break;

    case LED_GREEN:
      strip.setPixelColor(ledNumber, strip.Color(0, 255, 0));
      strip.show();
      break;

    case LED_ORANGE:
      strip.setPixelColor(ledNumber, strip.Color(255, 150, 0));
      strip.show();
      break;

    case LED_BLUE:
      strip.setPixelColor(ledNumber, strip.Color(0, 0, 255));
      strip.show();
      break;

    case LED_YELLOW:
      strip.setPixelColor(ledNumber, strip.Color(255, 245, 0));
      strip.show();
      break;

    case LED_WHITE:
      strip.setPixelColor(ledNumber, strip.Color(255, 255, 255));
      strip.show();
      break;

    default:
      Serial.println("Led color unknown");
  }
}

/*
* Function used to send data to ESP8266.
* Params: command - the data/command to send; 
          timeout - the time to wait for a response; 
          debug - print to Serial window?(true = yes, false = no)
* Returns: The response from the esp8266 (if there is a reponse)
*/
String sendData(String command, const int timeout, boolean debug) {
  String response = "";
   
  esp8266.print(command); // send the read character to the esp8266
   
  long int time = millis();
   
  while ((time+timeout) > millis()) {
    while (esp8266.available()) {
       
      // the esp has data so display its output to the serial window 
      char c = esp8266.read(); // read the next character.
      response+=c;
    } 
  }
   
  if (debug) {
    Serial.print(response);
  }
  
  return response;
}

// Fill the dots one after the other with a color
void colorWipe(uint32_t c, uint8_t wait) {
  for (uint16_t i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, c);
    strip.show();
    delay(wait);
  }
}

void rainbow(uint8_t wait) {
  uint16_t i, j;

  for (j = 0; j < 256; j++) {
    for (i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i, Wheel((i + j) & 255));
    }
    strip.show();
    delay(wait);
  }
}

// Slightly different, this makes the rainbow equally distributed throughout
void rainbowCycle(uint8_t wait) {
  uint16_t i, j;

  for (j = 0; j < 256*5; j++) { // 5 cycles of all colors on wheel
    for (i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i, Wheel(((i * 256 / strip.numPixels()) + j) & 255));
    }
    strip.show();
    delay(wait);
  }
}

//Theatre-style crawling lights.
void theaterChase(uint32_t c, uint8_t wait) {
  for (int j = 0; j < 10; j++) {  //do 10 cycles of chasing
    for (int q = 0; q < 3; q++) {
      for (int i = 0; i < strip.numPixels(); i = i + 3) {
        strip.setPixelColor(i + q, c);    //turn every third pixel on
      }
      strip.show();
     
      delay(wait);
     
      for (int i = 0; i < strip.numPixels(); i = i + 3) {
        strip.setPixelColor(i + q, 0);        //turn every third pixel off
      }
    }
  }
}

//Theatre-style crawling lights with rainbow effect
void theaterChaseRainbow(uint8_t wait) {
  for (int j = 0; j < 256; j++) { // cycle all 256 colors in the wheel
    for (int q = 0; q < 3; q++) {
        for (int i = 0; i < strip.numPixels(); i = i + 3) {
          strip.setPixelColor(i + q, Wheel((i + j) % 255)); // turn every third pixel on
        }
        strip.show();
       
        delay(wait);
       
        for (int i = 0; i < strip.numPixels(); i = i + 3) {
          strip.setPixelColor(i + q, 0); // turn every third pixel off
        }
    }
  }
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
  if (WheelPos < 85) {
    return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);

  } else if (WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);

  } else {
    WheelPos -= 170;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
}
