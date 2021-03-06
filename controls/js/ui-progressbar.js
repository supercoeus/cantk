/*
 * File:   ui-progressbar.js
 * Author: Li XianJing <xianjimli@hotmail.com>
 * Brief:  Slider/ProgressBar
 * 
 * Copyright (c) 2011 - 2015  Li XianJing <xianjimli@hotmail.com>
 * 
 */

function UIProgressBar() {
	return;
}

UIProgressBar.prototype = new UIElement();
UIProgressBar.prototype.isUIProgressBar = true;

UIProgressBar.prototype.initUIProgressBar = function(type, w, h, interactive) {
	this.initUIElement(type);	

	this.setPercent(50);
	this.setDefSize(w, h);
	this.roundRadius = 0;
	this.setInteractive(interactive);
	this.setTextType(Shape.TEXT_INPUT);
	this.setImage(UIElement.IMAGE_DEFAULT, null);
	this.setImage(UIElement.IMAGE_NORMAL_FG, null);
	this.images.display = UIElement.IMAGE_DISPLAY_9PATCH;

	if(interactive) {
		this.addEventNames(["onChanged"]);
		this.addEventNames(["onChanging"]);
	}

	return this;
}

UIProgressBar.prototype.shapeCanBeChild = function(shape) {
	if(this.dragger) {
		return false;
	}

	return (shape.isUIImage || shape.isUILabel || shape.isUIColorTile);
}

UIProgressBar.prototype.updateDraggerParams =function() {
	var shape = this.dragger;
	if(!shape) return;

	if(this.w < this.h) {
		shape.yAttr = UIElement.Y_FIX_TOP;
		shape.xAttr = UIElement.X_CENTER_IN_PARENT;
		shape.widthAttr = UIElement.WIDTH_FILL_PARENT;
		shape.heightAttr = UIElement.HEIGHT_FIX;
	}
	else {
		shape.yAttr = UIElement.Y_MIDDLE_IN_PARENT;
		shape.xAttr = UIElement.X_FIX_LEFT;
		shape.widthAttr = UIElement.WIDTH_FIX;
		shape.heightAttr = UIElement.HEIGHT_FILL_PARENT;
	}
}

UIProgressBar.prototype.relayoutChildren = function() {
	if(!this.dragger) {
		return;
	}

	if(this.w > this.h) {
		var x = this.value * this.w;	
		this.dragger.x = Math.min(x, this.w - this.dragger.w);
	}
	else {
		var y = (1-this.value) * this.h;	
		this.dragger.y = Math.min(y, this.h - this.dragger.h);
	}

	UIElement.prototype.relayoutChildren.call(this);

	return;
}

UIProgressBar.prototype.resizeDragger =function() {
	if(this.dragger) {
		var w = this.dragger.w;
		var h = this.dragger.h;
		if(this.w > this.h) {
			h = this.h;
			w = Math.min(this.h, w);
		}
		else {
			w = this.w;
			h = Math.min(this.w, h);
		}
		this.dragger.setSize(w, h);
	}

	return this;
}

UIProgressBar.prototype.afterChildAppended =function(shape) {
	var bar = this;
	
	this.dragger = shape;
	this.updateDraggerParams();
	this.setTextType(Shape.TEXT_NONE);
	shape.setTextType(Shape.TEXT_NONE);

	bar.onPointerMoveRunning = function(point, beforeChild) {
		if(beforeChild) {
			return;
		}

		if(this.pointerDown && this.dragger) {
			var x = Math.min(Math.max(0, point.x), this.w - this.dragger.w);
			var y = Math.min(Math.max(0, point.y), this.h - this.dragger.h);

			this.dragger.move(x, y);
			
		}
		
		return;
	}

	bar.onPointerUpRunning = function(point, beforeChild) {
		if(beforeChild) {
			return;
		}

		if(this.changed) {
			this.changed = false;
			this.callOnChangedHandler(this.getValue());
		}

		return;
	}

	bar.onSized = function() {
		var size = Math.min(this.w, this.h);
		this.updateLayoutParams();
		this.setPercent(this.getPercent());
		this.resizeDragger();
		this.updateDraggerParams();

		return;
	}

	shape.onSized = function() {
		bar.resizeDragger();
	}

	shape.onMoved = function() {
		var percent = 0;
		if(bar.w > bar.h) {
			var value = (this.x + (this.w >> 1))/bar.w;
			percent = value * 100;
			if(this.x <= 0) {
				percent = 0;
			}
			if((this.x + this.w) >= bar.w) {
				percent = 100;
			}
		}
		else {
			var value = (bar.h - (this.y + (this.h >> 1)))/bar.h;
			percent = value * 100;
			if(this.y <= 0) {
				percent = 100;
			}
			if((this.y + this.h) >= bar.h) {
				percent = 0;
			}
		}

		bar.changed = true;
		bar.setPercentOnly(percent);
		bar.callOnChangingHandler(bar.getValue());

		return;
	}
	
	return;
}

