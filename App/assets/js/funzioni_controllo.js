var socket;
function settaSocket(s){
	"use strict";
	socket=s;
}

$(document).ready(function() {
    "use strict";
    inizializzaDati();
    
});

function inizializzaDati(){
	"use strict";
	socket.emit('getState', JSON.parse('{}'), function(response) {
    	var obj = JSON.parse(response);
		controlloStato(obj);
	});

}

function controlloStato(obj){
    "use strict";
    var stato_gioco=obj.gameState.currentState;
    var turno= obj.currentTurn.type;
	
	
	if (stato_gioco==="GAME_ACTIVE"){
		if(turno==="ProductionTurn"){
			var nomeGruppo = obj.currentTurn.group.name;
			$("#jumboInfo").text('Tocca al gruppo '+nomeGruppo+'!');
			$("#jumboInfo2").text('Passa il tablet');
			$("#avanti").click(function(){
				window.open('preproduzione.html','_self');
			});
		}else if(turno==="ActionTurn"){
			var nomeGruppo = obj.currentTurn.group.name;
			$("#jumboInfo").text('Tocca al gruppo '+nomeGruppo+'!');
			$("#jumboInfo2").text('Passa il tablet');
			$("#avanti").click(function(){
				window.open('crocerossa.html','_self');
			});
		}else if(turno==="EventTurn"){
			$("#jumboInfo").text('Turno Evento');
			$("#jumboInfo2").text('Passa il turno cliccando "Avanti"'); 
			$("#avanti").click(function(){
				socket.emit('nextTurn', JSON.parse('{}'), function(response) {
					window.open('transito.html','_self');
				});
			});
		}else{
			var tipoEmergenza = obj.currentTurn.emergency;	
			$("#jumboInfo").text('Emergenza '+tipoEmergenza);
			$("#jumboInfo2").text('Passa il turno cliccando "Avanti"');
			$("#avanti").click(function(){
				socket.emit('nextTurn', JSON.parse('{}'), function(response) {
					window.open('transito.html','_self');
				});
			});
		}
	}else if (stato_gioco==="GAME_VICTORY"){
		$("#jumboInfo").html('<center>Complimenti! <br> Avete sconfitto la malattia!<br>Vittoria!</center>');
		$("#avanti").hide();
	}else{
		$("#jumboInfo").html('<center>Non siete riusciti a sconfiggere la malattia!<br> Sconfitta!</center>');
		$("#avanti").hide();
	}
	
}