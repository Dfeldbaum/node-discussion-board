/// Backbone models
// user will have a name
var BoardUser = Backbone.Model.extend({
	    
	    defaults: {
		    "clientId": 0 // browser clientId
		},

	    
	    // validation
	    validate: function(attrs) {
	    	if (attrs.name.length == 0 ) {
		      return "Please enter your nickname";
		    }
		    else if(attrs.name.length > 20){
			    return "Your nickname is too long. Please re-enter and try again." ;
		    }
		},
		
		sync: function (method, model, options) { 
			// note , sync is only called if model.save is call
			// set method does not trigger this
			console.log("BoardUser sync called");
			return false; 
		} // disable sync with server
	    
});

// chat model which hold a message
var ChatModel = Backbone.Model.extend({
	
	formatChatDate: function(dateStr){
    	var t = new Date( Date.parse(dateStr) );
    	var hh = t.getHours().toString();
    	var mm = t.getMinutes().toString();
    	
    	if(hh.length == 1)
    		hh = '0' + hh;
    	if(mm.length == 1)
    		mm = '0' + mm;
    	
    	return hh + ":" + mm ;
    },
    
    initialize: function(){
		this.set('chatTime' , this.formatChatDate( this.get("msgDate") ) ); 
    }
	
	
});

// client count
var ClientCountModel = Backbone.Model.extend({
	defaults: {
        "clients": 0
    }
});

var ChatCollection = Backbone.Collection.extend({
    model: ChatModel
});




