// reset underscore template tag so that it does not conflict with ejs
_.templateSettings = {
	  interpolate : /\{\{(.+?)\}\}/g,
	  escape      : /\{\{-(.*?)\}\}/g
};


//set up the collections
var widgetList = new HWidgetCollection(
		[
		 {"title"   : "White Note",  "imgPath" : "cards/white.png",  "type" : "image",   "cssClass" : "noteCard"  },
		 {"title"   : "Blue Note",  "imgPath" : "cards/blue.png",  "type" : "image",   "cssClass" : "noteCard"  },
		 {"title"   : "Yellow Note",  "imgPath" : "cards/yellow.png",  "type" : "image",   "cssClass" : "noteCard"  },
		 {"title"   : "Green Note",  "imgPath" : "cards/green.png", "type" : "image",   "cssClass" : "noteCard"  },
		 {"title"   : "Divider",  "imgPath" : "green-board-line.png",  "tbPath"  : "green-board-line.png", "type" : "image",   "cssClass" : "noteCard divider"  }
		], 
		
		{'imgPrefixPath' : '/images/board/'}); 

var stickiesList = new HWidgetCollection(
		[
		 {"title"   : "Blue Sticker",  "imgPath" : "sticker-blue.png",   "cssClass" : "sticker"  },
		 {"title"   : "Green Sticker",  "imgPath" : "sticker-green.png",   "cssClass" : "sticker"  },
		 {"title"   : "Red Sticker",  "imgPath" : "sticker-red.png",   "cssClass" : "sticker"  },
		 {"title"   : "Purple Sticker",  "imgPath" : "sticker-purple.png",   "cssClass" : "sticker"  },
		 {"title"   : "Blue Star",  "imgPath" : "sticker-bluestar.png",   "cssClass" : "sticker"  },
		 {"title"   : "Red Star",  "imgPath" : "sticker-redstar.png",   "cssClass" : "sticker"  },
		 {"title"   : "Silver Star",  "imgPath" : "sticker-silverstar.png",   "cssClass" : "sticker"  },

		], 
		
		{'imgPrefixPath' : '/images/board/stickers/'}
		); 



////////////////////end collections //////////////////////////


/******** Backbone views ****************************/

// get username form at the beginning
var NamePromptView = Backbone.View.extend({
  tagName: "div",
  el: '#enterNameForm' ,
  errMsgTemplate: _.template ( $("#errTemplate").html() ), // use underscore templateing

  events: {
    "click #goBtn": "handleGoBtnClick"
  },
  
  initialize: function(){
  	// handle the error for the model here
    this.model.on( "error", this.showError, this );
  },

  render: function() { // override render to write error message if neccessary
    //this.$el.html(this.template(this.model.toJSON()));
    return this;
  },
  
  showError: function(model, error) {
  	 this.$('.msgHolder').html( this.errMsgTemplate({msg: error}) );
  },
  
  handleGoBtnClick: function(){
	  // validate model here
	  var nickname = this.$('input.nickname').val() ;
	  if( this.model.set( {'name': nickname } ) )
	  {
		  this.trigger('getNameSuccess'); // name is get successfully, trigger event
		   
	  }
  }
  
});	


