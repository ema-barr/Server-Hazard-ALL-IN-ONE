var diff = require('deep-diff');

class GameState {
	constructor(state = null){
		if(state == null)
			this.initialized = false;
		else
			this.initialized = true;
		this.state = state;
	}


	/**
	 * [setState description]
	 * @param {Object} newState [Nu]
	 */
	setState(newState){
		if(typeof(newState) != 'object' || newState == null || newState.gameState == null) throw new Error('Invalid state, ignoring update');

		if(this.initialized){
			var diffs = this.__getDifferences(newState);
		} else {
			this.initialized = true;
		}
		this.state = newState;
		var simpleDiffsObject = this.__analyzeDifferences(diffs);
		return simpleDiffsObject;

	}

	/**
	 * Utilizza la libreria deep-diff per cercare le differenze tra due stati
	 * @private method
	 * @param  {Object} newState [Stato da confrontare con l'ultimo stato salvato]
	 * @return {Object}          [Differenze ottenute da deep-diff]
	 */
	__getDifferences(newState){
		return diff(newState,this.state)
	}


	__analyzeDifferences(diffs){
		if(diffs == null) return [];
		var changes  = {};
		var base = 1;
		for(var i = 0;i<diffs.length;i++){
			if(diffs[i].kind == "E"){
				var path = diffs[i].path.join('.');

				if(diffs[i].path[base-1] == 'gameState'){

					switch(diffs[i].path[base]){
						case 'currentState': //E' cambiato lo stato di gioco
							changes['currentState'] = this.state.gameState.currentState;
						break;
						case 'gameMap':
							if(diffs[i].path[base+1] == "locations"){
								changes['locations'] = [];
								for(var j = 0;j<this.state.gameState.gameMap.locations.length;j++){
									if(j == diffs[i].path[base+2]){
										changes['locations'].push(this.state.gameState.gameMap.locations[j]);
									}
								}
							}else{
								changes['pawns'] = this.state.gameState.gameMap.pawns;
							}
						break;
						case 'blockades':
							changes['blockades'] = this.state.gameState.blockades;
						break;
						case 'emergencies':
							changes['emergencies'] = this.state.gameState.emergencies;
						break;
						case 'maxEmergencyLevel':
							changes['maxEmergencyLevel'] = this.state.gameState.maxEmergencyLevel;
						break;
						case 'numOfProductionCards':
							changes['numOfProductionCards'] = this.state.gameState.numOfProductionCards;
						break;
						case 'contagionRatios':
							changes['contagionRatios'] = this.state.gameState.contagionRatios;
						break;
					}
				} else {
					switch(diffs[i].path[base]){
						case 'group':
							changes['type'] = this.state.currentTurn.type;
							changes['group'] = this.state.currentTurn.group.name;
							changes['resources'] = this.state.currentTurn.group.resources;
						break;
						case 'numActions':
						case 'maxNumActions':
							changes['numActions'] = this.state.currentTurn.numActions;
							changes['maxNumActions'] = this.state.currentTurn.maxNumActions;
						break;
					}
				}
			}
		}
		return changes;
	}

}

var state = new GameState(null);

module.exports = state;

/**var s1 = '{\"gameState\":{\"currentState\":\"GAME_ACTIVE\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"bari\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';
var s2 = '{\"gameState\":{\"currentState\":\"GAME_VICTORY\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"roma\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';

state.setState(JSON.parse(s1));
console.log(state.setState(JSON.parse(s2)));**/