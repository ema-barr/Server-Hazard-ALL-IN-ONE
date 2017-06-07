//Flipster per Carte Bonus
var flipContainer;
var flipItemContainer;

var LOCATIONID = "it.uniba.hazard.engine.map.Location_";
var EMERGENCYID = "it.uniba.hazard.engine.main.Emergency_";
var logs = []; //array di log
var dati = new Object();
var nomeGruppo; //nome del gruppo in gioco

function settaSocket(s){
	"use strict";
	socket=s;
}

$(document).ready(function(){
    "use strict";
    inizializzaDati();
});

//Questa funzione deve prelevare i dati dal file json del server
function inizializzaDati(){
    "use strict";
	sessionStorage.numTurnoCR = Number(sessionStorage.numTurnoCR) + 1;
	dati.azioneAttuale = 0;
	aggiornaDati();
	
	$("#container").append("<button class='btn btn-success btn-block btn-lg' type='button' id='terminaTurnoP' onclick='terminaTurnoCR()'>Termina il turno</button><br>");
}

function salvaLog(log){
	logs.push(log);
}

function aggiornaDati(){
	"use strict";
	
	// STATO TURNO

	socket.emit('getCurrentTurn', "{}", function(response) {
		console.log(response);
    	var oggetto = JSON.parse(response);
		nomeGruppo = oggetto.group.name;
		dati.origine = oggetto.pawn.location.name;
		dati.gravita=0;
		//dati.gravita = oggetto.pawn.location.emergencyLevels[0].level;
		dati.emergenzeLocation = oggetto.pawn.location.emergencyLevels;
		dati.maxAzioni= oggetto.maxNumActions;
		dati.pawnID = oggetto.pawn.pawnID;
		dati.carteBonus = oggetto.bonusCards;
		
		
		// RISORSE
	
		var data = new Object();
		data.locationID = LOCATIONID + dati.origine;
		socket.emit('getTransports', JSON.stringify(data), function(response){
			console.log(response);
			var risorse = JSON.parse(response);
			if(risorse.pawns.length > 0){
				dati.pawnTransport = risorse.pawns[0].pawnID;
				dati.risorseDisponibili = risorse.pawns[0].payload.length;
				dati.tipoRisorsa = [];
				dati.quantitaRisorsa = [];
				for (var ris=0; ris < dati.risorseDisponibili; ris++){
					dati.tipoRisorsa.push(risorse.pawns[0].payload[ris].resource);
					dati.quantitaRisorsa.push(risorse.pawns[0].payload[ris].quantity);
				}
			}else{
				dati.risorseDisponibili = 0;
			}
			
			// EMERGENZE
	
			var data = new Object();
			data.locationID = LOCATIONID + dati.origine;
			socket.emit('getEmergencies', JSON.stringify(data), function(response){
				console.log(response);
				var emergency = JSON.parse(response);
				dati.emergenze = emergency.emergencies;
				
				// PRESIDI
		
				var data = new Object();
				data.locationID = LOCATIONID + dati.origine;
				socket.emit('getStrongholdInfo', JSON.stringify(data), function(response){
					console.log(response);
					var presidi = JSON.parse(response);
					dati.costoPresidi = presidi.currentStrongholdCost;
					dati.presidiNellArea = presidi.strongholdsInArea;
					
					// Riaggiornamento grafico
					$("#pannelli").empty();
					creaTabAzioni(dati);
					$('.nav-pills a[href="#tab_2"]').tab('show');	// doppia selezione della tab, per un bug
					$('.nav-pills a[href="#tab_1"]').tab('show'); 
					$("#numAzione").html("Azione "+(dati.azioneAttuale)+" di "+dati.maxAzioni);
					aggiornaListaDestinazioni(dati);
					
					
					//Carte Bonus
					creaCarteBonus();
				}); 
			}); 
		}); 
	});
		
}


