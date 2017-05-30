let chai = require('chai'),
path = require('path');
chai.should();
var jsdom = require('jsdom');
var document = jsdom.jsdom('<!doctype html><html><body></body></html>');
var window = document.defaultView;
global.document = document;
global.window = window;

global.config = require('../public/assets/js/Config.js');
describe('Dashboard.js',() => {
	var $;
	var hazard;
	describe('functions', () => {
		before(()=> {
			$ = require('jquery')(window);
			var h = require('../public/assets/js/Dashboard.js');
			hazard = new h();
		});
		beforeEach(()=> {
		});


		it('init dashboard',()=> {
			var mdiv = document.createElement('div');
			mdiv.id = config['PROGRESS_BALLS_ID'];
			document.body.appendChild(mdiv);
			console.log(document.body);
			hazard.initDashboard();
			var l = document.querySelector('.ball').length;
			l.should.be.equal(config['MAX_LEVEL']);
		});
	});
});