// main area view
var MainAreaView = Backbone.View.extend({
  tagName: "div",
  el: '#mainArea',
  events: {
	   "keypress #chatmsg" : "handleChatKeyPress",
	   "click #sendBtn"    : "handleSendBtnClick" 
  },
  
  // templates
  widgetTemplate: _.template( $("#widgetTemplate").html() ),
  chatUserTemplate: _.template( $("#chatUserTemplate").html() ),
  chatServerTemplate: _.template( $("#chatServerTemplate").html() ),
  chatOtherUserTemplate: _.template( $("#chatOtherUserTemplate").html() ),

  initialize: function() {
  	  this.clientCount = new ClientCountModel();
  	  
  	  //chat related items
  	  this.chatList =  new ChatCollection();
  	  
  	  this.chatBox = this.$('#messages');
  	  this.errBox = this.$('.errBox');
  	  this.chatCmtBox = this.$('#chatmsg');
  	  
  	  
  	  // whenever the count change, just re-render the view
  	  this.clientCount.bind('change', this.renderClientCnt, this);
  	  
  	  // whenever there is new chat message added to the list, re-render
  	  this.chatList.bind('add', this.renderChatMsg, this);
  	  
	  this.render();
  },
  render: function() {
	  var noteWidgetContainer = this.$('#notesWidgets');
	  var stickiesContainer = this.$('#stickies');
	  
	  widgetList.each(function(widget) {
		  
		  noteWidgetContainer.append( this.widgetTemplate(widget.toJSON() )  );
	  }, this);
	  
	  stickiesList.each(function(widget) {
		  
		  stickiesContainer.append( this.widgetTemplate(widget.toJSON() )  );
	  }, this);
	  
	  // init touch events for note elements
	  //convert touch events to mouse events so that touch will work for jquery ui
	  if(HUtil.isMobile() ) // only do this for mobile devices
      {
            HUtil.initTouchEvents( $('#notesWidgets img.noteCard') );
            HUtil.initTouchEvents(  $('#stickies img.sticker') );
      }
	   
	  return this;
  },
  renderClientCnt: function(newCount){
	  this.$('.userCount').html(this.clientCount.get("clients") );
	  
  },
  renderChatMsg: function(newChatMsg){
	  
	  //console.log("render chat msg");
	  
	  if( $.trim(newChatMsg.get('msg')).length == 0 )
	  {
		  this.errBox.show();
		  return;
	  }
	  
	  var msgType = newChatMsg.get("msgType"); // it is either a client or server msg
	  if(msgType == "server") // we render accordingly
	  {
/* 		  console.log("msg: " + JSON.stringify(newChatMsg) ); */
		  this.chatBox.append( this.chatServerTemplate(newChatMsg.toJSON() ) );
	  }
	  else if(msgType== "self") // this message is typed in by the current user
	  {
		  this.chatBox.append( this.chatUserTemplate(newChatMsg.toJSON() ) );
		  
		   // clear value in comment box and scroll the thing properly
		   this.chatCmtBox.val(''); // clear the comment box		  
	  }
	  else
	  {
		  this.chatBox.append( this.chatOtherUserTemplate(newChatMsg.toJSON() ) );
	  }
	  this.errBox.hide(); // clear the error box if there is any
	  
	  
	  var chatBox = this.chatBox;
	  var scrollVal = chatBox.prop("scrollHeight")  - chatBox.height() ;
	  //scroll to bottom if chat list is too long
	  if(scrollVal < 0)
	       scrollVal = chatBox.height() ;
	    
/* 	  chatBox.animate({ scrollTop: scrollVal} , 1000); */
	  chatBox.scrollTop(scrollVal);

	  
	  	  
  },
  handleChatKeyPress: function(e){
	  if(e.which == 13) {
        e.preventDefault();
        this.sendChatMsg();
       
      }
  },
  handleSendBtnClick: function(){
	  this.sendChatMsg();
  },
  sendChatMsg: function(){
	   var chatBoxVal = $.trim( this.chatCmtBox.val() );
	    
	   // emit chat messages
	   if(chatBoxVal.length > 0)
	   {
	   		MyApp.socket.emit('chatmsg', { 'name' : MyApp.curUser.get("name") , 'msg' : chatBoxVal } );
	   		
	   		var chatMsg = new ChatModel({'msgType': 'self', 'name' : MyApp.curUser.get('name'), 'msgDate' : (new Date()).toISOString() , 'msg' : chatBoxVal });
	   this.chatList.add(chatMsg);
	   }
	   else{
		   this.errBox.show();
	   }
	   
  }
  
  

});


