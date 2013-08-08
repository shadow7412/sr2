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
	self.addFeed = function(id, title, url){
		if(self.feeds().filter(function(a){return id==a.id}).length==0)
			self.feeds.push(new Feed(arguments));
	}
	self.activeFeeds = ko.observableArray();
	self.activeFolder = ko.observable();
	self.activateFeed = function(feed){
		self.activeFeeds([feed.id])
		self.activeFolder(feed);
		forceRefresh();
	}
	//Items
	self.items = ko.observableArray(); //all cached items
	self.shownItems = ko.observable(0);
	self.activeItem = ko.observable();
	self.loading = ko.observable(false);
	
	self.visibleItems = ko.computed(function(){
		if(self.activeFeeds().length==0)
			return self.items.slice(0,self.shownItems());
		else { //we are limiting the items shown by feed(s)
			return self.items().filter(function(e){
				return self.activeFeeds().indexOf(e.feed) != -1;
			})
		}
	});
	self.allowItem = function(){
		if(self.visibleItems().length >= self.shownItems()){
			self.shownItems(self.shownItems()+1);
		}
	}
	self.slideIn = function(e){
		if(e.nodeType===1){
			//Refresh the DOM - causing the transition to happen
			window.getComputedStyle(e).opacity
			e.classList.add("onscreen");
		}
	}
	self.finished = ko.observable(false)
}

function grabFeeds(){
	view.loading(true);
	view.finished(false);
	var i = view.items().length;
	var f = "";
	// Grab the id of the most recently fetched feed.
	// We only want the entries after (or before) it.
	if(i!=0) i = view.items()[i-1].id;
	if(view.activeFeeds().length!=0)
		f = "&f[]=" + view.activeFeeds().join("&f[]=");
		
	$.ajax("api/fetch.php?i="+i+f,{
		dataType:"json",
		success:function(result){
			view.loading(false);
			for(var i in result.feeds){
				view.addFeed(i,result.feeds[i].title, "");
			}
			for(var i in result.items){
				view.items.push(new Item(result.items[i]));
			}
			if(!i) view.finished(true);
		}
	})
}
function forceRefresh(){
	view.items([]);
	view.shownItems(0);
	view.activeItem(null);
	grabFeeds();
}
function allRead(){
	//work out what we're limited to.
	view.loading(true);
	view.list=([]);
	$.post("api/read.php",{all:true},forceRefresh);
}
function Feed(o){
	//Should contains each feed? Or at least the filter...
	var self = this;
	
	self.id = o[0];
	self.title = o[1];
	self.url = o[2];
}
function Item(o){
	var self = this;
	self.id = o.id;
	self.feed = o.feed;
	self.title = ko.computed(function(){
		return view.feeds().filter(function(a){
			return a.id==self.feed;
		})[0].title;
	});
	self.link = o.link;
	self.subject = o.subject;
	self.date = o.date;
	self.content = o.content;
	self.link = o.link;
	self.unread = ko.observable(o.read != 1);
	
	self.subject_summary = ko.computed(function(){
		if(self.subject)
			return self.subject.length<100?self.subject:self.subject.slice(0,100)+"...";
	});
	self.firstload = true;
	
	self.expand = function(d,e){
		if(view.activeItem()==this)
			//if already active, deactivate.
			view.activeItem(null)
		else {
			view.activeItem(this);
			self.unread(false);
			e.target.scrollIntoView(true);
		}
	}
	self.open = ko.computed(function(){
		var show = self == view.activeItem();
		if(show) gapi.plusone.go();
		return show;
	});
	
	// Tell server if read status changes
	ko.computed(function(){
		self.unread()
		if(self.firstload) return self.firstload = false;
		
		$.post("api/read.php",{
			i:self.id,r:self.unread()
		},log);
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
					$.ajax("https://www.googleapis.com/plus/v1/people/"+view.user_id+"?key="+view.api_key, {
						dataType:"json",
						success:function(profile){
							log("Profile",arguments);
							view.user_name(profile.name.givenName + " " + profile.name.familyName);
							view.user_image(profile.image.url);
							console.groupEnd("Login");
							grabFeeds();
						},
						error:function(){
							console.log("FAILED PROFILE FETCH",arguments)
							console.groupEnd("Login");
						}
					})
				},
				error:function(){
					console.log("FAILED USER REGISTER",arguments)
					console.groupEnd("Login");
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

function next(){
	$('.item.onscreen [data-bind="html:contents"]:visible').parents(".item.onscreen").next().children(".title").click()
}
function previous(){
	$('.item.onscreen [data-bind="html:contents"]:visible').parents(".item.onscreen").prev().children(".title").click()
}

$(document).on("keydown",function(e){
	switch(e.keyCode){
		case 74: //j
			next();
			break;
		case 75: //k
			previous();
			break;
		default:
			console.log("You pressed: ",e.keyCode);
	}
})