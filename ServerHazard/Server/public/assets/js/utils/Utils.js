var l = require('../lang/Lang.js');
var config = require('../Config.js');
var lang = l[config['LANGUAGE']];

/**
 * Funzioni di supporto alla dashboard
 */

class Utils {
	/**
	 * Crea il tag contenente il testo da visualizzare in un tooltip sulla mappa
	 * @param  {String} name [Nome della zona per la quale si sta creando il tooltip]
	 * @param  {String []} vars [Array delle risorse, la chiave contiene il nome della risorsa e il campo contiene la quantità]
	 * @return NA
	 */
	__buildTooltip(name,vars){
		var content_text = `<ul class="tooltip-list" id="`+name+`-tooltiplist">`;
		content_text += `<li><span style=\"font-weight:bold;\">`+lang['zone']+`</span>` + name+`</li>`;

		for(var key in vars){
			if(vars[key].level == -1) continue;
			var i = this.getIndexByValue(vars[key].level);
			var symbol = (vars[key].hasStronghold) ? `&#9733;` : '';
			content_text += `
							<li><div class="float-wrapper">
							<span>`+key+` :</span>
							<div id="`+key+`-`+name+`" style="background-color:`+config['LEGEND'][i].color+`">`+symbol+`</div>
							</li></div>`;
		}
		content_text += `</ul>`;
		//var tooltip = {content: content_text}
		return content_text;
	}


	getDisplayedName(area){
		if(typeof area.visualName == 'string'){
			return area.visualName;
		}else {
			return area.name;
		}
	}

	getRealCoords(position) {
		//Adatto all'effettiva dimensione della mappa sullo schermo
		var viewPort = {} 
		viewPort.left = $(config['MAP_CONTAINER'] + ' > .map > svg').width();
		viewPort.top = $(config['MAP_CONTAINER'] + ' > .map > svg').height();
		position.left = (viewPort.left * position.left)/config['MAP_W'];
		position.top = ((config['MAP_H'] - position.top) * viewPort.top)/config['MAP_H'] + $(config['PROGRESS_BALLS_ID']).height();
		return position;
	}


	/**
	 * Ottiene un colore casuale tra quelli predefiniti (JQuery.colors)
	 * @return {Object} [Oggetto contenente il nome e il codice hex del colore]
	 */
	getRandomColor() {
		var Colors = {};
		Colors.names = {
		    aqua: "#00ffff",
		    azure: "#f0ffff",
		    beige: "#f5f5dc",
		    black: "#000000",
		    blue: "#0000ff",
		    brown: "#a52a2a",
		    cyan: "#00ffff",
		    darkblue: "#00008b",
		    darkcyan: "#008b8b",
		    darkgrey: "#a9a9a9",
		    darkgreen: "#006400",
		    darkkhaki: "#bdb76b",
		    darkmagenta: "#8b008b",
		    darkolivegreen: "#556b2f",
		    darkorange: "#ff8c00",
		    darkorchid: "#9932cc",
		    darkred: "#8b0000",
		    darksalmon: "#e9967a",
		    darkviolet: "#9400d3",
		    fuchsia: "#ff00ff",
		    gold: "#ffd700",
		    green: "#008000",
		    indigo: "#4b0082",
		    khaki: "#f0e68c",
		    lightblue: "#add8e6",
		    lightcyan: "#e0ffff",
		    lightgreen: "#90ee90",
		    lightgrey: "#d3d3d3",
		    lightpink: "#ffb6c1",
		    lightyellow: "#ffffe0",
		    lime: "#00ff00",
		    magenta: "#ff00ff",
		    maroon: "#800000",
		    navy: "#000080",
		    olive: "#808000",
		    orange: "#ffa500",
		    pink: "#ffc0cb",
		    purple: "#800080",
		    violet: "#800080",
		    red: "#ff0000",
		    silver: "#c0c0c0",
		    white: "#ffffff",
		    yellow: "#ffff00"
		};
		Colors.random = function() {
		    var result;
		    var count = 0;
		    for (var prop in this.names) 
		        if (Math.random() < 1/++count)
		           result = prop;
		    var returnRgb = this.names[result];
		    var self = this;
		    delete self.names[result];
            return { name: result, rgb: returnRgb};

		};

		return Colors.random();
	}

	/**
	 * Restituisce l'indice contenente la configurazione da considerare a partire dal dato livello dell'emergenza
	 * @param  {Number} value [Valore gravità dell'emergenza]
	 * @return {Number}       [Indice da utilizzare in config['LEGEND']]
	 */
	getIndexByValue(value){

		if(typeof(value) != 'number'){
			value = parseInt(value);
		}

		for(var i=0;i<config['LEGEND'].length;i++){
			if(value.inRange(
				this.getValues(config['LEGEND'][i].value,true)[0],
				this.getValues(config['LEGEND'][i].value,true)[1]))
			{
				return i;
			}
		}
		throw new Error(`
			Cant find correct index with value: ${value}
			Last index: ${i}
			First parameter for inRange: ${this.getValues(config['LEGEND'][i].value,true)[0]}
			Second parameter for inRange: ${this.getValues(config['LEGEND'][i].value,true)[1]}
			`);
	}

	/**
	 * Restituisce un array contenente i valori minimi e massimi di contagio per un determinato livello
	 * @param  {String} value [Stringa del tipo '1,2' nel formato 'ValoreMinimo,ValoreMassimo']
	 * @param  {Boolean} [numeric] [Se vero, l'array di Stringhe è convertito in array di Numeri]
	 * @return {Array}       [Array contenente i due valori min e max]
	 */
	getValues(value,numeric = false){
		let v = value.split(',');
		if(numeric){
			for(var i = 0;i<v.length;i++){
				v[i] = parseInt(v[i]);
			}
		}
		return v;
	}

	/**
	 * Crea l'identificatore univoco di un link a partire dagli identificatori delle aree collegate
	 * @param  {String} a [Identificatore univoco della prima area]
	 * @param  {String} b [Identificatore univoco della seconda area]
	 * @return {String}   [Identificatore univoco del link tra `a` e `b`, posizionati in ordine alfabetico e separati da `-`, Es: `canada-usa`]
	 */
	getLinkIdentifier(a,b){
		var link = (a < b) ? a+'-'+b : b+'-'+a;
		return link;
	}

	/**
	 * Ottiene gli identificatori dei plot che compongono gli estremi di un link a partire dall'identificatore univoco del link
	 * @param  {String} link [Identificatore univoco di un link]
	 * @return {String[]}      [Array contenente gli identificatori dei due plot che compongono il link]
	 */
	getPlotsByLink(link){
		return [link.split('-')[0]+'-plot',link.split('-')[1]+'-plot'];
	}

}

module.exports = Utils;


