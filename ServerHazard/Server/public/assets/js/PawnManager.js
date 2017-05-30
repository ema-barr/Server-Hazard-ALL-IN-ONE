var Pawn = require('./Pawn.js');
var config = require('./Config.js');

class PawnManager {
	constructor (){
		this.pawns = new Array();
	}


	findPawnByGroup(groupID){
		for(var pIndex in this.pawns){
			//var pawn = $.extend(new Pawn(),this.pawns[pIndex]);
			if(this.pawns[pIndex].groupInPawn(groupID)){
				return this.pawns[pIndex];
				
			}
		}
		return -1;
	}


	movePawn(group,to,position){
		var done = false;

		//Controllo che la posizione "to" non sia occupata da un'altra pedina
		for(var pIndex in this.pawns){
			//var pawn = $.extend(new Pawn(),this.pawns[pIndex]);
			if(this.pawns[pIndex].sameLocation(to)) {
				this.__detectAndSolveCollisions(this.pawns[pIndex],group,to,position);
				done = true;
				break;
			}	
		}

		//Se la posizione "to" è libera, controllo che la pedina da spostare contenga un solo gruppo o più gruppi
		if(!done){
			var newPawn = this.findPawnByGroup(group);
			if(typeof newPawn == 'object'){
				// Esiste già una pedina, è necessario spostare il gruppo
				if(newPawn.getGroupsNumber() == 1) {
					//La pedina da spostare contiene un solo gruppo, la sposto semplicemente
					newPawn.setPosition(position,to,true);
				} else {

					//La pedina da spostare contiene più di un gruppo, è necessario dividerla in due pedine
					var secondPawn = this.createEmptyPawn(); //Creo una nuova pedina vuota
					secondPawn.addGroup(group); //Inserisco il gruppo sulla nuova pedina
					secondPawn.draw(); //Disegno la pedina sulla mappa
					secondPawn.setPosition(newPawn.getPosition(),to); //Posiziono la seconda pedina sulla prima
					secondPawn.setPosition(position,to,true);
					newPawn.removeGroup(group);
					newPawn.draw();
				}
			}else {
				//La pedina non esiste e deve essere ancora creata
					var newPawn = this.createEmptyPawn();
					newPawn.addGroup(group);
					newPawn.draw();
					newPawn.setPosition(position,to,false);
					//newPawn.animate();
			}
		}


	}

	/**
	 * [__detectAndSolveCollisions description]
	 * @param  {[type]} pawn        [description]
	 * @param  {[type]} groupAway   [ID Univoco del gruppo che si sposterà]
	 * @param  {[type]} destination [description]
	 * @param  {[type]} position    [description]
	 * @return {[type]}             [description]
	 */
	__detectAndSolveCollisions(pawn,groupAway,destination,position){
		var self = this;
		var oldPawn = this.findPawnByGroup(groupAway); // --> Se -1, non esiste alcuna pedina che contenga il gruppo groupAway, non devo quindi modificare alcuna pedina già esistente
		if(oldPawn != -1){
			//pawn.setPosition(position,destination);
			var groupsLeft = oldPawn.removeGroup(groupAway);
			if(groupsLeft == 0) {
				//La pedina non ha più gruppi
				oldPawn.setPosition(pawn.getPosition(),destination,true);

				
					$.when(self.promise).then(function(){
						self.promise = null;
						self.animationCallback(pawn,oldPawn,groupAway);
					});
	
					

				/*oldPawn.clear();
				var self = this;
				self.oldPawn = {};
				delete(self.oldPawn);*/
			} else {
				//La pedina ha ancora qualche gruppo ma è necessario aggiornare il design
				oldPawn.draw();

				//Creo una pedina vuota temporeanea da utilizzare per l'animazione
				var animationPawn = this.createEmptyPawn();
				animationPawn.addGroup(groupAway);
				animationPawn.draw();
				animationPawn.setPosition(pawn.getPosition(),destination);
				//animationPawn.clear();
				animationPawn.setPosition(position,destination,true);
				$.when(self.promise).then(function(){
					self.promise = null;
					self.animationCallback(pawn,animationPawn,groupAway);
					self.animationPawn = {};
					delete(self.animationPawn)
				});

				/*var self = this;
				self.animationPawn = {};
				delete(self.animationPawn);*/
			}
		}else {
			//Provo ad unire le pedine
			var groups = pawn.getGroups();
			pawn.merge(groupAway);
			pawn.draw();
		}

		this.promise = null;

	}

	animationCallback(pawn,oldPawn,groupAway){
		oldPawn.clear();
		var groups = pawn.getGroups();
		pawn.merge(groupAway);
		pawn.draw();
		var self = this;
		self.oldPawn = {};
		delete(self.oldPawn);
	}

	createEmptyPawn(){
		var id = performance.now().toString();
		id = id.replace('.','-'); //JQuery SVG non funzione se l'attributo id contiene dei "."
		var pawn = new Pawn('svg-'+id);
		this.pawns.push(pawn);
		return pawn;
	}

	__pawnsCollide(p1,literal){
		return p1.getLiteral() == literal;
	}


}
module.exports = PawnManager;