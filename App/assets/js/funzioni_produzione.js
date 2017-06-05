var arrCamion = [];
var socket;
var LOCATIONID = "it.uniba.hazard.engine.map.Location_";
var OBJECTID = "it.uniba.hazard.engine.pawns.TransportPawn_";
var logs = []; //array di log
var nomeGruppo; //nome del gruppo in gioco

function settaSocket(s){
	"use strict";
	socket=s;
}

$(document).ready(function(){
    "use strict";
	//METTERE QUESTO E TOGLIERE JSONESEMPIO
	socket.emit('getCurrentTurn', "{}", function(response) {
    	var obj = JSON.parse(response);
		inizializzaDati(obj);
	}); 

});

//Questa funzione deve prelevare i dati dal json del server
function inizializzaDati(oggetto){
    "use strict";
	sessionStorage.numTurnoP = Number(sessionStorage.numTurnoP) + 1;
	nomeGruppo = oggetto.group.name;
    //Prelevo i dati dal server, e salvo i dati

    //Variabile per il numero di camion
    var numeroCamion = oggetto.group.transportPawns.length;

    caricaPillsCamion(numeroCamion);
    
    
    for(var j=0; j<numeroCamion; j++){
      var camion = new Object();
	  camion.pawnID = oggetto.group.transportPawns[j].pawnID;
      camion.origine=oggetto.pawnLocations[j].location.name;

	  camion.risorseTrasportate = oggetto.group.transportPawns[j].payload.length;
	  camion.quantità = [];
	  camion.tipologia = [];
		for(var risorse=0; risorse<camion.risorseTrasportate; risorse++){
			camion.quantità.push(oggetto.group.transportPawns[j].payload[risorse].quantity) ;
      		camion.tipologia .push(oggetto.group.transportPawns[j].payload[risorse].resource) ;
		}
      
      camion.spostamenti= oggetto.pawnMoves[j].remainingMoves;
      arrCamion.push(camion);
		
    }
    
    creaTabProduzione(arrCamion);
	
	for(var i=0; i<arrCamion.length; i++){
		aggiornaListaDestinazioni(arrCamion, i);
	}
}

function aggiornaListaDestinazioni(arrCamion, indiceCamion){
	"use strict";
	arrCamion[indiceCamion].destinazione= [];
	
	var data = new Object();
	data.locationID = LOCATIONID + arrCamion[indiceCamion].origine;
	socket.emit('getAdjacentLocations', JSON.stringify(data), function(response) {
	var dest = JSON.parse(response);
	var numeroDestinazioni = dest.locations.length;
	$("#dest_"+indiceCamion).empty();
	for (var destinazione=0; destinazione<numeroDestinazioni; destinazione++){
		arrCamion[indiceCamion].destinazione.push(dest.locations[destinazione].name);
		// parte visiva
		$("#dest_"+indiceCamion).append("<option>"+arrCamion[indiceCamion].destinazione[destinazione]+"</option>");
	}	

	if($("#dest_"+indiceCamion).is(':empty')){
		$("#spostaButtonP_"+indiceCamion).prop("disabled", true);
	}
   }); 

	
}

function getSommaSpostamenti(){
    "use strict";
    var spostamentiTotali = 0;
    for(var i=0; i<arrCamion.length; i++){
        spostamentiTotali = spostamentiTotali + arrCamion[i].spostamenti;
    }
    return spostamentiTotali;
}

//Funzione per aggiornare le Pills Camion con il numero di camion da server
function caricaPillsCamion(numeroCamion){
    "use strict";
	var c;
	for (c=0; c<numeroCamion; c++){
		if(c===0){
			$("#camionPill").append(
			"<li class='active'>"+
			"<a href='#tab_"+c+"' data-toggle='pill'>Camion "+(c+1)+"</a>"+
            "</li>"
			);
		}else{
			$("#camionPill").append(
			"<li>"+
			"<a href='#tab_"+c+"' data-toggle='pill'>Camion "+(c+1)+"</a>"+
            "</li>"
		);
		}
		
	}
}

function salvaLog(log){
	logs.push(log);
}

//La funzione deve controllare se vi sono ancora spostamenti; in caso siano 0 deve disattivare il pulsante
function spostaButtonProduzione(i){
    "use strict";
	var data = new Object();
	data.destinationID = LOCATIONID + $("#dest_"+i).find("option:selected").text();
	data.pawnID = arrCamion[i].pawnID;
	socket.emit('moveTransportPawn', JSON.stringify(data), function(response) {
		var sposta = JSON.parse(response);
		if(sposta.success){
			arrCamion[i].spostamenti--; //non credo vada più, ma è da vedere 
			$("#nSpostamenti_"+i).text(arrCamion[i].spostamenti); //aggiorna il numero degli spostamenti a video
			if(arrCamion[i].spostamenti === 0){
				$("#spostaButtonP_"+i).prop("disabled", true);
			}
			arrCamion[i].origine = sposta.newLocation;
			//parte visuale
			$("#orig_"+i).text(arrCamion[i].origine);
			//chiamo l'aggiorna destinazioni
			aggiornaListaDestinazioni(arrCamion, i);
			setModalLog(sposta.logString);
			salvaLog(sposta.logString);
		}else{
			setModalLog(sposta.logString);
			//$("#spostaButtonP_"+i).prop("disabled", true);
		}
		
	});

}

