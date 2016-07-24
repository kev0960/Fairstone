var CardDraw = function(obj, settings, offset_x, offset_y, on_mouse_down, on_mouse_up) {
	this.card = {
		o: obj,
		scale: 1
	};
	this.mouse = {
		cx: 0, //x click position
		cy: 0, //y click position
		x: 0, //x position
		y: 0, //y position
		timer: null, // timer to detect stop moving
		moving: false //is moving
	};

	this.offset_x = offset_x;
	this.offset_y = offset_y;

	this.on_mouse_down = on_mouse_down;
	this.on_mouse_up = on_mouse_up;

	this.scaling = (settings && settings.scaling) ? settings.scaling : false;
	this.focus = false;
	this.init();
}


CardDraw.prototype.init = function() {
	this.bindClick();
};

CardDraw.prototype.bindClick = function() {
	this.bind_on_card_move = this.on_card_move.bind(this);
	this.card.o.addEventListener('mousedown', this.bind_on_card_move);
};

CardDraw.prototype.on_card_move = function(e) {
	if (!this.on_mouse_down(this.card.o))
		return; // There are some types of card that does not require card to be dragged to the field

	this.mouse.cx = e.layerX;
	this.mouse.cy = e.layerY;

	this.mouse.x = e.clientX;
	this.mouse.y = e.clientY;

	this.on_move = this.get_mouse_pos.bind(this);
	document.body.addEventListener('mousemove', this.on_move);

	this.on_stop = this.on_card_stop.bind(this);
	document.body.addEventListener('mouseup', this.on_stop);
	document.body.addEventListener('mouseleave', this.on_stop);

	this.focus = true;
};

CardDraw.prototype.on_card_stop = function() {
	document.body.removeEventListener('mousemove', this.on_move);
	document.body.removeEventListener('mouseup', this.on_stop);
	document.body.removeEventListener('mouseleave', this.on_stop);

	this.focus = false;
	this.running = false;

	this.draw();
	this.on_mouse_up(this.card.o);
};

CardDraw.prototype.get_mouse_pos = function(e) {
	this.mouse.moving = true;
	this.mouse.y = e.pageY;
	this.mouse.x = e.pageX;

	this.card.x = this.mouse.x - this.mouse.cx;
	this.card.y = this.mouse.y - this.mouse.cy;

	this.draw();
};

CardDraw.prototype.draw = function() {

	this.card.transform += (this.scaling) ? "scale(" + this.card.scale + ");" : ";";

	$(this.card.o).css('left', (this.card.x - this.offset_x + 10));
	$(this.card.o).css('top', (this.card.y - this.offset_y + 10))

};
