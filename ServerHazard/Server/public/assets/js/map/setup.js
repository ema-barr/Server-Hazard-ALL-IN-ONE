var defaultSize = 3; //Dimensione indicatore città
var plotType = "rounded"; //Tipo indicatore città
var defaultStroke = 1; //Spessore linea di collegamento
var defaultFactor = -0.15; //Curvatura linea di collegamento [- verso l'alto, + verso il basso]

$(".map-container").mapael({
		map: {
			name: "hazard_map",
			defaultArea : {
				attrs: {
					stroke: "#7C7C7C",
					"stroke-width": 0.2
				}
			}
		},
	//QUI DEFINISCO I COLORI DELLE AREE
	areas : {
		"Asia1": {
			
			value:1,
			
		},
		"Asia2": {
			
			value:1,
			
		},
		"Asia3": {

			value:1,
			
		},		
		"Asia4": {
			value:1,
			
		},		
		"Asia5": {
			value:1,
			
		},		
		"Asia6": {
			value:1,
			
		},		
		"Asia7": {
			value:1,
			
		},		
		"Oce1": { //Australia
			value:1,
			
		},		
		"Oce2": { //Nuova Zelanda
			value:1,
			
		},		
		"Africa1": { //Nord Africa
			value:1,
			
		},
		"Africa2": { //Africa Centrale
			value:1,
			
		},		
		"Africa3": { //Sud Centrale
			value:1,
			
		},
		"Africa4": { //Madagascar
			value:1,
			
		},		
		"Eu1": { //Eu Ovest
			value:1,
					},		
		"Eu2": { //Eu Est
			value:1,
			
		},		
		"Eu3": { //Scandinavia
			value:1,
			
		},		
		"Eu4": { //UK
			value:1,
			
		},		
		"Eu5": { //Islanda
			value:1,
			
		},		
		"America1": { //Groenlandia
			value:5,
			
		},		
		"America2": { //Canada
			value:1,
			
		},		
		"America3": { //USA
			value:1,
			
		},		
		"America4": { //America Centrale
			value:1,
			
		},		
		"America5": { //Sud America Colombia,Bolive ecc
			value:1,
			
		},		
		"America6": { //Sud America Brasile
			value:1,
			
		},		
		"America7": { //Sud America Argentina,Uruguay, ...
			value:1,	
		},

	},
	legend : {
		area: {
			display: true,
			title: "Livello Infezione",
			mode: "horizontal",
			slices: [
	            {
	                max: 1,
	                attrs: {
	                    fill: "#5BCA09"
	                },
	                label: "Livello 1"
	            },
	            {
	                min: 2,
	                max: 3,
	                attrs: {
	                    fill: "#B5EC03"
	                },
	                label: "Livello 2"
	            },
	            {
	                min: 4,
	                max: 5,
	                attrs: {
	                    fill: "#FF9C01"
	                },
	                label: "Livello 3"
	            },
	            {
	                min: 6,
	                attrs: {
	                    fill: "#FE2701"
	                },
	                label: "Livello 4"
	            }
			]
		}
	},
	//QUI DEFINISCO LE CITTA'
	plots :{
		'canada': {
			type : plotType,
			size : defaultSize,
			latitude: 70,
			longitude: 30,
			tooltip: {content: "<span style=\"font-weight:bold;\">Zona :</span> Canada <br /><span style=\"font-weight:bold;\">Risorsa 1 :</span> 50 <br /><span style=\"font-weight:bold;\">Risorsa 2 :</span> 30 <br />",

						persistent:true,
					 },
			text : 'Canada'
		},
		'usa': {
		 	type: 'image',
		 	url : './assets/img/icon.png',
		 	width: 6,
		 	height: 6,
			latitude: 70,
			longitude: 50,
			tooltip: {content: "<span style=\"font-weight:bold;\">Zona :</span> U.S.A. <br /><span style=\"font-weight:bold;\">Risorsa 1 :</span> 50 <br /><span style=\"font-weight:bold;\">Risorsa 2 :</span> 30 <br />",
						persistent:true,
					 },
			text : 'Usa'
		}
	},
	/*
	links  : {
		'link1' : {
			factor : defaultFactor,
			between : ['paris','newyork'],
			value:1,
			attrs : {
				'stroke-width': defaultStroke
				'text' : 'x';
			}
		}
	}*/
});