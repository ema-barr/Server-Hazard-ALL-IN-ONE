import requests
import json
from flask import Flask
from flask import request

app = Flask(__name__)

@app.route("/b0", methods=["GET"])
def button0():
    requests.get('http://localhost:6882/get_production_card?cardIndex=0')
    return ""

@app.route("/b1", methods=["GET"])
def button1():
    requests.get('http://localhost:6882/get_production_card?cardIndex=1')
    return ""

@app.route("/b2", methods=["GET"])
def button2():
    requests.get('http://localhost:6882/get_production_card?cardIndex=2')
    return ""

@app.route("/b3", methods=["GET"])
def button3():
	requests.get('http://localhost:6882/get_production_card?cardIndex=3')
	return ""

@app.route("/command/<command>", methods=["GET", "POST"])
def sendCommandToArduino(command):
	try:
		requests.get('http://192.168.4.1/?command:' + command,  timeout=4)
	except:
	    print ""
	try:
		requests.get('http://192.168.4.1/?command:' + command,  timeout=4)
	except:
	    print ""
	return "Done"

if __name__ == "__main__":
    app.run(host="0.0.0.0", threaded=True, port=6883)
