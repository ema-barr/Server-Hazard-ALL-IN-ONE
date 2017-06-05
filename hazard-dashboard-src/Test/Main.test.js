let chai = require('chai'),
path = require('path');
chai.should();
global.$ = global.jQuery = require('jquery')(window);
global.config = require('../public/assets/js/Config.js');
global.diff = require('deep-diff').diff;
let st = require('../public/assets/js/Main.js');
describe('Main.js',() => {
	describe('functions', () => {

		beforeEach(()=>{
			s1 = '{\"gameState\":{\"currentState\":\"GAME_ACTIVE\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"bari\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';
			s2 = '{\"gameState\":{\"currentState\":\"GAME_VICTORY\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"roma\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';
			s1 = JSON.parse(s1);
			s2 = JSON.parse(s2);

		});

		it('handleState test',() =>{
			st.handleState(s1);
		});
	});
});