function setModalLog (logString){
	"use strict";
	$("#modalLogPBody").html(logString);
	$("#modalLogP").modal();
}



function creaTabProduzione(arrCamion){
    "use strict";
	$("#titoloTurno").html("Turno "+ sessionStorage.numTurnoP +" del "+nomeGruppo);

    for(var i=0; i<arrCamion.length; i++){
       $("#pannelli").append("<div class='tab-pane' id='tab_"+i+"'>");
        if(i===0){
           $("#tab_"+i).addClass("active"); 
        }   
       $("#tab_"+i).append("<h4 align='center'>Dove vuoi spostare le risorse?</h4>");
       $("#tab_"+i).append("<form class='form-horizontal' id='form_"+i+"'>");
       $("#form_"+i).append("<div class='form-group' id='origineL_"+i+"'>");
       $("#origineL_"+i).append("<label class='control-label col-sm-2' for='origine_"+i+"'>Origine:</label>");
       $("#origineL_"+i).append("<div class='col-sm-10' id='origine_"+i+"'>");
       $("#origine_"+i).append("<p class='form-control-static' id='orig_"+i+"'>"+arrCamion[i].origine+"</p>");
       $("#form_"+i).append("<div class='form-group' id='destinazioneL_"+i+"'>");
       $("#destinazioneL_"+i).append("<label class='control-label col-sm-2' for='destinazione_"+i+"'>Destinazione:</label>");       
       $("#destinazioneL_"+i).append("<div class='col-sm-10' id='destinazione_"+i+"'>");
       $("#destinazione_"+i).append("<select class='form-control' id='dest_"+i+"'>");
       	
	   $("#form_"+i).append("<table align='center' class='tg' id='tabella_"+i+"' style='border-collapse:collapse;border-spacing:0;border-color:#aaa;table-layout: fixed; width: 314px'>");
	   $("#tabella_"+i).append("<colgroup id='colgroup_"+i+"'>");
	   $("#colgroup_"+i).append("<col style='width: 161px'>");
	   $("#colgroup_"+i).append("<col style='width: 153px'>");
	   $("#tabella_"+i).append("<tr id='tr_"+i+"'>");
	   $("#tr_"+i).append("<th class='tg-baqh' style='font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:#aaa;color:#fff;background-color:#f38630;text-align:center;vertical-align:top'>Tipologia</th>");
	   $("#tr_"+i).append("<th class='tg-baqh' style='font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:#aaa;color:#fff;background-color:#f38630;text-align:center;vertical-align:top'>Quantità</th>");		 
	   for(var riga=0; riga<arrCamion[i].tipologia.length; riga++){
		   $("#tabella_"+i).append("<tr id='trRisorse_"+riga+"'><td>"+arrCamion[i].tipologia[riga]+"</td><td>"+arrCamion[i].quantità[riga]+"</td>");
	   }

		
       $("#form_"+i).append("<div class='form-group' id='spostamentiL_"+i+"'>");
       $("#spostamentiL_"+i).append("<label class='control-label col-sm-2' for='spostamenti_"+i+"'>Spostamenti:</label>");
       $("#spostamentiL_"+i).append("<div class='col-sm-10' id='spostamenti_"+i+"'>");
       $("#spostamenti_"+i).append("<p class='form-control-static' id='nSpostamenti_"+i+"'>"+arrCamion[i].spostamenti+"</p>");
        
       $("#tab_"+i).append("<div class='col-sm-4 col-sm-offset-4' id='formButton_"+i+"'>");
       $("#formButton_"+i).append("<button class='btn btn-success btn-lg btn-block' type='submit' onclick='spostaButtonProduzione("+i+")' id='spostaButtonP_"+i+"'>Sposta </button><br>");

    }
    
    $("#container").append("<button class='btn btn-success btn-block btn-lg' type='button' id='terminaTurnoP' onclick='terminaTurnoProduzione()'>Termina il turno</button><br>");

}


//La funzione gestisce il fine turno, crea la modal di conferma e passa il turno
function terminaTurnoProduzione(){
   "use strict";
    var spostamentiTot= getSommaSpostamenti();
	if(spostamentiTot===0){
		$("#fineTurnoPBody").html("Hai terminato gli spostamenti da effettuare.");
	}else{
		$("#fineTurnoPBody").html("Hai ancora "+spostamentiTot+" spostamenti che potresti effettuare: <br>sei sicuro di terminare il turno?");
	}
	
    $("#fineTurnoPDialog").modal();
}


//Click su Conferma Fine Turno -> vai al report
function confermaFT(){
    "use strict";
    $("#fineTurnoDialog").modal("hide");
	socket.emit('nextTurn', "{}", function(response) {
		
	}); 
	
	// salva i log nella sessionStorage
	var storedLogs = JSON.parse(sessionStorage.logProduzione);
	storedLogs.push(logs);
	sessionStorage.logProduzione = JSON.stringify(storedLogs);
	
    window.open('reportProduzione.html','_self');
}





