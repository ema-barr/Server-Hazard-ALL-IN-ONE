let chai = require('chai'),
path = require('path');
chai.should();
var jsdom = require('mocha-jsdom');
global.config = require('../public/assets/js/Config.js');
global.l = require('../public/assets/js/lang/Lang.js');
let Utils = require('../public/assets/js/utils/Utils.js');
var lang = l[config['LANGUAGE']];
describe('Utils.js',() => {
	jsdom();
	var $;
	describe('functions', () => {
		let utils;
		before(()=> {
			$ = require('jquery');
		});
		beforeEach(()=>{
			utils = new Utils();
			Number.prototype.inRange = function(a,b){
	 			return (a < b ? this >= a && this <= b : this >= b && this <= a);
	 		}
		});
		it('config scope',() =>{
			(typeof config).should.not.be.equal('null');
			(typeof config['LEGEND'][0].value).should.be.equal('string');
		});


		it('inRange expecting true',() => {
			let t = 10;
			let x = t.inRange(0,10);
			(typeof x).should.be.equal('boolean');
			x.should.equal(true);
			
		});

		it('inRange expecting false',() => {
			let t = 15;
			let x = t.inRange(0,10);
			(typeof x).should.be.equal('boolean');
			x.should.equal(false);
			
		});

		it('splits properly',() => {
			let t = utils.getValues('1,2',true);
			t.should.eql([1,2]);
		});

		it('splits properly using config',() => {
			let t = utils.getValues(config['LEGEND'][0].value,true);
			t.should.eql([0,1]);
		});


		it('link identifier (a>b)',()=>{
			let t = utils.getLinkIdentifier('italy','france');
			t.should.eql('france-italy');
		});

		it('link identifier (a<b)',() =>{
			let t = utils.getLinkIdentifier('canada','usa');
			t.should.eql('canada-usa')
		});

		it('getPlotsByLink',() => {
			let t = utils.getPlotsByLink('canada-usa');
			t.should.eql(['canada-plot','usa-plot']);
		});

		it('getIndexByValue',() => {
			let t = utils.getIndexByValue(15);

			t.should.eql(3);
		});

		it('Build Tooltip',() => {
			let emergencies = {
				'Emergenza 1' : 0,
				'Emergenza 2' : 10,
				'Emergenza 3' : -1,
			};
			let t = utils.__buildTooltip('Canada',emergencies);
			t.should.equal('<span style="font-weight:bold;">Zona: </span>Canada<br/><span style="font-weight:bold;">Emergenza 1 :</span><div style="width:1px;height:1px;background-color:#5BCA09"></div><br /><span style="font-weight:bold;">Emergenza 2 :</span><div style="width:1px;height:1px;background-color:#FE2701"></div><br />')
		});
	});
});