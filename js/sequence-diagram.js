var Measures = {
	strategiesX: {
		center: function (x, width) {
			return x - (width / 2);
		},
		left: function (x, width) {
			return x;
		},
		right: function (x, width) {
			return x - width;
		}
	},
	strategiesY: {
		middle: function (y, height) {
			return y - (height / 2);
		},
		top: function (y, height) {
			return y;
		},
		bottom: function (y, height) {
			return y - height;
		}
	},
	point: function (measures, relativeX, relativeY) {
		if (this.strategiesX[relativeX] === undefined) throw "Unknown relative position "+relativeX+" allowed = " + Object.keys(this.strategiesX);
		if (this.strategiesY[relativeY] === undefined) throw "Unknown relative position "+relativeY+" allowed = " + Object.keys(this.strategiesY);

		return {
			x: this.strategiesX[relativeX].apply({}, [measures.x, measures.width]),
			y: this.strategiesY[relativeY].apply({}, [measures.y, measures.height])
		}
	},
	rectangle: function (measures, relativeX, relativeY) {
		if (this.strategiesX[relativeX] === undefined) throw "Unknown relative position "+relativeX+" allowed = " + Object.keys(this.strategiesX);
		if (this.strategiesY[relativeY] === undefined) throw "Unknown relative position "+relativeY+" allowed = " + Object.keys(this.strategiesY);

		return {
			x: this.strategiesX[relativeX].apply({}, [measures.x, measures.width]),
			y: this.strategiesY[relativeY].apply({}, [measures.y, measures.height]),
			width: measures.width,
			height: measures.height
		};
	}
};

function Entity (options) {
	this.options = $.extend(true, {
		snap: undefined,
		id: "id",
		name: "unknown",
		style: {
			padding: {
				left: 10,
				right: 10,
				top: 10,
				bottom: 10
			},
			attributes: {
				rect: {
					fill: "none", 
					stroke: "#ccc", 
					strokeWidth: 1
				},
				text: {
					
				},
				line: {
					stroke: "#ccc",
					strokeWidth: 1,
					"stroke-dasharray":"5,5"
				},
				transparentLine: {
					stroke: "rgba(0, 0, 0, 0)",
					strokeWidth: 10
				}
			}
		}
	}, options);


	this.draw = function () {
		var snap = this.options.snap;
		if (this._group === undefined) {
			var text = snap.text(this.options.style.padding.left, this.options.style.padding.top, this.options.name);
			var bbox = text.getBBox();
			var width = bbox.width + this.options.style.padding.right + this.options.style.padding.left;
			var height = bbox.height + this.options.style.padding.bottom + this.options.style.padding.top;

			var rect = snap
				.rect(0, 0, width, height)
				.attr($.extend(true, {}, this.options.style.attributes.rect));
			
			var textY = (bbox.height * 3 / 4);
			text.transform("t0,"+textY)
				.attr($.extend(true, {}, this.options.style.attributes.text));

			this._group = snap.g();
			this._group.attr({
				class: "entity",
				"data-entity": "e-"+this.options.id
			});
			this._group.add(text, rect);
		}
		return this.getGroup();
	};

	this.getId = function () {
		return this.options.id;
	};

	this.getHotSpot = function (relativeX, relativeY) {
		return Measures.point(this.getGroup().getBBox(), relativeX, relativeY);
	};

	this.getGroup = function () {
		return this._group;
	};

	this.moveTo = function (x, y) {
		this._group.transform("t"+x+","+y);
	};

	this.getWidth = function () {
		return this.getGroup().getBBox().width;
	};

	this.getHeight = function () {
		return this.getGroup().getBBox().height;
	};

	this.getXCenter = function () {
		var bbox = this.getGroup().getBBox();
		return bbox.x + (bbox.width / 2);
	};

	this.drawLine = function (y) {
		var bbox = this.getGroup().getBBox();
		var line = this.options.snap.line(bbox.width / 2, bbox.height, bbox.width / 2, y - bbox.height)
			.attr($.extend(true, { class: "shown" }, this.options.style.attributes.line));
		var transparentLine = this.options.snap.line(bbox.width / 2, bbox.height, bbox.width / 2, y - bbox.height)
			.attr($.extend(true, { 
				class: "transparent"
			}, this.options.style.attributes.transparentLine));

		$("body").append('<div class="entity-tooltip" id="tooltip-'+this.options.id+'" style="display: none; position: absolute;">'+this.options.name+'</div>');
		$(transparentLine.node).data("tooltip-id", 'tooltip-'+this.options.id);
		$(transparentLine.node).mouseover(function (e) {
			$('#'+$(this).data("tooltip-id")).css({
				left: e.clientX + 20,
				top: e.clientY - 20
			});
			$('#'+$(this).data("tooltip-id")).show();
		});
		$(transparentLine.node).mousemove(function (e) {
			$('#'+$(this).data("tooltip-id")).css({
				left: e.clientX + 20,
				top: e.clientY - 20
			});
		});
		$(transparentLine.node).mouseout(function (e) {
			$('#'+$(this).data("tooltip-id")).hide();
		});

		this._group.add(line, transparentLine);
	};
}

