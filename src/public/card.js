var CardDraw = function(obj, settings, offset_x, offset_y, on_mouse_down, on_mouse_up) {
	this.card = {
		o: obj,
		rX: 0,
		rY: 0,
		tX: 0,
		tY: 0,
		scale: 1
	};
	this.mouse = {
		cx: 0, //x click position
		cy: 0, //y click position
		x: 0, //x position
		y: 0, //y position
		py: 0, //previous y position
		px: 0, //previous x position
		vx: 0, //x velocity
		vy: 0, //y velocity,
		timer: null, // timer to detect stop moving
		moving: false //is moving
	};

	this.offset_x = offset_x;
	this.offset_y = offset_y;

	this.on_mouse_down = on_mouse_down;
	this.on_mouse_up = on_mouse_up;

	this.speed = (settings && settings.speed) ? settings.speed : 6;
	this.offSpeed = (settings && settings.offSpeed) ? settings.offSpeed : 5;
	this.limit = (settings && settings.rotateLimit) ? settings.rotateLimit : 60;
	this.sensibility = (settings && settings.sensibility) ? settings.sensibility : 6;
	this.scaling = (settings && settings.scaling) ? settings.scaling : false;
	this.focus = false;
	this.init();
}

CardDraw.prototype.init = function() {
	this.bindClick();
};

CardDraw.prototype.bindClick = function() {
	this.bindmove = this.bindMove.bind(this);
	this.card.o.addEventListener('mousedown', this.bindmove);
};

CardDraw.prototype.bindMove = function(e) {
	if(!this.on_mouse_down(this.card.o))
		return; // There are some types of card that does not require card to be dragged to the field

	this.mouse.cx = e.layerX;
	this.mouse.cy = e.layerY;
	this.mouse.x = e.clientX;
	this.mouse.y = e.clientY;

	this.move = this.getMouseVars.bind(this);
	document.body.addEventListener('mousemove', this.move);
	this.stop = this.unbindMove.bind(this);
	document.body.addEventListener('mouseup', this.stop);
	document.body.addEventListener('mouseleave', this.stop);

	this.focus = true;

	this.start();
};

CardDraw.prototype.unbindMove = function() {
	document.body.removeEventListener('mousemove', this.move);
	document.body.removeEventListener('mouseup', this.stop);
	document.body.removeEventListener('mouseleave', this.stop);

	this.focus = false;
	this.running = false;
	this.card.tX = 0;
	this.card.tY = 0;
	this.card.rX = 0;
	this.card.rY = 0;

	this.update();
	this.draw();
	this.on_mouse_up(this.card.o);
};

CardDraw.prototype.getMouseVars = function(e) {
	this.mouse.moving = true;
	this.mouse.py = this.mouse.y;
	this.mouse.px = this.mouse.x;
	this.mouse.y = e.pageY;
	this.mouse.x = e.pageX;
	this.mouse.vx = this.mouse.x - this.mouse.px;
	this.mouse.vy = this.mouse.y - this.mouse.py;

	this.mstop = this.mouseStop.bind(this);
	clearTimeout(this.mouse.timer);
	this.mouse.timer = setTimeout(this.mstop, 10);
};

CardDraw.prototype.mouseStop = function() {
	this.mouse.moving = false;
	this.mouse.vx = 0;
	this.mouse.vy = 0;
};

CardDraw.prototype.getRotation = function() {
	this.card.tX = this.mouse.vx * this.sensibility;
	this.card.tY = this.mouse.vy * this.sensibility;

	if (this.card.tX > this.limit)
	this.card.tX = this.limit;
	else if (this.card.tX < -this.limit)
	this.card.tX = -this.limit;

	if (this.card.tY > this.limit)
	this.card.tY = this.limit;
	else if (this.card.tY < -this.limit)
	this.card.tY = -this.limit;

	this.card.x = this.mouse.x - this.mouse.cx;
	this.card.y = this.mouse.y - this.mouse.cy;
};

CardDraw.prototype.updateRotation = function() {
	var speed = (this.mouse.moving) ? this.speed : this.offSpeed;

	if (this.card.rX > (this.card.tX + speed) || this.card.rX < (this.card.tX - speed))
	this.card.rX += (this.card.rX > this.card.tX) ? -speed : speed;
	else if (this.card.rX > (this.card.tX + (speed / 10)) || this.card.rX < (this.card.tX - (speed / 10)))
	this.card.rX += (this.card.rX > this.card.tX) ? -(speed / 10) : (speed / 10);

	if (this.card.rY > (this.card.tY + speed) || this.card.rY < (this.card.tY - speed))
	this.card.rY += (this.card.rY > this.card.tY) ? -speed : speed;
	else if (this.card.rY > (this.card.tY + (speed / 10)) || this.card.rY < (this.card.tY - (speed / 10)))
	this.card.rY += (this.card.rY > this.card.tY) ? -(speed / 10) : (speed / 10);
};

CardDraw.prototype.updateScale = function() {
	if (this.focus && this.card.scale < 1.1) {
		this.card.scale += 0.03;
	} else if (!this.focus && this.card.scale > 1) {
		this.card.scale -= 0.03;
	}
};

CardDraw.prototype.update = function() {
	if (this.scaling)
	this.updateScale();

	this.getRotation();
	this.updateRotation();
};

CardDraw.prototype.draw = function() {
	this.card.left = "left: " + (this.card.x - this.offset_x + 10) + "px; ";
	this.card.top = "top: " + (this.card.y - this.offset_y + 10) + "px; ";
	this.card.transform = "transform: ";
	this.card.transform += "rotateY(" + this.card.rX + "deg) ";
	this.card.transform += "rotateX(" + -this.card.rY + "deg) ";
	this.card.transform += (this.scaling) ? "scale(" + this.card.scale + ");" : ";";

	this.card.o.setAttribute('style', this.card.left + this.card.top + this.card.transform);
};

CardDraw.prototype.start = function() {
	this.running = true;
	this.run();
}
CardDraw.prototype.stop = function() {
	this.running = false;
};

CardDraw.prototype.run = function() {
	if(this.running) {
		this.update();
		this.draw();
	}
	loop = this.run.bind(this);
	if (this.running)
	requestAnimationFrame(loop);
}
