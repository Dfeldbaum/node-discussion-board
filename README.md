Node Discussion Board
=====================

Simple real time discussion board &amp; chat written in Node.js, KineticJS, jQuery UI &amp; Backbone.

Inspired by [scrumblr](https://github.com/aliasaria/scrumblr) project. 
Dragging and dropping use HTML5 canvas with the help of KineticJS.
Notes can be dragged from desktop or mobile devices such as iPad.

<img width="600" src="http://ngo-hung.com/files/images/MyBoard.png">

- [Blog Link](http://www.ngo-hung.com/blog/2012/07/14/real-time-discussion-board-experiment)
- [Demo](http://ngo-hung.com/project/myboard)

To run the app, just type:

$ node app.js

and access 

<http://localhost:3000/board>

There are 2 mini-modules within the app:

1) Chat Module

2) Discussion Blackboard

Chat Module is built mainly with Backbone models and Socket.io.
Discussion Board notes are custom KineticJS Shapes which override the draw function.

There is no persistency in the app. All data are stored in memory. It should be easy to store it in Redis.
There is a limit on the maximum number of chat messages, clients or notes that can be created.

Important files:

- routes/index.js ==> Most of the logic for server side
- js/board/models.js ==> Chat Models
- js/board/board.js ==> Main Client Logic
- js/hhutil/widgets.js ==> Note Models
