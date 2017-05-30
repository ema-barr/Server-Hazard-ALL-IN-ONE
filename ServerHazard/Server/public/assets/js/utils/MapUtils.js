var l = require('../lang/Lang.js');
var config = require('../Config.js');
var lang = l[config['LANGUAGE']];


/**
 * Funzioni per l'interazione con la mappa
 */
class MapUtils {
	constructor() {

	}

	/**
	 * Triggera l'evento "update" per l'aggiornamento della mappa. Ref: https://www.vincentbroute.fr/mapael/#update-map-data
	 * @param {Object} updatedOptions [Object that contains the options to update for existing plots, areas or legends. If you want to send some areas, links or points to the front of the map, you can additionnaly pass the option 'toFront: true' for these elements.]
	 * @param {Object} newPlots       [New plots to add to the map.]
	 * @param {Object} deletedPlots   [Plots to delete from the map (array, or "all" to remove all plots).]
	 */
	UpdateMap(updatedOptions,newPlots,deletedPlots){

		updatedOptions ? updatedOptions : {};
		newPlots ? newPlots : {};
		deletedPlots ? deletedPlots : {};

	    $(config['MAP_CONTAINER']).trigger('update', [{
	        mapOptions: updatedOptions, 
	        newPlots: newPlots, 
	        deletePlotKeys: deletedPlots,
	        animDuration: 1000
    	}]);
	}


	/**
	 * Elimina un collegamento identificato da *link*
	 * @param {String} link     [ID Univoco del collegamento da eliminare]
	 * @param {Number} duration [Durata dell'animazione in ms, default: 500]
	 */
	RemoveLink(link, duration = 500){
		var self = this;
		$(config['MAP_CONTAINER']).trigger('update'[{
			deleteLinkKeys : self.link,
			animDuration : self.duration,
		}]);

	}

	/**
	 * Aggiunge un collegamento da *from* a *to* con stile *style*
	 * @param {String} from  [ID Univoco del plot di partenza]
	 * @param {String} to    [ID Univoco del plot di arrivo]
	 * @param {String} style [Attributo stroke-dasharray @https://www.vincentbroute.fr/mapael/raphael-js-documentation/index.html#Element.attr]
	 * @param {Integer} duration [Durata dell'animazione in ms, default: 500]
	 */
	AddLink(from,to,style,duration = 500){
		var self = this;
		$(config['MAP_CONTAINER']).trigger('update'[{
			newLinks : {
				link : {
					factor : config['DEFAULT_PLOT_FACTOR'],
					between : [self.from,self.to],
					attrs : {
						'stroke-width': config['DEFAULT_PLOT_STROKE'],
						'stroke-dasharray' : self.style
					},
				},
			},
			animDuration : self.duration,
		}]);
	}


	/**
	 * Triggera l'evento "playermove" per spostare l'icona dell'utente da fromv a tov
	 * @param {String} fromv [ID univoco del plot relativo all'area di partenza (Plot)]
	 * @param {String} tov   [ID univoco del plot relativo all'area di arrivo (Plot)]
	 */
	MovePlayer(fromv,tov) {
		var movement = {
			from: fromv,
			to: tov,
		};
		
		this.__removePlayer(movement.from);
		$(config['MAP_CONTAINER']).trigger('playermove', [{
			movementOptions : movement,
		}]);
		this.__setPlayer(movement.to);
	}

	/**
	 * Imposta l'icona utilizzata per il plot a quella di default
	 * @param  {String} plot [ID univoco del plot]
	 * @return NA
	 */
	__removePlayer(plot){
		 var updatedOptions = {'plots': {}};
		 updatedOptions.plots[plot] = {
		 	type: config['DEFAULT_PLOT_TYPE'],
		 	size : config['DEFAULT_PLOT_SIZE'],
		}
		this.UpdateMap(updatedOptions);
	}

	/**
	 * Imposta l'icona utilizzata per il plot a quella del giocatore da muovere
	 * @param  {String} plot [ID univoco del plot]
	 * @return NA
	 */
	__setPlayer(plot){
		 var updatedOptions = {'plots': {}};
		 updatedOptions.plots[plot] = {
		 	type: 'image',
		 	url : config['DEFAULT_PLOT_ICON'],
		 	width: config['DEFAULT_PLOT_ICON_WIDTH'],
		 	height: config['DEFAULT_PLOT_ICON_HEIGHT'],
		 }
		 this.UpdateMap(updatedOptions);
	}
}

module.exports = MapUtils;