var MyApp = {
	notes: {}, // will store notes & stickers to be exchanged with server
    curActiveNote: null, // which note is currently being edited

	init: function(){
		// set up user
		this.curUser = new BoardUser();
		
		this.enterNameForm = new NamePromptView({model: this.curUser});
		this.mainView = new MainAreaView({model: this.curUser});
		
		// when user has entered a name, show the main area
		// the event is triggered above
		this.enterNameForm.on('getNameSuccess', function(){
			
			 MyApp.enterNameForm.$el.hide();
			 MyApp.setupSocketIO();
			 
		});
		
		
		// setup note card
		// setup canvas
        // init the stage and layer
        var stage = this.stage = new Kinetic.Stage({
            container: "boardArea",
            width: 620,
            height: 460
        });
        
        //console.log("init width " + $(window).width());
        
               
        var layer = this.layer= new Kinetic.Layer();
    
        stage.add(layer);
        
        
        // set up background board image
        this.setupBgImg('/images/board/chalkboard3.jpg');
		
		// setup all the image widgets
        this.setupWidgets();
        
        // setup drag, drop support
        this.setupBoardDrop();
        
        // setup form
        $('#editNoteForm .saveBtn').click(function(){
        	  var val = $('#noteText').val();
	          val = $.trim(val);
	          if(val.length == 0)
	          {
	            $('#editNoteForm .errmsg').html('Please type in a note.');
	            $('#editNoteForm .alert-error').show();
	            
	          }
	          else if(val.length > KineticExt.configs.MAX_CHARS_PER_NOTE_LINE){
	            $('#editNoteForm .errmsg').html('Your note is too long. Please re-enter and try again.');
	            $('#editNoteForm .alert-error').show();
	            
	          }
	          else
	          {
	            // do something with this
	            $('#editNoteForm .alert-error').hide();
	            var savVal = $("#noteText").val();
	            if(MyApp.curActiveNote)
	            {
	                MyApp.curActiveNote.attrs.text = savVal;
	            }   
	            MyApp.layer.draw(); // refresh layers
	            
	            var oId = MyApp.curActiveNote.attrs.oId;
	            
	            // send the new updated note to other users
	            MyApp.sendNoteToServer(oId, MyApp.notes[oId] );
	            
	            //alert("Saving data : " + savVal);
	            
	            // save data
	            $( "#editNoteForm" ).modal('hide');
	          }

        });
        
        // delete btn press
        $('#editNoteForm .deleteBtn').click(function(){
        	 $( "#editNoteForm" ).modal('hide');
        	 $( "#deleteForm" ).modal('show');
        });
        
        $('#deleteForm .yesBtn').click(function(){
        	// remove the note
        	MyApp.layer.remove(MyApp.curActiveNote);
        	
        	// send this information to server
        	MyApp.layer.draw();
        	MyApp.sendDeleteNoteRequest(MyApp.curActiveNote.attrs.oId);
        	
        	$( "#deleteForm" ).modal('hide');
        	
        	
        });

		
		return this;
	},
	
	    
	// setup board background image
	setupBgImg: function(containerImgSrc){
        var stage = this.stage;
        var layer = this.layer;
        
        if(!layer)
            return;
        
        var imageObj = new Image();
        $(imageObj).load( function() {
            
            var image = new Kinetic.Image({
                    x: (stage.attrs.width - imageObj.width )/2,
                    y: 0,
                    image: imageObj,
                    name: "backgroundImg"
            });
            image.attrs.imgSrc = containerImgSrc;
            
            // add the shape to the layer
            layer.add(image);
            image.setZIndex(0);
            
            layer.draw();
            
        });
        imageObj.src = containerImgSrc;
    },
    
    setupBoardDrop: function(){ // handle drag and drop when item is dropped on the board
         $('#boardArea').droppable( {
            drop: function(event, ui){
                var draggable = ui.draggable;
                
                var isNote = draggable.hasClass('noteCard'); // whether is note or sticky
                var isDivider = draggable.hasClass("divider");
                
                //console.log("isNote : " + isNote);
                
                var boardAreaOffset = $('#boardArea').offset();
                
                var offsetXPos = parseInt( ui.offset.left );
                var offsetYPos = parseInt( ui.offset.top );
                
                // get mouse position
                var mouseX = offsetXPos - boardAreaOffset.left;
                var mouseY = offsetYPos - boardAreaOffset.top;
                
                //console.log(draggable.attr('src') );
                
                var imgSrc = draggable.attr('src');
                var objType = "note";
                
                if(isDivider || (!isNote) ){
                    objType = "image";
                }
                
                
                MyApp.addNoteWidget(imgSrc, KineticExt.configs.NOTE_DEFAULT_TEXT, objType, mouseX, mouseY, true, null);
                
            }
         });
        
        console.log("setup board"); 
    },
    
    setupWidgets: function(){
        console.log("setup widgets");
        
        var opts = {
            cursor: 'move',
            appendTo: "body",
            helper: function(event){
                
                var imgSrc = $(this).attr('src');
                return '<div class="widgetDiv" ><img src="' + imgSrc + '" /></div>';     
            }
           
        };
        
        $("#notesWidgets img.noteCard").draggable(opts);
        $("#stickies img.sticker").draggable(opts);
        
    },

	// objType is either note or image
	// there are only 2 types: our custom Kinetic Note(which combine image and text) or a normal image such as a divider
	// add this image/widget at x,y positions
	// if receive this note from the server, then the object id will be stored in receiveOid
	// the object id (oid) is a combination of the socket.io client id and Kinetic shape id
    addNoteWidget: function(imgSrc, text, objType, mouseX, mouseY, sendToServer , receiveOid){
        //console.log("add note widget");
     
        var imageObj = new Image();
                
        $(imageObj).load(function(){
           
            var layer = MyApp.layer;
            var newObj = null;
            
            if(objType == "note" ){
                var imageX = mouseX;
                var imageY = mouseY;
                
                var myNote = new Kinetic.MyNote({
                    image: imageObj,
                    x :  mouseX,
                    y :  mouseY,
                    width: imageObj.width ,
                    height: imageObj.height ,
                    draggable: true,
                    name: "myNote",
                    imgSrc: imgSrc,
                    text: text,
                    fontSize: 11,
                    fontFamily: "Arial",
                    textFill: "black",
                    fontStyle: "normal"
                });
                
                
                layer.add(myNote);
                myNote.setZIndex(1);
                
                // give user option to edit the note
                myNote.on("dblclick dbltap", function(evt) {
                    var text = this.attrs.text;
                    
                    // rmb the current active note
                    MyApp.curActiveNote = this;
                    
                    // open modal dialog
                    if(text == KineticExt.configs.NOTE_DEFAULT_TEXT)
                    {
                        $("#noteText").val(""); // if default value then clear
                    }
                    else
                        $("#noteText").val(text);
                    
                    
                    // open edit form
                    $( "#editNoteForm" ).modal('show');
                    
                    
                });
                          
                newObj = myNote;
                
            }
            else{ // normal image
                var imageX = mouseX;
                var imageY = mouseY;
            
                var image = new Kinetic.Image({
                    image: imageObj,
                    x :  imageX,
                    y :  imageY,
                    width: imageObj.width ,
                    height: imageObj.height ,
                    draggable: true,
                    name: "img",
                    imgSrc: imgSrc
                });
                
                layer.add(image);
                
                // always put the stickers to be above notes
                image.setZIndex(10);
                
                newObj = image;
                
            }
            
            // if the object is sent from server, then store it in our objects array
            if(receiveOid)
            {
                MyApp.notes[receiveOid] = newObj;
                newObj.attrs.oId = receiveOid;
            }
            else{ // otherwise generate the object id from socket.io client id and Kinetic id
                var oId = MyApp.curUser.get("clientid") + "_" + newObj._id;
                MyApp.notes[oId] = newObj;
                newObj.attrs.oId = oId;
            }
           

            if(sendToServer)
                MyApp.sendNoteToServer(oId, newObj);
                
            newObj.on("dragend", function(evt) {
                MyApp.sendNoteToServer(this.attrs.oId, this);
            });
            
            layer.draw(); // refresh layer
            
        });
        
        imageObj.src = imgSrc;
    },
    reset: function(){ // reset the stage, chat msg, etc
	    MyApp.stage.clear();
        MyApp.layer.removeChildren();	
        
        // set up background board image
        MyApp.setupBgImg('/images/board/chalkboard3.jpg');
                    
        // remove all the notes
        MyApp.notes = {};
        MyApp.curActiveNote = null;
        
        // clear chat msg
        MyApp.mainView.chatList.reset();
        MyApp.mainView.chatBox.html('');

    },
	setupSocketIO: function(){
		
		// show loading dialog
		$('#progressArea').show();
		
		var socket = this.socket = io.connect('/');
		
		// send the name
		socket.on('connect', function () {	
		
			// only setup after connected
			// send server the name
			socket.emit('myname', { 'name' : MyApp.curUser.get("name") } );
		
			socket.on('maxclientsreached', function(){
				// show err message
				$('#progressArea').hide();
				$('#maxClientsArea').show();
			
			});
		
		
			// initial connection, receive all data abt current connected users and msg
			socket.on('initData', function(data) {
	            
	            // clear everything in case user left browser on, turn off ipad, then turn on again to reconnect  
	           	MyApp.reset();
	           	
	           	console.log("initData called");    
	               
	            MyApp.curUser.set("clientid" , data.clientId);
	            MyApp.updateClientCount(data.activeClientCount);
	            
/* 	            console.log("msg list: " + data.msgList ); */
	            
	            // load the old chat message list
	            var chatList = JSON.parse(data.msgList);
	            _.each(chatList, function(oldChatMsg){
	            	 var chatMsg = new ChatModel({'msgType': 'server', 'name' : oldChatMsg.name , 'msgDate' : oldChatMsg.msgDate, 'msg' : oldChatMsg.msg });
	            	 MyApp.mainView.chatList.add(chatMsg);
	            });
	            
	            // set the message I have connected for current user
	            var chatMsg = new ChatModel({'msgType': 'self', 'name' : MyApp.curUser.get("name") , 'msgDate' : data.msgDate, 'msg' : 'has connected.' });
	           MyApp.mainView.chatList.add(chatMsg);
	            
	           // process receive note
	           var noteList =  JSON.parse(data.noteList);
	           for (var prop in noteList) {
		         	var noteFromServer =  noteList[prop];
		         	
		         	MyApp.addNoteWidget(noteFromServer.imgSrc, noteFromServer.text, noteFromServer.objType, noteFromServer.x, noteFromServer.y, false, noteFromServer.oId);
	                
	            }
	            
	            
	            // show the main area
	            $('#progressArea').hide();
	            MyApp.mainView.$el.show();
	            
	            // refresh
	            MyApp.layer.draw();

	        });
	        
	        // somebody has connected
	        socket.on('newuser', function(data) {
	           // show the message that somebody disc
	           console.log("some user connected");
	           
	           MyApp.updateClientCount(data.activeClientCount);
	           
	           var chatMsg = new ChatModel({'msgType': 'server', 'name' : data.name, 'msgDate' : data.msgDate, 'msg' : 'has connected.' });
	           MyApp.mainView.chatList.add(chatMsg);
	        
	        });

	        
	        // somebody has disconnected
	        socket.on('userdisc', function(data) {
	           // show the message that somebody disc
	           console.log("some user disconnected");
	        
	           MyApp.updateClientCount(data.activeClientCount);
	           var chatMsg = new ChatModel({'msgType': 'server', 'name' : data.name, 'msgDate' : data.msgDate, 'msg' : 'has disconnected.' });
	           MyApp.mainView.chatList.add(chatMsg);
	           
	          
	        });
	        
	        socket.on('chatmsg', function(data) {
	           var chatMsg = new ChatModel({'msgType': 'server', 'name' : data.name, 'msgDate' : data.msgDate, 'msg' : data.msg });
	           MyApp.mainView.chatList.add(chatMsg);
	        });
	        
	        // note update
	        socket.on('updateNote', function(data) {
                var oid = data.oId; // the id should be generate from the client id & the local id
                var x = data.x;
                var y = data.y;
                var objType = data.objType ; // either image e.g. sticker, divider or a note
                var src = data.imgSrc || ""; // image source if there is any
                var text = data.text || "";   
                
                console.log("receive oid " + oid);
                
                var curObj = MyApp.notes[oid];
                
                // check whether there is already this key
                // if not add, other wise update
                if(curObj)
                {
                    //console.log("object in " + oid);
                    var curObj = MyApp.notes[oid];
                    
                    //console.log(curObj);
                    
                    curObj.attrs.x = x;
                    curObj.attrs.y = y;
                    
                    if(objType == "note"){
                        curObj.attrs.text = text;
                        curObj.attrs.imgSrc = src;
                    }
                }
                else
                {
                    // add to canvas
                    // need to maintain the id here
                    console.log("get note from server and update: " + src);
                    MyApp.addNoteWidget(src, text, objType, x, y, false, oid);
                }
                
                // refresh
                MyApp.layer.draw();
                
                
            });
            
            // note delete
            socket.on('deleteNote', function (data) {
			      var oid = data.oId;
			      
			      // clear element from canvas and notes obk
			      
			      if(MyApp.notes[oid])
			      {
			      	MyApp.layer.remove( MyApp.notes[oid] );
			      	MyApp.layer.draw();
			      	delete MyApp.notes[oid];
			      }
			     			      
		    });
		    
		    // limit reach when try to add note
		    socket.on('maxNoteReached', function (data) {
			      var oid = data.oId;
			      
			      // clear element from canvas and notes 
			      if(MyApp.notes[oid])
			      {
			      	MyApp.layer.remove( MyApp.notes[oid] );
			      	MyApp.layer.draw();
			      	delete MyApp.notes[oid];
			      }
			      
			      // display err msg
			      alert("Max number of notes reached. You cannot add any new note. Please delete some notes to continue.");
			     			      
		    });

	        
	        
	    }); // end socket on connect
        
		
				
		
	},
	
	updateClientCount: function(newCount){ // update number of users connected to chat
		MyApp.mainView.clientCount.set("clients", newCount);
	},
	
	sendNoteToServer: function(oId, obj){
        var socket = MyApp.socket;
        
        var oid = oId; // the id should be generate from the client id & the local id
        var x = obj.attrs.x;
        var y = obj.attrs.y;
        
        var objType = "note" ; // either image e.g. sticker, divider or a note
        var src = ""; // image source if there is any
        var text = "";
        
        // we can send either the note or image (dividers, stickers) to the server
        if(obj instanceof Kinetic.MyNote ){
            //console.log("sending note");
            objType = "note" ;
            src = obj.attrs.imgSrc;
            text = obj.attrs.text;
        }
        else{
            objType = "image";
            src = obj.attrs.imgSrc;
            
        }
        
        var updatedNote = {oId: oid , x:x, y:y, objType: objType, imgSrc: src, text: text };
        //console.log("sending " + oId);
        //console.log(updatedNote);
        
        //send to server
        socket.emit( 'updateNote' ,  updatedNote );
    },
    sendDeleteNoteRequest: function(oId){
	    var socket = MyApp.socket;
	    socket.emit( 'deleteNote' ,  {'oId': oId} );
    }

	
	
	
};



//////// end views ///////////////////


$(document).ready(function(){
	
		MyApp.init();
	

});