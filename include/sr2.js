
var view;

function View(){
	var self = view = this;
	
	//Window
	ko.computed(function(){
		document.title = "Shadow Reader"
	});
	
	//User
	self.api_key = "AIzaSyCIdzX6hDBMqZzabC0EGyEu4dS43FBOAIE";
	self.user_name = ko.observable("Please log in.");
	self.user_id = undefined;
	self.user_image = ko.observable();
	self.access_token = undefined;
	
	//Feeds
	self.feeds = ko.observableArray();
	self.activeFeed = ko.observable();
	self.loading = ko.observable(false);
	self.shownFeeds = ko.observable(0);
	
	self.visibleFeeds = ko.computed(function(){
		return self.feeds.slice(0,self.shownFeeds());
	});
	self.allowItem = function(){
		if(self.feeds().length>self.shownFeeds()){
			self.shownFeeds(self.shownFeeds()+1);
		}
	}
	self.slideIn = function(e){
		if(e.nodeType===1){
			window.getComputedStyle(e).opacity
			e.classList.add("onscreen");
		}
	}
}

function grabFeeds(){
	view.loading(true);
	var f = view.feeds().length;
	if(f!=0) f = view.feeds()[f-1].id;

	$.ajax("api/fetch.php?f="+f,{
		dataType:"json",
		success:function(result){
			for(var i in result){
				view.loading(false);
				view.feeds.push(new Item(result[i]));
			}
		}
	})
}
function Feed(){
	//Should contains each feed? Or at least the filter...
}
function Item(o){
	var self = this;
	self.id = o.id;
	self.feed = o.feed;
	self.link = o.link;
	self.subject = o.subject;
	self.date = o.date;
	self.content = o.content;
	self.unread = ko.observable(true);
	
	self.title = ko.computed(function(){
		return self.subject.length<100?self.subject:self.subject.slice(0,100)+"..."
	});
	self.firstload = true;
	
	self.expand = function(){
		if(view.activeFeed()==this)
			//if already active, deactivate.
			view.activeFeed(null)
		else {
			view.activeFeed(this);
			self.unread(false);
		}
	}
	self.open = ko.computed(function(){
		return self == view.activeFeed();
	});
	
	ko.computed(function(){
		self.unread()
		if(self.firstload) return self.firstload = false;
		
		$.post("api/read.php",{i:self.id,r:self.unread()},log);
    });
	
	self.contents = ko.computed(function(){
		if(self.open())
			return self.content;
		else return "";
	});
	
}
$(function(){
	ko.applyBindings(new View());
	setInterval(view.allowItem,20);
});
// Lazy console.log
function log(){
	console.log(arguments);
}

function nextItem(){
	//TODO unmessyashell this
	view.feeds()[view.feeds().indexOf(view.activeFeed())+1];
}

//google login
function signinCallback(status){
	//loadBox(l.signing);
	console.groupCollapsed("Login");
	$("#signinButton").fadeOut();
	view.access_token = status.access_token;
	view.user_name("Logging in...")
	$.ajax("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="+view.access_token,{
		dataType:"json",
		success:function(r){
			console.log("After Token",r);
			view.user_id = r.user_id;
			$.ajax("api/login.php",{
				type:"post",
				data:{"i":view.user_id,"t":view.access_token},
				success:function(){
					$.ajax("https://www.googleapis.com/plus/v1/people/"+view.user_id+"?key="+view.api_key,{
						dataType:"json",
						success:function(profile){
							log("Profile",arguments);
							view.user_name(profile.name.givenName + " " + profile.name.familyName);
							view.user_image(profile.image.url);
							console.groupEnd("Login");
							grabFeeds();
						}
					})
				}
			});
		},
		error:function(a){
			//loadBox("Error: Could not sign you in. Try refreshing the page.");
			console.log("FAILED LOGIN",a);
			console.groupEnd("Login");
		}
	});
}
/*
{
  "id_token": the user ID,
  "access_token": the access token,
  "expires_in": the validity of the tokens, in seconds,
  "error": The OAuth2 error type if problems occurred,
  "error_description": an error message if problems occurred
}
*/