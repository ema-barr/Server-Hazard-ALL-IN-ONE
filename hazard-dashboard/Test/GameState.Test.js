let chai = require('chai'),
path = require('path');
chai.should();
var jsdom = require('mocha-jsdom');
global.config = require('../public/assets/js/Config.js');
global.diff = require('deep-diff').diff;
let st = require('../public/assets/js/utils/GameState.js');
describe('GameState.js',() => {
	jsdom();
	var $;
	describe('functions', () => {
		let s1;let s2;
		before(()=> {
			$ = require('jquery');
		});
		beforeEach(()=>{
			s1 = '{\"gameState\":{\"currentState\":\"GAME_ACTIVE\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"bari\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';
			s2 = '{\"gameState\":{\"currentState\":\"GAME_VICTORY\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"roma\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';
			s1 = JSON.parse(s1);
			s2 = JSON.parse(s2);

		});

		it('finds differences', () => {
			st.state = s1;
			let t = st.__getDifferences(s2);
			(t.length > 0).should.be.equal(true);
		});

		it('setState null',()=>{
			(function() {
				st.setState('null');
			}).should.throw(Error);
		});

		it('currentState test',()=>{
			st.state = s1;
			let t = st.__getDifferences(s2);
			(t[0].kind).should.be.equal('E');
			(t[0].path).should.be.eql(['gameState','currentState']);

		});

		it('setState', ()=> {
			st.setState(s1);
			st.setState(s2);
			st.state.should.equal(s2);
		});

		it('__analyzeDifferences',()=>{
			st.state = s2;
			let t = st.__getDifferences(s1);
			let z = st.__analyzeDifferences(t);
			(z['currentState']).should.be.equal('GAME_VICTORY');
			(z['pawns']).should.be.eql(s2.gameState.gameMap.pawns);
		});

		it('__analyzeDifferences on empty object',()=>{
			st.state = s1;
			let t = st.__getDifferences(s1);
			let z = st.__analyzeDifferences(t);
			(z.length).should.be.equal(0);
		});
	});
});