//Crea il pannello
function creaTabAzioni(dati){
    "use strict";
    
	$("#titoloTurno").html("Turno " + sessionStorage.numTurnoCR + " dell' "+nomeGruppo);
	
	//SPOSTA
	$("#pannelli").append("<div class='tab-pane' id='tab_1'>");
	$("#tab_1").append("<h4 align='center' id='labelSposta'><strong>Sposta la pedina da "+dati.origine+" a:</strong></h4>");
	$("#tab_1").append("<form class='form-horizontal' id='form_1'>");
	$("#form_1").append("<div class='col-sm-12' id='spostaR'>");
	$("#spostaR").append("<select class='form-control' id='destinazione_sposta'>");  
	
	$("#spostaR").append("<br>");
	$("#spostaR").append("<div class='col-sm-4 col-sm-offset-4' id='spostaB'>");
	$("#spostaB").append("<button class='btn btn-success btn-lg btn-block' type='button' id='spostaButtonCrR' onclick='spostaButtonCR()'>Sposta </button>");
	$("#spostaB").append("<br>");								   
	
	//CURA
	$("#pannelli").append("<div class='tab-pane' id='tab_2'>");
	$("#tab_2").append("<form class='form-horizontal' id='form_2'>");
	$("#form_2").append("<div class='form-group' id='form2'>");
	$("#form2").append("<div class='col-sm-12' id='labelCura'>");
	$("#labelCura").append("<h4 align='center'><strong>Cura emergenze in "+dati.origine+"</strong></h4>");
	$("#labelCura").append("<br>");
	
	if(dati.emergenze.length === 0){
		$("#labelCura").append("<h3>Non ci sono emergenze da curare!</h3>");
	}else{
		$("#labelCura").append("<table align='center' class='tg' id='tabellaEmergenza'>");
		$("#tabellaEmergenza").append("<colgroup id='colgroupEmergenza'>");
		$("#colgroupEmergenza").append("<col style='width: 160px'>");
		$("#colgroupEmergenza").append("<col style='width: 160px'>");
		$("#colgroupEmergenza").append("<col style='width: 160px'>");
		$("#tabellaEmergenza").append("<tr id='trEmergenza'>");
		$("#trEmergenza").append("<th class='tg-baqh'>Emergenza</th>");
		$("#trEmergenza").append("<th class='tg-baqh'>Livello</th>");
		$("#trEmergenza").append("<th class='tg-baqh'>Costo</th>");
		$("#trEmergenza").append("<th class='tg-baqh'>Cura</th>");		
		for(var riga=0; riga<dati.emergenze.length; riga++){
			for(var livello=0; livello<dati.emergenzeLocation.length; livello++){
				if(dati.emergenze[riga].name===dati.emergenzeLocation[livello].emergency){
					dati.gravita=dati.emergenzeLocation[livello].level;
				}
			}
			$("#tabellaEmergenza").append("<tr id='trRisorseEmergenza_"+riga+"'>"+
			"<td>"+dati.emergenze[riga].name+ "</td>"+
			"<td>"+dati.gravita+ "</td>"+
			"<td> 1 " +dati.emergenze[riga].resourceNeeded.name+"</td>"+
			"<td><button class='btn btn-success btn-lg btn-block' type='button' id='curaEmergenzaButton"+ riga +"'onclick='curaEmergenza("+ riga +")'>Cura</button></td>");
		}
	}
	

	//PRELEVA
	$("#pannelli").append("<div class='tab-pane' id='tab_3'>");
	$("#tab_3").append("<h4 align='center' id='labelRisorse'><strong>Risorse disponibili in "+ dati.origine +": </strong></h4>");
	$("#tab_3").append("<br>");
	$("#tab_3").append("<form class='form-horizontal' id='form_3'>");
	$("#form_3").append("<div class='form-group' id='form3'>");
	$("#form3").append("<div class='col-sm-12' id='labelPreleva'>");
	
	if(!dati.risorseDisponibili){
		$("#labelPreleva").append("<h3 align='center'>Non ci sono risorse da prelevare!</h3>");
	}else{
		$("#labelPreleva").append("<table align='center' class='tg' id='tabellaPreleva'>");
		$("#tabellaPreleva").append("<colgroup id='colgroupPreleva'>");
		$("#colgroupPreleva").append("<col style='width: 160px'>");
		$("#colgroupPreleva").append("<col style='width: 160px'>");
		$("#tabellaPreleva").append("<tr id='trPreleva'>");
		$("#trPreleva").append("<th class='tg-baqh'>Tipologia</th>");
		$("#trPreleva").append("<th class='tg-baqh'>Quantità</th>");		 
		for(var riga=0; riga<dati.risorseDisponibili; riga++){
			$("#tabellaPreleva").append("<tr id='trRisorsePreleva_"+riga+"'><td>"+dati.tipoRisorsa[riga]+"</td><td>"+dati.quantitaRisorsa[riga]+"</td>");
		}
		
		$("#labelPreleva").append("<br>");
		$("#labelPreleva").append("<div class='col-sm-4 col-sm-offset-4' id='prelevaB'>");
		$("#prelevaB").append("<button class='btn btn-success btn-lg btn-block' type='button' id='prelevaCheck' onclick='prelevaButton()'>Preleva Tutto</button>");
		$("#labelPreleva").append("<br>");
	}
	
	
	//COSTRUISCI PRESIDIO
	$("#pannelli").append("<div class='tab-pane' id='tab_4'>");
	$("#tab_4").append("<form class='form-horizontal' id='form_4'>");
	$("#form_4").append("<div class='form-group' id='form4'>");
	$("#form4").append("<div class='col-sm-12' id='labelPresidio'>");
	$("#labelPresidio").append("<h4 class='text-center' id='labelOsp'><strong>Vuoi costruire un presidio in "+dati.origine+"?</strong></h4>");
	$("#labelPresidio").append("<br>");
	
	if(dati.presidiNellArea.length === 0){
		$("#labelPresidio").append("<h3>Non vi sono presidi da costruire!</h3>");
	}else{
		$("#labelPresidio").append("<table align='center' class='tg' id='tabellaPresidio'>");
		$("#tabellaPresidio").append("<colgroup id='colgroupPresidio'>");
		$("#colgroupPresidio").append("<col style='width: 160px'>");
		$("#colgroupPresidio").append("<col style='width: 160px'>");
		$("#tabellaPresidio").append("<tr id='trPresidio'>");
		$("#trPresidio").append("<th class='tg-baqh'>Tipologia</th>");
		$("#trPresidio").append("<th class='tg-baqh'>Emergenza</th>");
		$("#trPresidio").append("<th class='tg-baqh'>Costo</th>");
		$("#trPresidio").append("<th class='tg-baqh'>Costruisci</th>");		
		for(var riga=0; riga<dati.presidiNellArea.length; riga++){
			$("#tabellaPresidio").append("<tr id='trRisorsePresidio_"+riga+"'>"+
			"<td>"+dati.presidiNellArea[riga].strongholdName+ "</td>"+
			"<td>"+dati.presidiNellArea[riga].emergencyName+ "</td>"+
			"<td>"+ dati.costoPresidi + " " +dati.presidiNellArea[riga].strongholdResource+"</td>"+
			"<td><button class='btn btn-success btn-lg btn-block' type='button' id='costruisciPresidioButton"+ riga +"'onclick='costruisciPresidio("+ riga +")'>Costruisci</button></td>");
		}
	}
	
	
}

