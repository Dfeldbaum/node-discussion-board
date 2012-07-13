var activeClientCount = 0;
var noteCnt = 0;

var MAX_CLIENT_COUNT = 50;
var MAX_CHAT_MSG_SIZE = 50; // store max 50 messages in memory
var MAX_NOTES_COUNT = 50; // max number of notes that can be created

// store chat messages
var messages = [];

// storing the notes for each client
var notes = {};

var storeNewMsg = function(newData){

	 // store chat msg
     messages.push(newData);
     
     // trim the size if necessary
     if(messages.length > MAX_CHAT_MSG_SIZE){
	     messages.splice(0, messages.length  - MAX_CHAT_MSG_SIZE);
     }
}

var checkMaxClients = function(socket){
	 if(activeClientCount > MAX_CLIENT_COUNT){
      	 socket.emit('maxclientsreached');
      	 return true;
  	 }
  	 
  	 return false;
}

var boardRoute = function(req, res){

  	res.render('myboard', { title: 'Real Time Discussion Board' , layout: 'board_layout' })
};

exports.setupBoard = function(app, io){
	
	app.get('/board', boardRoute);	
	
	// socket.io setup
	io.sockets.on('connection', function (socket) {
      //console.log("server id: " + socket.id);
      
      activeClientCount++;
      
      // receive nickname from client
      socket.on('myname', function(data){
      	 socket.nickname = data.name;
      	 
      	 // if too many clients, then stop
      	 if(checkMaxClients(socket)){
	     	return;
      	 }
      	 
      	 var curDateStr = (new Date()).toISOString();
      	 
     	     	 
      	 // send initial data to client
      	 // data include the list of messages and list of notes
      	 socket.emit('initData' , {"clientId" : socket.id, "activeClientCount" : activeClientCount, "msgDate" : curDateStr, "msgList": JSON.stringify(messages) , 'noteList' : JSON.stringify(notes) } );
     
      	 // tell everyone about the new user
      	 socket.broadcast.emit('newuser', { "activeClientCount" : activeClientCount, "name": data.name, "msgDate" : curDateStr });
      
      });
        
      
      
      // chat app
      socket.on('chatmsg', function (data) {
         
         // if too many clients, then stop
      	 if(checkMaxClients(socket)){
	     	return;
      	 }
         
         if( (!data.msg) || (!data.name) )
         {
            console.log("invalid data. Disc");
            return;
         }
         
         socket.nickname = data.name;
         
         var text = data.msg;
         
         // shorten msg if too long
         if (text.length > 200)
         {
            text = text.substr(0,200);
            data.msg = text;
         }
         
         if (data.name.length > 20)
         {
            data.name = data.name.substr(0,20);
         }
         
        
         var newData = {msg: data.msg, name: data.name , msgDate: (new Date()).toISOString() }; 
         
         // store chat msg
         storeNewMsg(newData);
         
         // send to others
         socket.broadcast.emit('chatmsg', newData );
      });
      
     
      // client disconnect
      socket.on('disconnect', function () {
         //console.log("socket disconnect " + socket.id + ", name: " + socket.nickname );
         activeClientCount--;
         
         // broadcast that this user has disconnected
         // add in name later
         if(socket.nickname)
         	socket.broadcast.emit('userdisc', { "activeClientCount" : activeClientCount, "name": socket.nickname , "msgDate" : (new Date()).toISOString() });
         
       
      });
      

      // update a particular note
      socket.on('updateNote', function (data) {
         
         //console.log("server receive update request");
         
         // each note will be identified by the id and x,y , image source & note text
         var oid = data.oId; // the id should be generate from the client id & the local id
         var x = data.x;
         var y = data.y;
         var objType = data.objType ; // either image e.g. sticker, divider or a note
         var src = data.imgSrc || ""; // image source if there is any
         var text = data.text || "";
         
         //console.log("text: " + text + " obj type : " + objType);
         
         var updatedNote = {oId: oid , x:x, y:y, objType: objType, imgSrc: src, text: text, modifyDate:(new Date()).toISOString() };
         
         var isNewNote = true;
         if(notes[oid])
         {
	         isNewNote = false;
         }
         
         if(isNewNote){
         	if(noteCnt > MAX_NOTES_COUNT)
         	{
         		socket.emit('maxNoteReached', {oId: oid } ); // tell user that cannot add new notes if limit reached
         		return;
         	}
	        noteCnt++;
         }
         
         notes[oid] = updatedNote;
         socket.broadcast.emit('updateNote', updatedNote );
         
         
      });
      
      socket.on('deleteNote', function (data) {
	      var oid = data.oId;
	      if(notes[oid])
	      {
	      	delete notes[oid];
	        
	        noteCnt--;
	        
	      	// tell others about this
	      	socket.broadcast.emit('deleteNote', {oId: oid } );
	      }
	      
      });
       
     
   
  });
  
	
};