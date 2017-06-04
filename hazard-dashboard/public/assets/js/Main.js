window.$ = window.jQuery   = require('jquery');
var Raphael = require('raphael');
require('jquery-mousewheel');
var io = require('./lib/socket.io.min.js');
var l = require('./lang/Lang.js');
var config = require('./Config.js');
var lang = l[config['LANGUAGE']];
var ModalDialog =require('./utils/ModalDialog.js');
var Utils = require('./utils/Utils.js');
var MapUtils = require('./utils/MapUtils.js');
var Dashboard = require('./Dashboard.js');
var ParserXML = require('./lib/xml2json.min.js');
var GameState = require('./utils/GameState.js');

/**
 * @class Classe principale dell'applicazione
 * WARN: Non utilizzare JQuery nel costruttore
 */
 class HazardDashboard {


	/**
	 * Inizializza le classi e imposta i socket in ascolto
	 * @return NA
	 */
	 constructor() {
	 	this.INITIALIZED = false;
	 	String.prototype.capitalizeFirstLetter = function() {
	 		return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
	 	}

	 	Number.prototype.inRange = function(a,b){
	 		return (a < b ? this >= a && this <= b : this >= b && this <= a);
	 	}


	 	this.areas = {};
	 	this.plots = {};
	 	this.links = {};
	 	this.pawns = {};
		// Inizializzazione variabili di gioco
		this.cards = {};
		this.endGame = {};
		this.groups = {};
		this.locale = {};
		this.locations = {}; 
		this.resources = {};
		this.setup = {};
		this.strongholdinfos = {};
		this.turns = {};


		this.hazard = new Dashboard();
		this.parsing = new ParserXML();
		this.gameState = GameState;
		this.utils = new Utils();

		var self = this;
		//var socket = io.connect();
		var socket = io();

			console.log(socket);
			socket.on('welcome',function(data){
				if(!this.INITIALIZED){
					socket.emit('init_dashboard', data);
					self.gameStart('../../strutturaxml.xml');
					this.INITIALIZED = true;
				}
			});

			socket.on('update',function(data){
				console.log(data);
				self.handleState(data);
			});

			socket.on('popupMessage',function(data){
				
			});

			socket.on('closePopup',function(data){
				self.hazard.hideModal();
			});

			socket.on('chooseProductionCard',function(data){
				console.log(data);
				if(typeof(data) != `undefined` && typeof(data.cardIndex != `undefined`)) self.hazard.chooseCardPopup(data.cardIndex);
			});

			socket.on('init',function(data){
				self.gameStart();
			});

			/*socket.on('parsingXML',function(data){
				self.parseXML('test.xml',[self.hazard.initMap,self.placePawnsCallback]);	// DA RIVEDERE
			});*/

			socket.on('connection_error', function(){
				console.log("Waiting for connection ...");
			});


	}

	/**
	 * Avvia il gioco eliminando la finestra modal
	 * @return NA
	 */
	 gameStart(e){
	 	var self = this;
	 	this.hazard.initDashboard();
	 	this.hazard.hideModal(3000);
	 	//this.hazard.updateTurn();
	 	//this.hazard.addLog('INFO',lang['gamestartstext']);
	 	var dummyStateCallback = this.initDummyState.bind(this);
	 	this.parseXML(e,[this.hazard.initMap,this.placePawnsCallback,dummyStateCallback]);
	 	if(config['DEBUG']) {
			$('#debug').show();
				$('#debug-confirm').click(function() {
				self.handleState($('#debug-text').val());
			});
	 	}
	 	//this.initDummyState();
	 }

	/**
	 * Avvisa che la partita è conclusa con un modal
	 * @return NA
	 */
	 gameOver(){
	 	this.hazard.addLog('DANGER',lang['gameover']);
	 	this.hazard.showModal(lang['gameover'],lang['gameovertext'],'modal-danger');
	 }


	 /**
	  * Funzione di callback per posizionare le pedine, costruire la legenda e inserire gli HQ
	  * @param  {[type]} groups [description]
	  * @param  {[type]} plots  [description]
	  * @param  {[type]} hazard [description]
	  * @param  {[type]} utils  [description]
	  * @return {[type]}        [description]
	  */
	 placePawnsCallback(groups,plots,areas,hazard,utils){
	 	for(var key in groups){
	 		var group = groups[key];
	 		hazard.setGroupLegend(key,group.color)
	 		for(var h in group.hq){
	 			hazard.setHQ(utils.getDisplayedName(areas[group.hq[h]]),group.color);
	 		}
	 		if(group.type == 'actionGroup'){
	 			var position = {
	 				'top': plots[group.startingPoint+'-plot'].latitude,
	 				'left':plots[group.startingPoint+'-plot'].longitude
	 			};
	 			var groupObj= {};
	 			groupObj[key] = group.color;
	 			hazard.setPawn(groupObj,group.startingPoint,position);
	 		}
	 	}
	 }


	 initDummyState(){
	 	var dummyString = `{"state":{"gameState":{"currentState":"GAME_ACTIVE",
	 						"gameMap":{"locations":[],"pawns":[]},"blockades":[],"emergencies":[],
	 						"maxEmergencyLevel":5,"numOfProductionCards":1,"currentStrongholdCost":5,"contagionRatios":[]},
	 						"currentTurn":{"type":"Dummy","group":{"name":"Dummy","resources":[]},"numActions":0,"maxNumActions":0}},"response": { "success": "true", "logString": "`+lang['gamestartstext']+`" }}`;
	 	var dummyState = JSON.parse(dummyString);
	 	for(var id in this.areas){
	 		var l = {};
	 		l['name'] = id;
	 		l['locationID'] = 'it.uniba.hazard.engine.map.Location_'+id;
	 		l['emergencyLevels'] = [];
	 		for(var em in this.areas[id].emergencies){
	 			var e = {};
	 			e['emergency'] = em;
	 			e['level'] = this.areas[id].emergencies[em];
	 			l['emergencyLevels'].push(e);
	 		}
	 		dummyState.state.gameState.gameMap.locations.push(l);
	 	}

 		for (var g in this.groups){
 			var pawn = {};
 			pawn['pawnID'] = 'it.uniba.hazard.engine.pawns.'+this.groups[g].type+'_'+g;
 			pawn['type']  = this.groups[g].type;
 			pawn['location'] = this.groups[g].startingPoint;
 			pawn['group'] = g;
 			dummyState.state.gameState.gameMap.pawns.push(pawn);
 		}
 		this.gameState.setState(dummyState.state);
 		console.log('Dummy State: '+JSON.stringify(dummyState));
	 }

	/**
	 * Esegue il parsing del file XML di configurazione
	 * @return {NA}
	 */
	 parseXML(path,callback){
	 	var self = this;
		// Load the xml file using ajax 
		$.ajax({
			type: "GET",
			url: path,
			dataType: "text",
			success: function(xml){
		// Parsing
		var json = self.parsing.xml_str2json( xml )
		var dummyState = {};

		if(typeof(json) == 'undefined') return;

		//ciclo le l'xml di setup gioco
		self.cards = json.xml.game.cards;					
		self.endGame = json.xml.game.endGame;
		self.resources = json.xml.game.resources;					
		//self.groups = json.xml.game.groups;
		self.locale = json.xml.game.locale
		self.locations = json.xml.game.map.area.location;
		

		if(typeof self.resources['name'] == 'string') self.hazard.changeResources(self.resources.name, 0);
		else {
			for(var i = 0; i<self.resources['name'].length;i++){
				self.hazard.changeResources(self.resources['name'][i], 0);
			}
		}


		for(var j = 0; j < self.locations.length; j++) {
			self.areas[self.locations[j].name] = {};
			self.areas[self.locations[j].name].name = self.locations[j].name;
			self.areas[self.locations[j].name].emergencies = {};
			self.areas[self.locations[j].name].value = 1;

			self.plots[self.locations[j].name+'-plot'] = {};
			self.plots[self.locations[j].name+'-plot'].type = config['DEFAULT_PLOT_TYPE'];
			self.plots[self.locations[j].name+'-plot'].size = config['DEFAULT_PLOT_SIZE'];
			self.plots[self.locations[j].name+'-plot'].latitude = self.locations[j].latitude;
			self.plots[self.locations[j].name+'-plot'].longitude = self.locations[j].longitude;



			for(var em in json.xml.game.emergencies.emergency) self.setEmergency(self.locations[j].name,json.xml.game.emergencies.emergency[em].name,0);

				self.plots[self.locations[j].name+'-plot'].tooltip = {};
				self.areas[self.locations[j].name].visualName = self.locations[j].visualName;

				var showedName = self.utils.getDisplayedName(self.areas[self.locations[j].name]);
		
				self.plots[self.locations[j].name+'-plot'].tooltip.content = self.utils.__buildTooltip(showedName, self.areas[self.locations[j].name].emergencies); //CREAZIONE TOOLTIPS

				self.plots[self.locations[j].name+'-plot'].tooltip.offset = {};

				if(typeof(self.locations[j].offsetLeft) != 'undefined') {
					self.plots[self.locations[j].name+'-plot'].tooltip.offset.left = parseInt(self.locations[j].offsetLeft);
				}else if(typeof(self.locations[j].offsetTop) != 'undefined'){
					self.plots[self.locations[j].name+'-plot'].tooltip.offset.top = parseInt(self.locations[j].offsetTop);
				}
				self.plots[self.locations[j].name+'-plot'].tooltip.persistent = true;
				self.plots[self.locations[j].name+'-plot'].text = self.locations[j].name;

				if(typeof self.locations[j].neighborhood.neighbor == 'string'){
					var link = self.utils.getLinkIdentifier(self.locations[j].neighborhood.neighbor,self.locations[j].name);
					if( typeof(self.links[link]) == 'undefined') {
						self.links[link] = {};
						self.links[link].factor = config['DEFAULT_PLOT_FACTOR'];
						self.links[link].between = self.utils.getPlotsByLink(link);
						self.links[link].attrs = {};
						self.links[link].attrs['stroke-width'] = config['DEFAULT_PLOT_STROKE'];
						self.links[link].attrs['stroke-linecap'] = "round";
					}

				}else if(typeof self.locations[j].neighborhood.neighbor != 'undefined' && typeof self.locations[j].neighborhood.neighbor == 'array') {
					for(var neigh in self.locations[j].neighborhood.neighbor){
						//var neigh = self.locations[j].neighborhood.neighbor[i];
						var link = self.utils.getLinkIdentifier(neigh,self.locations[j].name);
						if( typeof(self.links[link]) == 'undefined') {
							self.links[link] = {};
							self.links[link].factor = config['DEFAULT_PLOT_FACTOR'];
							self.links[link].between = self.utils.getPlotsByLink(link);
							self.links[link].attrs = {};
							self.links[link].attrs['stroke-width'] = config['DEFAULT_PLOT_STROKE'];
							self.links[link].attrs['stroke-linecap'] = "round";

						}
					}
				}

						self.resources = json.xml.game.resources;
						self.setup = json.xml.game.setup;
						self.strongholdinfos = json.xml.game.strongholdinfos;
						self.turns = json.xml.game.turns;

			}



			for(var key in json.xml.game.groups) {
				if(json.xml.game.groups.hasOwnProperty(key)){
					for(var i = 0; i< json.xml.game.groups[key].length;i++){
						var keyName = json.xml.game.groups[key][i]['name'];
						self.groups[keyName] = {};
						self.groups[keyName].type = key;
						if(key == 'actionGroup'){
							self.groups[keyName].hq = [];
							self.groups[keyName].startingPoint = json.xml.game.groups[key][i].startingPoint;
							self.groups[keyName].location = json.xml.game.groups[key][i].startingPoint;
							for(var j = 0; j<json.xml.game.groups[key][i]['headquarters'].headquarter.length;j++){
								self.groups[keyName].hq.push(json.xml.game.groups[key][i]['headquarters']['headquarter'][j]);
							}
						}

						if(key == 'actionGroup' || key == 'productionGroup'){
							var groupColor = self.utils.getRandomColor();
							self.groups[keyName].color = groupColor.rgb;
						}
					}
				}
			}

			callback[0](self.areas,self.plots,self.links);
			callback[1](self.groups,self.plots,self.areas,self.hazard,self.utils);
			callback[2]();

		},
		error: function (exception) {
			console.log('Exeption:'+exception);
		}
	});
	}


	/*createEmergency(locationID,emergency,level){
		this.areas[locationID].emergencies[emergency] =  level;
	}*/

	eliminateEmergency(locationID,area) {
		this.areas[locationID].emergencies[emergency] = -1;
		this.hazard.updateEmergenciesTooltip(locationID,this.areas[locationID].emergencies)
	}

	setEmergency(locationID,emergency,level){
		var initialization = (typeof this.areas[locationID].emergencies[emergency] == 'undefined');
		this.areas[locationID].emergencies[emergency] = level;
		if(!initialization) this.hazard.updateEmergenciesTooltip(locationID,this.areas[locationID].emergencies)
	}


	handleState(data) {
		if(typeof data == 'string') {
			console.warn('Parameter data is a string, parsing as JSON Object');
			data = JSON.parse(data);
		}

		var response = data.response;
		var data = data.state;

		var diff = this.gameState.setState(data);
		if(diff.length == 0) return;

		var status = data.gameState.currentState;
		var success = response.success;
		var logString = response.logString;

		//for (var i = 0; i < diff.length; i++) {
			if (diff['currentState'] == 'GAME_ACTIVE') {

			} else if (diff['currentState'] == 'GAME_VICTORY') {
				/* Conclude il gioco con la vittoria dei giocatori */
				this.gameVictory();
			} else if (diff['currentState'] == 'GAME_LOSS'){
				this.gameOver(); 
			}
			if (diff['locations']) {
				var loc = diff['locations'];
				for (var j = 0; j < loc.length && loc[j] != undefined; j++) {
					for (var k = 0; k < loc[j].emergencyLevels.length; k++) {
						if (loc[j].emergencyLevels[k].level == 1) {
							/*Crea una nuova malattia nella nazione tramite createEmergency(LOCATIONID,NOMEEMERGENZA,LIVELLOEMERGENZA) */
							this.setEmergency(loc[j].name, loc[j].emergencyLevels[k].emergency, loc[j].emergencyLevels[k].level);
						} else if (loc[j].emergencyLevels[k].level == -1) {
							/*La malattia è stata curata, quindi va eliminata dalla mappa tramite eliminateEmergency(LOCATIONID,NOMEEMERGENZA) */
							this.eliminateEmergency(loc[j].name, loc[j].emergencyLevels[k].emergency);
						} else {
							/*Il livello malattia è stato modificato tramite modificateEmergencyLevel(LOCATIONID,NOMEEMERGENZA,LIVELLOEMERGENZA) */
							this.setEmergency(loc[j].name, loc[j].emergencyLevels[k].emergency, loc[j].emergencyLevels[k].level);
						}
					}
				}
			}

			if (diff['pawns']) {
				var pawns = diff['pawns'];
				for (var j = 0; j < pawns.length; j++) {
					/* Muove la pedina tramite movePawns(IDPEDINA,LOCAZIONESUCCESSIVA) */
					if(this.groups[pawns[j].group].location != pawns[j].location){
						/** Si è spostata la pedina pawnID del gruppo pawns[j].group in posizione pawns[j].location */
						this.groups[pawns[j].group].location = pawns[j].location; //Aggiorno la posizione corrente della pedina del grupp
						var position = {
							"top" : this.plots[pawns[j].location+'-plot'].latitude,
							"left" : this.plots[pawns[j].location+'-plot'].longitude

						};
						var group = {};
						group[pawns[j].group] = this.groups[pawns[j].group].color;
						this.hazard.setPawn(group, pawns[j].location,position );
					}
				}
			}

			if (diff['blockades']) {
				for(blockade in diff['blockades']){
					var link = this.utils.getLinkIdentifier(blockade[0],blockade[1]);
					if(typeof(this.links[link]) == `undefined`)
						throw new Error('Undefined type for blockade');
					else
						this.hazard.CloseLink(link);
				}
			}


			if (diff['emergencies']) {

			}
			if (diff['maxEmergencyLevel']) {

			}
			if (diff['numOfProductionCards']) {

			}

			if (diff['contagionRatios']){
				this.hazard.setProgress(diff.contagionRatios[0].contagionRatio);
			}

			if (diff['type'] == 'ActionTurn') {
				/*COMUNICA CHE INIZIA IL TURNO AZIONE*/
				let l = lang['currentlyPlaying'] + lang['actionGroup'];
				this.hazard.addLog("INFO", logString);
				this.hazard.updateTurn(lang['actionGroup']);

			} else if (diff['type'] == 'EmergencyTurn') {
				/*COMUNICA CHE INIZIA IL TURNO EMERGENZA*/
				let l = lang['currentlyPlaying'] + lang['emergencyGroup'];
				this.hazard.addLog("INFO", l);
				this.hazard.updateTurn(lang['emergencyGroup']);

			} else if (diff['type'] == 'EventTurn') {
				/*COMUNICA CHE INIZIA IL TURNO EVENTI*/
				let l = lang['currentlyPlaying'] + lang['eventGroup'];
				this.hazard.addLog("INFO", l);
				this.hazard.updateTurn(lang['eventGroup']);

			} else if (diff['type'] == 'ProductionGroup') {
				/*COMUNICA CHE INIZIA IL TURNO PRODUZIONE*/
				let l = lang['currentlyPlaying'] + lang['productionGroup'];
				this.hazard.addLog("INFO", l);
				this.hazard.updateTurn(lang['productionGroup']);
			}
			if (diff['group']) {
				for (var j = 0; j < diff['resources'].length && diff['resources'] != undefined; j++) {
					/* Cambia le risorse presenti nella schermata del giocatore  tramite changeResources(risorsa,numero)*/
					this.hazard.changeResources(diff['resources'][j].resource, diff['resources'][j].quantity);
				}
			}

			if(diff['numActions'] || diff['maxNumActions']){
				this.hazard.setActions(diff['numActions'],diff['maxNumActions']);
			}

			this.hazard.addLog("INFO", logString);
		}

	//}

}

var main = new HazardDashboard();

module.exports = main;