function aggiornaListaDestinazioni(dati){
	"use strict";
	dati.destinazioni=[];
		
	var data = new Object();
	data.locationID = LOCATIONID + dati.origine;
	socket.emit('getAdjacentLocations', JSON.stringify(data), function(response) {
	var dest = JSON.parse(response);
	var numeroDestinazioni = dest.locations.length;
	$("#destinazione_sposta").empty();
	for (var destinazione=0; destinazione<numeroDestinazioni; destinazione++){
		dati.destinazioni.push(dest.locations[destinazione].name);
		// parte visiva
		$("#destinazione_sposta").append("<option>"+dati.destinazioni[destinazione]+"</option>"); 
	}
	if($("#destinazione_sposta").is(':empty')){
		$("#spostaButtonCrR").prop("disabled", true);
	}
   });
	
	
}

function aggiornaAzioni(){
    "use strict";
	
	dati.azioneAttuale++;
	$("#numAzione").html("Azione "+dati.azioneAttuale+" di "+dati.maxAzioni);
	
    if(dati.azioneAttuale >= dati.maxAzioni){
	
        $("#spostaButtonCrR").prop("disabled", true);
        $("#curaCheck").prop("disabled", true);
        $("#prelevaCheck").prop("disabled", true);
        $("#costruisciCheck").prop("disabled", true);
		// disabilita i bottoni delle tabelle
		for(var i=0; i<dati.presidiNellArea.length; i++){
			$("#costruisciPresidioButton"+i).prop("disabled", true);
		}
		for(var i=0; i<dati.emergenze.length; i++){
			$("#curaEmergenzaButton"+i).prop("disabled", true);
		}
    }
}

function setModalCRLog (logString){
	"use strict";
	$("#modalLogCRBody").html(logString);
	$("#modalLogCR").modal();
}

//funzione per spostare le risorse
function spostaButtonCR(){
    "use strict";
	var data = new Object();
	data.targetDestination = LOCATIONID + $("#destinazione_sposta").find("option:selected").text();
	socket.emit('moveActionPawn', JSON.stringify(data), function(response) {
    	var obj = JSON.parse(response);
		if(!obj.success){
			setModalCRLog(obj.logString);
		} else {
			aggiornaAzioni();
			setModalCRLog(obj.logString);
			salvaLog(obj.logString);
		}
		
		aggiornaDati();
	});

	
}