function EntityList (options) {
	this.entityIndex = {};
	this.entities = [];

	this.add = function (entity) {
		if (this.entityIndex[entity.getId()] === undefined) {
			this.entityIndex[entity.getId()] = this.entities.length;
			this.entities.push(entity);
		}
	};

	this.length = function () {
		return this.entities.length;
	};

	this.get = function (index) {
		return this.entities[index];
	};

	this.byKey = function (key) {
		return this.entities[this.entityIndex[key]];
	};

	this.each = function (f) {
		return $.each(this.entities, f);
	};
}

function Message (options) {
	this.options = $.extend(true, {
		snap: undefined,
		origin: "unknown",
		destination: "unknown",
		metadata: {
			id: "unknonwn",
			title: "unknown",
			description: "<h1>Unknown</h1>"
		},
		style: {
			padding: {
				left: 10,
				right: 10,
				top: 10,
				bottom: 10
			},
			attributes: {
				rect: {
					fill: "none", 
					stroke: "#ccc", 
					strokeWidth: 1
				},
				text: {},
				line: {

				},
				arrow: {
					fill: "#000"
				}
			}
		},
		size: {
			arrow: {
                deltaAngle: Math.PI / 6,
                size: 10
			}
		}
	}, options);

	this.getOrigin = function () {
		return this.options.origin;
	};

	this.getDestination = function () {
		return this.options.destination;
	};

	this.draw = function () {
		var self = this;
		var snap = this.options.snap;
		if (this._group === undefined) {
			this._text = snap
				.text(this.options.style.padding.left, this.options.style.padding.top, this.options.metadata.title)
				.attr($.extend(true, {}, this.options.style.attributes.text));

			$(this._text.node).data("message-id", this.options.metadata.id);
			$(this._text.node).data("message-title", this.options.metadata.title);
			$(this._text.node).data("message-description", this.options.metadata.description);
			$(this._text.node).click(function () {
				if ($('#'+$(this).data("message-id")).length == 0) {
					$('body').append('<div id="'+$(this).data("message-id")+'" title="'+$(this).data("message-title")+'">'+$(this).data("message-description")+'</div>');
				} 
				$('#'+$(this).data("message-id")).dialog();
			});
			this._group = snap.g();
			this._group.attr({
				class: "message",
				"data-entity": "m-"+this.options.metadata.id,
				"data-origin": this.options.origin,
				"data-destination": this.options.destination
			});
			this._group.add(this._text);
		}
		return this.getGroup();
	};

	this.getGroup = function () {
		return this._group;
	};

	this.getWidth = function () {
		return this.getGroup().getBBox().width;
	};

	this.getHeight = function () {
		return this.getGroup().getBBox().height;
	};

	this.moveFromTo = function (startX, endX, y) {
		var minX = Math.min(startX, endX);
		var maxX = Math.max(startX, endX);
		var difference = maxX - minX;
		var line = this.options.snap.line(0, 0, difference, 0)
			.attr($.extend(true, 
				{ color: "#000", stroke: "#ccc", strokeWidth: 1 }, 
				this.options.style.attributes.line)
			);
		this._group.add(line);
		var bbox = this._text.getBBox();
		var x = (maxX - minX) / 2 - bbox.x - bbox.width / 2;
		this._text.transform("t"+x+","+(-bbox.height-bbox.y));
		this._text.attr({
			"text-anchor":"center"
		});
		if (startX > endX) 
			this._group.add(this._drawArrow(0, 0, 0, this.options.size.arrow.size, this.options.size.arrow.deltaAngle));
		else
			this._group.add(this._drawArrow(difference, 0, Math.PI, this.options.size.arrow.size, this.options.size.arrow.deltaAngle));
		this._group.transform("t"+minX+","+y);
		return this._group;
	};

	this._drawArrow = function (x, y, angle, size, deltaAngle) {
		size = size === undefined ? 10 : size;
		deltaAngle = deltaAngle === undefined ? Math.PI / 4 : deltaAngle;
		var result = [x, y];
		result.push(Math.cos(angle+deltaAngle)*size + x);
		result.push(Math.sin(angle+deltaAngle)*size + y);
		result.push(Math.cos(angle-deltaAngle)*size + x);
		result.push(Math.sin(angle-deltaAngle)*size + y);
		return this.options.snap.polyline(result)
			.attr($.extend(true, {}, this.options.style.attributes.arrow));
	};
}

