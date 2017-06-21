var l = require('../lang/Lang.js');
var config = require('../Config.js');
var lang = l[config['LANGUAGE']];

/**
 * @class [Finestra Modale]
 */
class ModalDialog {
	constructor(){
		this.visible = false;
		this.setup();
	}

	/**
	 * Imposto il modal
	 * @param  {String} modalClass [Classe del modal], Ref: https://www.w3schools.com/bootstrap/bootstrap_modal.asp
	 * @return NA
	 */
	setup(modalClass = config['MODAL_CLASS']) {
		$(config['MODAL_ID']).removeClass();
		$(config['MODAL_ID']).addClass('modal fade '+modalClass);
		//$(config['MODAL_BUTTONS_ID']).empty();
		//$(config['MODAL_BUTTONS_ID']).append('<button type="button" id="start-game-button" disabled=true class="btn btn-default" data-target="#myModal"><i class="fa fa-spinner fa-spin fa-2x"></i></button>');


		$(config['MODAL_ID']).on('hide.bs.modal',function(e) {
			console.log("Required modal close");
		});


		$(config['MODAL_ID']).on('show.bs.modal',function(e) {
			console.log("Required modal open");
		});
	}


	cardsVisible(value = null){
		if(value == null)
			return this.visible;
		else
			this.visible = value;
		return this.visible;
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
		if(!this.isVisible())
			$(config['MODAL_TEXT_ID']).html(content);
		else
			$(config['MODAL_TEXT_ID']).append(content);
	}

	/**
	 * Imposto il contenuto del modal (Carte)
	 * @param {Object} cards [Oggetto contenente le carte]
	 */
	setContentCards(cards){
		console.log('Called setContentCards')
		if(this.isVisible()) this.hide();
		if(this.cardsVisible()) return;
		this.cardsVisible(true);
		this.waitingForSelection = true;
		this.cards = cards;

		$('.overlay-content').empty();
		$('#cards-container').removeClass();
		$('#cards-container').addClass('container');
  		$('.container').show();

		var html = ``;
		for(var i=0;i<cards.length;i++){
			html += `<div class="card" id="card${(i+1)}"><span>${cards[i].locationFix}<br/>+${cards[i].resources[0].quantity} ${cards[i].resources[0].resource}</span></div>`;
		}
		$(html).appendTo('.overlay-content').addClass('animated flipInX');

	}

	/**
	 * Seleziono la carta scelta
	 * @param {int} id [Carta selezionata]
	 */
	 selectCard(id,max=-1){
	 	console.log('Called Select Card'); 
		if(typeof this.cards == 'undefined') {
			console.warn('Undefined cards');
			return;
		}
		if(max == -1){
			var max = this.cards.length;
		}
		if(typeof id == 'number' || typeof id == 'string') {
			for(var i=0;i<max;i++){
				if(i==id) {
					$('#card'+(i+1)).removeClass();
					$('#card'+(i+1)).addClass('card animated rubberBand');
				}else {
					$('#card'+(i+1)).removeClass();
					$('#card'+(i+1)).addClass('card animated fadeOutDown');
				}
			}
		} else if(id.hasOwnProperty(length)) {
			for(var i=0;i<max;i++){
				if($.inArray(i,id) > -1) {
					$('#card'+(i+1)).removeClass();
					$('#card'+(i+1)).addClass('card animated rubberBand');
				}else {
					$('#card'+(i+1)).removeClass();
					$('#card'+(i+1)).addClass('card animated fadeOutDown');
				}
			}
			
		}

    
	    setTimeout(function() {
	      $('#cards-container').addClass('animated fadeOutDown');
	    },2000);
	    this.cardsVisible(false);
 	}

	show() {
		if(!this.isVisible()) {
			$(config['MODAL_ID']).modal("show");
		}
	}

	hide() {
		if(this.isVisible()) {
			$(config['MODAL_ID']).modal("hide");
		}
	}

	/**
	 * @private
	 * @return {Boolean} [True se è visibile il popup, falso altrimenti]
	 */
	isVisible(){
		return $(config['MODAL_ID']).is(':visible');
	}
}

module.exports = ModalDialog;