// passare l'indice del presidio da costruire, basato sull'array dati.emergenze
function curaEmergenza(i){
    "use strict";
	var data = new Object();
	data.emergencyID = EMERGENCYID + dati.emergenze[i].name;
	socket.emit('solveEmergency', JSON.stringify(data), function(response){
		var obj = JSON.parse(response);
		if(!obj.success){
			setModalCRLog(obj.logString);
		}else{
			aggiornaAzioni();
			setModalCRLog(obj.logString);
			salvaLog(obj.logString);
		}
		
		aggiornaDati();
	});
	
}

function prelevaButton(){
    "use strict";
	var data = new Object();
	data.pawnID = dati.pawnTransport; 
	console.log(data);
	socket.emit('takeResources', JSON.stringify(data), function(response){
		var obj = JSON.parse(response);
		if(!obj.success){
			setModalCRLog(obj.logString);
		}else{
			aggiornaAzioni();
			setModalCRLog(obj.logString);
			salvaLog(obj.logString);
		}
		
		aggiornaDati();
		
	});

 
}

// passare l'indice del presidio da costruire, basato sull'array dati.presidiNellArea
function costruisciPresidio(i){
    "use strict";
	
	var data = new Object();
	data.emergencyID = EMERGENCYID + dati.presidiNellArea[i].emergencyName;
	data.locationID = LOCATIONID + dati.origine;
	console.log(data);
	socket.emit('buildStronghold', JSON.stringify(data), function(response){
		var obj = JSON.parse(response);
		if(!obj.success){
			setModalCRLog(obj.logString);
		}else{
			aggiornaAzioni();
			setModalCRLog(obj.logString);
			salvaLog(obj.logString);
		}
		
		aggiornaDati();
	}); 

	
}


//Funzione per creare le Carte Bonus
function creaCarteBonus(){
    "use strict";
	
	$("#carteBonus").empty();
	for (var i=0; i<dati.carteBonus.length; i++){
		$("#carteBonus").append(
    	"<li>"+
          "<div class='Button Block' align='center'>"+
            "<h1>" + dati.carteBonus[i].name +"</h1>"+
            "<p>" +dati.carteBonus[i].description + "</p>"+
			"<br>" +
            "<button class='btn btn-success btn-lg btn-block' type='button' onclick='giocaCarta("+i+")' id='giocaBonus" + i + "'>Gioca</button>"+
          "</div>"+
        "</li>");
	}
	
	flipContainer = $('.flipster');
    flipItemContainer = flipContainer.find('.flip-items');
	
	flipContainer.flipster({
	  itemContainer: flipItemContainer,
	  itemSelector: 'li',
	  loop: true,
	  style: 'carousel',
	  spacing: -0.5,
	  scrollwheel: false,
	  buttons: true
	});
	
	flipContainer.flipster('index');
}

function giocaCarta(i){
	"use strict";
	$('#cartaBonusBody').html("Hai selezionato la carta: "+dati.carteBonus[i].name+". Vuoi giocarla ora?");

	$('#confermaCB').off("click");
	$('#confermaCB').click(function(){
		$("#carteBonusDialog").modal("hide");
		
		var data = new Object();
		data.cardIndex = i;
		socket.emit('useBonusCard', JSON.stringify(data), function(response){
			var obj = JSON.parse(response);
			if(!obj.success){
				setModalCRLog(obj.logString);
				$("#giocaBonus"+i).prop("disabled", true);
				$("#giocaBonus"+i).html("Già giocata");
				$("#carteBonusDialog").modal("hide");
			}else{
				setModalCRLog(obj.logString);
				salvaLog(obj.logString);
			}
			
			aggiornaDati();
		
		});	
	});
	
	$('#carteBonusDialog').modal();
}


function terminaTurnoCR(){
   "use strict";
    var azioniRimaste = dati.maxAzioni - dati.azioneAttuale;
	if(azioniRimaste===0){
		$("#fineTurnoCRBody").html("Hai terminato le azioni da eseguire.");
	}else{
		$("#fineTurnoCRBody").html("Hai ancora "+azioniRimaste+" azioni che potresti effettuare: <br>sei sicuro di terminare il turno?");
	}
	
    $("#fineTurnoCRDialog").modal();
}

//Click su Conferma Fine Turno -> vai al report
function confermaFTCR(){
    "use strict";
    $("#fineTurnoCRDialog").modal("hide");
	socket.emit('nextTurn', "{}", function(response) {
		
	});
	
	sessionStorage.nomeGruppo=nomeGruppo;
	// salva i log nella sessionStorage
	var storedLogs = JSON.parse(sessionStorage.logCrocerossa);
	storedLogs.push(logs);
	sessionStorage.logCrocerossa = JSON.stringify(storedLogs);
	
    window.open('reportCroceRossa.html','_self');
}