UIProgressBar.prototype.setInteractive = function(value) {
	this.interactive = value;

	return this;
}

UIProgressBar.prototype.setPercentOnly = function(value, notify, animation) {
	var newValue = (value%101)/100;
	
	if(!animation) {
		this.value = newValue;
		this.relayoutChildren();
	}

	if(this.mode === Shape.MODE_EDITING || !this.isVisible()) {
		return this;
	}

	if(!animation) {
		if(notify) {
			this.callOnChangedHandler(this.getValue());
		}
	}
	else {
		if(this.value == newValue) return this;
		this.setupAnimation({
			notify: notify,
			valueStart: this.value,
			valueEnd: newValue
		});
	}

	return this;
}

UIProgressBar.prototype.setupAnimation = function(config) {
	var me = this;
	var def = {
		duration: 300,
		actionWhenBusy: 'replace',
		onStep: function(ui, timePercent, config) {
			me.value = config.value;
			me.relayoutChildren();
			return true;
		},
		onDone: function(ui, aniName) {
			me.value = config.valueEnd;
			if(config.notify) {
				me.callOnChangedHandler(me.getValue());	
			}
		}
	};

	if(!config) {
		config = def;
	}
	else {
		var keys = Object.keys(def);
		for(var i = 0, len = keys.length; i < len; i++) {
			var k = keys[i];
			if(!config[k]) {
				config[k] = def[k];
			}
		}
	}

	this.animate(config);

	return this;
}

UIProgressBar.prototype.setPercent = function(value, notify, animation) {
	value = Math.max(0, Math.min(value, 100));

	this.setPercentOnly(value, notify, animation);
	this.relayoutChildren();

	return this;
}

UIProgressBar.prototype.getPercent = function() {
	return this.value * 100;
}

UIProgressBar.prototype.getValue = function() {
	return this.getPercent();
}

UIProgressBar.prototype.setValue = function(value, notify, animation) {
	this.setPercent(value, notify, animation);

	return this;
}

UIProgressBar.prototype.drawText = function(canvas) {
	var text = Math.round(this.getPercent()) + "%";

	if(!this.isTextColorTransparent()) {
		canvas.font = this.style.getFont();
		canvas.fillStyle = this.getTextColor();
		canvas.textBaseline = "middle";
		canvas.textAlign = "center";

		canvas.fillText(text, this.w >> 1, this.h >> 1);
	}

	return;
}

UIProgressBar.prototype.paintSelfOnly = function(canvas) {
}

UIProgressBar.prototype.drawBgImageV = function(canvas) {
	var image = null;
	var w = this.w >> 1;
	var x = (this.w - w)>> 1;
	var r = this.roundRadius ? this.roundRadius : 0;

	var wImage = this.getImageByType(UIElement.IMAGE_DEFAULT);
	if(wImage && wImage.getImage()) {
		var rect = wImage.getImageRect();
		
		image = wImage.getImage();
		if(this.images.display === UIElement.IMAGE_DISPLAY_SCALE) {
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_SCALE, 0, 0, this.w, this.h, rect);
		}
		else {
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_9PATCH, x, 0, w, this.h, rect);
		}
	}
	else {
		canvas.beginPath();
		canvas.translate(x, 0);
		drawRoundRect(canvas, w, this.h, r);
		canvas.translate(-x, 0);
		canvas.fillStyle = this.style.fillColor;
		canvas.fill();
	}

	wImage = this.getImageByType(UIElement.IMAGE_NORMAL_FG);

	var h = Math.round(this.h * this.value);
	var y = this.h - h;

	if(wImage && wImage.getImage()) {
		var rect = wImage.getImageRect();
		image = wImage.getImage();

		if(this.images.display === UIElement.IMAGE_DISPLAY_SCALE) {
			var tmph = rect.h;
			var tmpy = rect.y;
			var tmprh = rect.rh;
			var ih = Math.round(tmph*this.value);
			rect.h = ih;
			rect.y = rect.y + tmph - ih;
			rect.h = ih;
			rect.rh = Math.round(tmprh*this.value);  
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_SCALE, 0, y, this.w, h, rect);
			rect.y = tmpy;
			rect.h = tmph;
			rect.rh = tmprh;
		}
		else {
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_9PATCH, x, y, w, h, rect);
		}
	}
	else {
		if(h > 2 * r) {
			canvas.beginPath();
			canvas.translate(x, y);
			drawRoundRect(canvas, w, h, r);
			canvas.fillStyle = this.style.lineColor;
			canvas.fill();
		}
	}

	return;
}

