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
			$("#jumboInfo").text('Tocca al gruppo Produzione!');
			$("#jumboInfo2").text('Passa il tablet');
			$("#avanti").click(function(){
				window.open('preproduzione.html','_self');
			});
		}else if(turno==="ActionTurn"){
			$("#jumboInfo").text('Tocca al gruppo Croce Rossa!');
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
			$("#jumboInfo").text('Turno Emergenza');
			$("#jumboInfo2").text('Passa il turno cliccando "Avanti"');
			$("#avanti").click(function(){
				socket.emit('nextTurn', JSON.parse('{}'), function(response) {
					window.open('transito.html','_self');
				});
			});
		}
	}else if (stato_gioco==="GAME_VICTORY"){
		$("#jumboInfo").text('Complimenti!');
		$("#jumboInfo2").text('Vittoria');
		$("#avanti").hide();
	}else{
		$("#jumboInfo").text('Peccato!');
		$("#jumboInfo2").text('Sconfitta');
		$("#avanti").hide();
	}
	
}