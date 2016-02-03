// (moving) Card is refreshed every 10ms

function CardDraw (card, settings) {
	this.card = {
		o : card,
		x : card.clientTop,
		y : card.clientLeft,
		rX : 0,
		rY : 0,
		tX : 0,
		tY : 0,
		scale : 1
	};
	this.mouse = {
		cx : 0, // where in card has user clicked?
		cy : 0,
		x : 0, // current mouse position
		y : 0,
		px : 0, // previous clicked location
		py : 0,
		vx : 0,
		vy : 0,
		is_moving : false,
		chk_mouse : null // chk mouse every 10 ms
	};

	this.speed = (settings && settings.speed) ? settings.speed : 6;
	this.offSpeed = (settings && settings.offSpeed) ? settings.offSpeed : 5;
	this.limit = (settings && settings.rotateLimit) ? settings.rotateLimit : 60;
	this.sensibility = (settings && settings.sensibility) ? settings.sensibility : 6;
	this.scaling = (settings && settings.scaling) ? settings.scaling : false;

  this.binded_chk_mouse = null;
	this.binded_stop = null;

	this.card.o.addEventListener('mousedown', this.mousedown.bind(this));
}
// When the user holds the card
CardDraw.prototype.mousedown = function(e) {
	this.mouse.cx = e.offsetX;
	this.mouse.cy = e.offsetY;

	this.mouse.x = e.screenX;
	this.mouse.y = e.screenY;

	this.binded_chk_mouse = this.chk_mouse.bind(this);
	document.body.addEventListener('mousemove', this.binded_chk_mouse);

	this.binded_stop = this.stop.bind(this);
	document.body.addEventListener('mouseup', this.binded_stop);
	document.body.addEventListener('mouseleave', this.binded_stop);
}
CardDraw.prototype.stop = function (e) {
	document.body.removeEventListener('mousemove', this.binded_chk_mouse);
	document.body.removeEventListener('mouseup', this.binded_stop);
	document.body.removeEventListener('mouseleave', this.binded_stop);

	this.focus = false;
	this.card.tX = 0;
	this.card.tY = 0;
}
CardDraw.prototype.chk_mouse = function(e) {
	this.mouse.is_moving = true;
	this.mouse.py = this.mouse.y;
	this.mouse.px = this.mouse.x;
	this.mouse.x = e.clientX;
	this.mouse.y = e.clientY;
	this.mouse.vx = this.mouse.x - this.mouse.px;
	this.mouse.vy = this.mouse.y - this.mouse.py;

	this.bind_chk_mouse_stop = this.chk_mouse_stop.bind(this);

	// clear currently enabled timer
	clearTimeout(this.mouse.timer);

	// setup a new timer so that it can track whether the mouse has stopped for next 10 ms
	this.mouse.timer = setTimeout(this.bind_chk_mouse_stop, 10);
};

CardDraw.prototype.chk_mouse_stop = function() {
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
	var speed = (this.mouse.is_moving) ? this.speed : this.offSpeed;

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
	this.card.left = "left: " + this.card.x + "px; ";
	this.card.top = "top: " + this.card.y + "px; ";
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

CardDraw.prototype.run = function() {
	this.update();
	this.draw();
	loop = this.run.bind(this);
	if (this.running)
		requestAnimationFrame(loop);
}
var init = (function() {
	var oCard = new CardDraw(document.querySelectorAll('.card')[0], {
		sensibility: 6, //sensibility to the mouse velocity
		rotateLimit: 60, //card rotate limite
		speed: 6, //card rotation speed
		scaling: true
	});

	var oCard2 = new CardDraw(document.querySelectorAll('.card')[1], {
		sensibility: 6, //sensibility to the mouse velocity
		rotateLimit: 60, //card rotate limite
		speed: 6, //card rotation speed
		scaling: true
	});
});
window.onload = init;