function MessageList (options) {
	this.options = $.extend(true, {
		minimumWidth: 50
	}, options);
	this.messages = [];

	this.add = function (item) {
		this.messages.push(item);
	};

	this.each = function (f) {
		return $.each(this.messages, f);
	};

	this.getRequiredWidth = function (origin, destination) {
		var width = this.options.minimumWidth;
		
		this.each(function (i, message) {
			if (message.getOrigin() == origin && message.getDestination() == destination) {
				var tmpWidth = message.getWidth();
				if (width < tmpWidth) {
					width = tmpWidth;
				}
			}
		});

		return width;
	};

	this.length = function () {
		return this.messages.length;
	};

	this.get = function (index) {
		return this.messages[index];
	};
}

function DiagramManager (options) {
	this.options = $.extend(true, {
		snap: undefined,
		style: {
			padding: {
				left: 20,
				top: 20,
				right: 20,
				bottom: 20
			},
			spacing: {
				betweenEntities: 50,
				betweenEntitiesAndMessages: 50,
				betweenMessages: 10
			}
		},
		entity: {
			style: {
				padding: {
					left: 20,
					top: 10,
					right: 20,
					bottom: 10
				}
			}
		},
		message: {
			style: {
				padding: {
					left: 20,
					top: 20,
					right: 20,
					bottom: 20
				}
			}
		}
	}, options);

	this.entities = new EntityList({});
	this.messages = new MessageList({
		minimumWidth: this.options.style.spacing.betweenMessages
	});
	this.maxMessageWidth = {};

	this.addEntity = function (entityConfig) {
		var entity = new Entity($.extend(true, {
			snap: this.options.snap
		}, entityConfig, this.options.entity));
		entity.draw();
		this.entities.add(entity);
	};

	this.addMessage = function (messageConfig) {
		var message = new Message($.extend(true, {
			snap: this.options.snap
		}, messageConfig, this.options.message));
		message.draw();

		this.messages.add(message);
	};

	this.draw = function () {
		var self = this;

		// Draw entities
		var startY = this._drawEntities(this.options.style.padding.top);
		

		// Draw Messages
		startY = this._drawMessages(startY);

		// Draw Vertical Lines
		this.entities.each(function (i, item) {
			item.drawLine(startY);
		});

		// Draw entities
		this.options.snap.attr({
			height: startY + this.options.style.padding.bottom
		});
	};

	this._drawMessages = function (startY) {
		var self = this;

		if (this.messages.length() > 0) {
			var beginY = startY + this.options.style.spacing.betweenEntitiesAndMessages;
			for (var i=0;i<this.messages.length();i++) {
				var message = this.messages.get(i);
				message.moveFromTo(
					this.entities.byKey(message.getOrigin()).getXCenter(),
					this.entities.byKey(message.getDestination()).getXCenter(),
					beginY
				);

				if (i < this.messages.length() - 1) {
					beginY += message.getHeight() + this.options.style.spacing.betweenMessages;
				}
			}
			return beginY  + this.messages.get(i-1).getHeight();
		}

		return startY;
	};

	this._drawEntities = function (startY) {
		var self = this;

		if (this.entities.length() > 0) {
			var beginX = this.options.style.padding.left;
			var beginY = startY;
			this.entities.get(0).moveTo(beginX, beginY);
			for (var i=1;i<this.entities.length();i++) {
				beginX = beginX + this.entities.get(i-1).getWidth() + this.messages.getRequiredWidth(this.entities.get(i-1).getId(), this.entities.get(i).getId());
				this.entities.get(i).moveTo(beginX, beginY);
			}

			beginX = beginX  + this.entities.get(i-1).getWidth() + this.options.style.padding.right;
			this.options.snap.attr({
				width: beginX
			});

			return startY + this.entities.get(i-1).getHeight();
		}

		return startY;
	};
}

function SequenceDiagram (options) {
	this.options = $.extend(true, {
		entities: [],
		messages: [],
		style: {
			padding: {
				left: 20,
				top: 20,
				right: 20,
				bottom: 20
			},
			spacing: {
				betweenEntities: 150
			}
		},
		entity: {
			style: {
				padding: {
					left: 20,
					top: 10,
					right: 20,
					bottom: 10
				}
			}
		}
	}, options);

	this.draw = function (querySelector) {
		var self = this;
		var snap = Snap(querySelector);
		var diagramManager = new DiagramManager({
			snap: snap,
			style: this.options.style,
			entity: this.options.entity,
			message: this.options.message,
		});

		$.each(this.options.entities, function (i, item) {
			diagramManager.addEntity(item);
		});

		$.each(this.options.messages, function (i, item) {
			diagramManager.addMessage(item);
		});

		diagramManager.draw();
	};
}