UIProgressBar.prototype.drawBgImageH = function(canvas) {
	var image = null;
	var h = this.h >> 1;
	var y = (this.h - h)>> 1;
	var r = this.roundRadius ? this.roundRadius : 0;

	var wImage = this.getImageByType(UIElement.IMAGE_DEFAULT);
	if(wImage && wImage.getImage()) {
		var rect = wImage.getImageRect();
		
		image = wImage.getImage();
		if(this.images.display === UIElement.IMAGE_DISPLAY_SCALE) {
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_SCALE, 0, 0, this.w, this.h, rect);
		}
		else {
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_9PATCH, 0, y, this.w, h, rect);
		}
	}
	else {
		canvas.beginPath();
		canvas.translate(0, y);
		drawRoundRect(canvas, this.w, h, r);
		canvas.translate(0, -y);
		canvas.fillStyle = this.style.fillColor;
		canvas.fill();
	}

	var w = Math.round(this.w * this.value);
	var wImage = this.getImageByType(UIElement.IMAGE_NORMAL_FG);
	if(wImage && wImage.getImage()) {
		var rect = wImage.getImageRect();

		image = wImage.getImage();
		if(this.images.display === UIElement.IMAGE_DISPLAY_SCALE) {
			var tmpw = rect.w;
			var tmprw = rect.rw;
			rect.w = Math.round(rect.w*this.value);
			rect.rw = Math.round(rect.rw*this.value);
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_SCALE, 0, 0, w, this.h, rect);
			rect.w = tmpw; 
			rect.rw= tmprw;
		}
		else {
			WImage.draw(canvas, image, UIElement.IMAGE_DISPLAY_9PATCH, 0, y, w, h, rect);
		}
	}
	else {
		if(w > 2 * r) {
			canvas.beginPath();
			canvas.translate(0, y);
			drawRoundRect(canvas, w, h, r);
			canvas.fillStyle = this.style.lineColor;
			canvas.fill();
		}
	}

	return;
}

UIProgressBar.prototype.drawCircle = function(canvas) {
	var cx = this.w >> 1;
	var cy = this.h >> 1;
	var r = Math.min(cx, cy);
	var angle = Math.PI * 2 * this.value - 0.5 * Math.PI;
	var lineWidth = Math.min(r, Math.max(this.style.lineWidth, 5));

	if(!this.isFillColorTransparent()) {
		canvas.beginPath();
		canvas.arc(cx, cy, r, 0, Math.PI * 2);
		
		canvas.fillStyle = this.style.fillColor;
		canvas.fill();
	}

	if(!this.isStrokeColorTransparent()) {
		r = r - (lineWidth >> 1);
		
		canvas.beginPath();
		canvas.lineCap = 'round';
		canvas.lineWidth = lineWidth;
		canvas.arc(cx, cy, r, -Math.PI * 0.5, angle);
		
		canvas.strokeStyle = this.style.lineColor;
		canvas.stroke();
	}

	return;
}

UIProgressBar.prototype.drawBgImage = function(canvas) {
	canvas.save();
	if(Math.abs(this.w - this.h) < 10) {
		this.drawCircle(canvas);
	}
	else if(this.w > this.h) {
		this.drawBgImageH(canvas);
	}
	else {
		this.drawBgImageV(canvas);
	}
	canvas.restore();
}

UIProgressBar.prototype.onFromJsonDone = function() {
	this.setPercent(this.getPercent());

	return;
}

function UIProgressBarCreator(w, h, interactive) {
	var type = interactive ? "ui-slider" : "ui-progressbar";
	var args = [type, "ui-progressbar", null, 1];
	
	ShapeCreator.apply(this, args);
	this.createShape = function(createReason) {
		var g = new UIProgressBar();
		return g.initUIProgressBar(this.type, w, h, interactive);
	}
	
	return;
}

ShapeFactoryGet().addShapeCreator(new UIProgressBarCreator(200, 45, false));
ShapeFactoryGet().addShapeCreator(new UIProgressBarCreator(200, 45, true));

