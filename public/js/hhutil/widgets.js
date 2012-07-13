//widget helper js

/// represent draggable widget to canvas 
//widget can be text, circle, rect, img, etc
var HWidget = Backbone.Model.extend({
	typeArr: ["image", "rect", "circle" , "roundrect", "text" ],
	defaults: {
		"title"   : "Image Widget",  // widget description
		"imgPath" : "image.png",  // actual image path to be put in canvas
		"tbPath"  : "thumbnail.png", // thumbnail path to be put in the widget panel (which will be drag)
		"type"    : "image",    // image
		"cssClass"	  : "widget"    // css class
	},

	initialize: function() {

		// set thumbnail path to image path if missing
		if ( !this.get("tbPath") ) {
			this.set({"tbPath": this.get("imgPath")  });
		}

		this.validate( this.attributes );

	},

	validate: function(attrs) {
/* 		console.log("widget validate"); */
		if ( _.isUndefined(attrs.imgPath) || (attrs.imgPath.length == 0) ) {
			console.log("Missing image path");
			return "Missing image path";
		}
		else if(!(_.include(this.typeArr, attrs.type ) ) ){
			console.log("Invalid widget type for image: " + attrs.imgPath );
			return "Invalid type";
		}
	},


	sync: function (method, model, options) { 
		// note , sync is only called if model.save is call
		// set method does not trigger this
		console.log("HHWidget sync called");
		return false; 
	} // disable sync with server

});

//collections
var HWidgetCollection = Backbone.Collection.extend({
	initialize: function(models, options) {
        options || (options = {});
        this.imgPrefixPath = options.imgPrefixPath || this.DEFAULT_PREFIX_IMG_PATH;
        
        // add the the prefix to the models image path
        for (var i = 0, l = models.length; i < l; i++) {
        	models[i].imgPath = this.imgPrefixPath + models[i].imgPath;
        	models[i].tbPath = this.imgPrefixPath + models[i].tbPath;
        	//console.log("new img path " + models[i].imgPath);
        	
        }
        
    },
	model: HWidget,
	DEFAULT_PREFIX_IMG_PATH: '/images/'  // prefix to the folder containing the images
});


var KineticExt = {
	configs: {
		MAX_CHARS_PER_NOTE_LINE: 90,
		NOTE_DEFAULT_TEXT: "Double click to edit note"
	}
};

// custom shape for MyNote which contain an image and a text which overlay it on top
Kinetic.MyNote = Kinetic.Shape.extend({

    init: function(config) {
         this.shapeType = "MyNote";

        config.drawFunc = function() {
              if(!!this.attrs.image) {
	            //console.log("this.attrs.imgSrc " + this.attrs.imgSrc);
	            //console.log("this.attrs.fontFamily " + this.attrs.fontFamily);
	         
	            var width = this.attrs.width !== undefined ? this.attrs.width : this.image.width;
	            var height = this.attrs.height !== undefined ? this.attrs.height : this.image.height;
	            
	            var canvas = this.getCanvas();
	            var context = this.getContext();
	
	            context.beginPath();
	            this.applyLineJoin();
	            context.rect(0, 0, width, height);
	            context.closePath();
	            
	            //this.fillStroke();
	            this.fill();
	            this.stroke();	
	
	            // draw note background
	            context.drawImage(this.attrs.image, 0, 0, width, height);
	            
	            // draw text element
	            context.font = this.attrs.fontStyle + ' ' + this.attrs.fontSize + 'pt ' + this.attrs.fontFamily;
	            context.textBaseline = 'middle';
	            context.fillStyle = this.attrs.textFill;
	            //console.log("font " + context.font);
	             
	            var tx = 40;
	            var ty = 40;
	        
	            // check for word length.. if too long then cut it short
	            if(this.attrs.text.length > KineticExt.configs.MAX_CHARS_PER_NOTE_LINE){
	               this.attrs.text =  this.attrs.text.substring(0, KineticExt.configs.MAX_CHARS_PER_NOTE_LINE);
	            }
	            
	            var lineHeight = 20;
	            var fitWidth = width - 60;
	            
	            //console.log("fit width " + this.image.width);
	            
	            // word wrap the text
	            this.printAtWordWrap(context, this.attrs.text, tx, ty, lineHeight, fitWidth);
	            
	            //console.log("length: " + this.attrs.text.length);
	            
	        }

        };
        // call super constructor
        this._super(config);
    },
    printAtWordWrap: function(context, text, x, y, lineHeight, fitWidth) {
        fitWidth = fitWidth || 100;
        lineHeight = lineHeight || 40;

        var currentLine = 0;

        var lines = text.split(/\r\n|\r|\n/);
        for (var line = 0; line < lines.length; line++) {


            if (fitWidth <= 0) {
                context.fillText(lines[line], x, y + (lineHeight * currentLine));
            } else {
                var words = lines[line].split(' ');
                var idx = 1;
                while (words.length > 0 && idx <= words.length) {
                    var str = words.slice(0, idx).join(' ');
                    var w = context.measureText(str).width;
                    if (w > fitWidth) {
                        if (idx == 1) {
                            idx = 2;
                        }
                        context.fillText(words.slice(0, idx - 1).join(' '), x, y + (lineHeight * currentLine));
                        currentLine++;
                        words = words.splice(idx - 1);
                        idx = 1;
                    }
                    else
                    { idx++; }
                }
                if (idx > 0)
                    context.fillText(words.join(' '), x, y + (lineHeight * currentLine));
            }
            currentLine++;
        }
    },

    getTextSize: function() {
        var context = this.getContext();
        context.save();
        context.font = this.attrs.fontStyle + ' ' + this.attrs.fontSize + 'pt ' + this.attrs.fontFamily;
        var metrics = context.measureText(this.attrs.text);
        context.restore();
        return {
            width: metrics.width,
            height: parseInt(this.attrs.fontSize, 11)
        };
    },
    
    setImage: function(image) {
        this.image = image;
    },
   
    getImage: function() {
        return this.image;
    },
  
    setWidth: function(width) {
        this.attrs.width = width;
    },
  
    getWidth: function() {
        return this.attrs.width;
    },
   
    setHeight: function(height) {
        this.attrs.height = height;
    },
   
    getHeight: function() {
        return this.attrs.height;
    },
  
    setSize: function(width, height) {
        this.attrs.width = width;
        this.attrs.height = height;
    },
    /**
     * return image size
     */
    getSize: function() {
        return {
            width: this.attrs.width,
            height: this.attrs.height
        };
    }

});








