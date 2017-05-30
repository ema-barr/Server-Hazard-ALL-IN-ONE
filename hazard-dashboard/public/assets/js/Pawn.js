var config = require('./Config.js');


class Pawn{
	constructor(idx,pos = {},literal = null){
		this.position = {};
		if(pos != {} && literal != null) this.setPosition(pos,literal);
		this.id = idx;
		this.groups = new Array();
		this.__dirty = false;
		this.__initialized = false;
		this.__svg = '';
		this.svgObject = null;
		this.DEFAULT_PAWN_SIZE = {};
		this.DEFAULT_PAWN_SIZE.H = '18px';
		this.DEFAULT_PAWN_SIZE.W = '15px';
		this.DEFAULT_ANIM_DURATION = 2000;
		this.promise = null;
	}


	getPosition() {
		return this.position;
	}
	setPosition(pos = null,literal = null, animate = false){
		var self = this;
		if(pos != null) {
			this.position.top = pos.top;
			this.position.left = pos.left;
		}

		if(literal != null) this.literalPosition = literal;

		if(!animate) {
			$("#"+this.id).css({ 
	            top: this.position.top,
	            left : this.position.left
			});
		}else {
	        this.promise = $("#"+this.id).animate({ 
	            top: this.position.top,
	            left : this.position.left
	          }, self.DEFAULT_ANIM_DURATION
		).promise();
		}
	}

	addGroup(group){
		var key = Object.keys(group)[0];
		this.groups[key] = group[key];
		return this.getGroupsNumber();
	}

	removeGroup(group){
		try {
			var key = Object.keys(group)[0];
			delete(this.groups[key]);
			return this.getGroupsNumber();
		}catch (err){
			console.log('removeGroup Error: ' + err);
			return -1;
		}
	}

	groupInPawn(group){
		var key = Object.keys(group)[0];
		if($.inArray(key,Object.keys(this.groups)) > -1) return true;
		return false;
	}

	sameLocation(location){
		return this.literalPosition == location;
	}

	getGroupsNumber(){
		return Object.keys(this.groups).length;
	}

	getLiteral(){
		return this.literal;
	}

	getGroups() {
		return this.groups;
	}

	getGroupByNum(num){
		var keys = Object.keys(this.groups);
		return this.groups[keys[num]];
	}

	merge(newGroups){
		if(typeof this.groups == 'object')
			Object.assign(this.groups,newGroups);
		else
			this.groups.concat(newGroups);
	}

	clear(){
		this.svgObject.clear();
	}

	draw(parent = config['MAP_CONTAINER']) {
		var self = this;
		this.__svg = './' + 'player-'+this.getGroupsNumber().toString()+'.svg';
		if(!this.__initialized){
			$(parent).append('<div id="'+this.id+'"></div>');
			$('#'+this.id).svg();
			$('#'+this.id).css({'position':'absolute'});
			$('#'+this.id).css({'width': this.DEFAULT_PAWN_SIZE.W, 'height': this.DEFAULT_PAWN_SIZE.H});
			this.__initialized = true;
		} else {
			this.clear();
		}


		$('#'+this.id).children().fadeOut();
		this.svgObject = $('#'+this.id).svg('get');
		var callback = (this.__updateDesign).bind(this);
    	this.svgObject.load(this.__svg, {addTo: true, onLoad: callback, changeSize:true});
    	//$($('#'+this.id+'> *')).animate({svgHeight: self.DEFAULT_PAWN_SIZE.H, svgWidth : self.DEFAULT_PAWN_SIZE.W}, 400);
    	$('#'+this.id).children().fadeIn();

	}

	__updateDesign(){
		for(var i = 0;i<this.getGroupsNumber();i++){
			$('#' +this.id+ ' > * > * > #c'+(i+1).toString()).css({'fill': this.getGroupByNum(i)});
		}
	}
}

module.exports = Pawn;