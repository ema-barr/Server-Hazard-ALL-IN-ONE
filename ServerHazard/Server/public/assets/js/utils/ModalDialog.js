var l = require('../lang/Lang.js');
var config = require('../Config.js');
var lang = l[config['LANGUAGE']];

/**
 * @class [Finestra Modale]
 */
class ModalDialog {
	constructor(){
		this.visible = false;
	}

	/**
	 * Imposto il modal
	 * @param  {String} modalClass [Classe del modal], Ref: https://www.w3schools.com/bootstrap/bootstrap_modal.asp
	 * @return NA
	 */
	setup(modalClass = config['MODAL_CLASS']) {
		$(config['MODAL_BUTTONS_ID']).empty();
		$(config['MODAL_BUTTONS_ID']).append('<button type="button" id="start-game-button" disabled=true class="btn btn-default" data-dismiss="modal"><i class="fa fa-spinner fa-spin fa-2x"></i></button>');
		$(config['MODAL_ID']).removeClass();
		$(config['MODAL_ID']).addClass('modal fade '+modalClass);
	}

	/**
	 * Imposto intestazione del modal
	 * @param {String} title [Testo di intestazione]
	 */
	setTitle(title) {
		$(config['MODAL_TITLE_ID']).html(title)
	}

	/**
	 * Imposto il contenuto del modal (Testo)
	 * @param {String} content [Testo da visualizzare]
	 */
	setContent(content){
		$(config['MODAL_TEXT_ID']).html(content);
	}

	/**
	 * Imposto il contenuto del modal (Carte)
	 * @param {Object} cards [Oggetto contenente le carte]
	 */
	setContentCards(cards){
		this.cards = cards;
		var html = `<div class="row">`;
		var cols = Math.floor(12/cards.length);
		for(card in cards){
			html += `<div class="col-md-${cols} col-xl-${cols}">`;
			html += `<img src="${card.src}" id="${card.name}"/>`;
			html += `</div>`;
		}
		html += '</div>';
		this.setContent(html);
	}

	/**
	 * Seleziono la carta scelta
	 * @param {int} id [Carta selezionata]
	 */
	 selectCard(id){
		for(card in cards){
			if(card.name != id){
				$(card.name).addClass('animate zoomOut');
			}
		}
		$(id).addClass('animate pulse');
	 }

	show() {
		$(config['MODAL_ID']).modal("show");
		this.visible = true;
	}

	hide() {
		$(config['MODAL_ID']).modal("hide");
		this.visible = false;
	}

	/**
	 * @private
	 * @return {Boolean} [True se è visibile il popup, falso altrimenti]
	 */
	isVisible(){
		return this.visible;
	}
}

module.exports = ModalDialog;