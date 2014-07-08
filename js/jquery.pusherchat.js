/*
 * Pusher chat
 * facebook like chat jQuery plugin using Pusher API 
 * version: 1.0   
 * Author & support : zied.hosni.mail@gmail.com 
 * © 2012 html5-ninja.com
 * for more info please visit http://html5-ninja.com
 *
 *
 *          $.fn.pusherChat({
                'pusherKey': // required : open an account on http://pusher.com/ to get one
                'authPath':'server/pusher_auth.php', // required : path to authentication scripts more info at http://pusher.com/docs/authenticating_users
            'friendsList' : null, // required : path to friends list json 
            // json ex : 
            /*
                {
                    "133": ["Elvis","assets/elvis.jpg","http://html5-ninja.com"],
                    "244": ["Kurt Cobain","assets/cobain.jpg","http://html5-ninja.com"],
                }               
            'serverPath' : null, // required : path to server
            'profilePage' : false, // link to friend profile page setup fom json  ex : ["Kurt Cobain","assets/cobain.jpg","path/to/profile"]
            'debug' : false // enable the pusher debug mode  - don't use this in production
            });

*/
(function( $ ){

    $.fn.pusherChat = function(options ) {
        //options
        var settings = $.extend( {
            'pusherKey': null,   // required : open an account on http://pusher.com/ to get one
            'authPath' : null , // required : path to authentication scripts more info at http://pusher.com/docs/authenticating_users
            'friendsList' : null, // required : path to friends list json 
            // json ex : 
            /*
                {
                    "133": ["Elvis","assets/elvis.jpg","http://html5-ninja.com"],
                    "244": ["Kurt Cobain","assets/cobain.jpg","http://html5-ninja.com"],
                }               
         */
            'serverPath' : null, // required : path to server
            'profilePage' : false, // link to friend profile page setup fom json  ex : ["Kurt Cobain","assets/cobain.jpg","path/to/profile"]
            'onFriendConnect' : undefined, // event : trigger whene friend connect & return his ID
            'onFriendLogOut' : undefined, // event : trigger whene friend log out & return his ID
            'onSubscription' : undefined, // return  members object
            'debug' : false // enable the pusher debug mode  - don't use this in production
        }, options);
                
        if (settings.debug){
            Pusher.log = function(message) {
                if (window.console && window.console.log) window.console.log(message);
            };
            WEB_SOCKET_DEBUG = true;
        }        
        
        // int var 
        var pageTitle = $('title').html(); // just to update page title whene message is triggered
        
        // Authenticating users
        Pusher.channel_auth_endpoint = settings.authPath;
        // create pusher object
        var pusher = new Pusher(settings.pusherKey);
        // Accessing channels
        var presenceChannel = pusher.subscribe('presence-mychanel');
  
        // subscription succeeded
        presenceChannel.bind('pusher:subscription_succeeded', function(){ 
            memberUpdate(); 
        })
        // trigger friend connection
        presenceChannel.bind('pusher:member_added', function() {
            memberUpdate();
        });
        // trigger friend logout
        presenceChannel.bind('pusher:member_removed', function() {
            memberUpdate();
        });
    
    
        if (settings.onSubscription !== undefined) {
            presenceChannel.bind('pusher:subscription_succeeded', function(members){ 
                settings.onSubscription(members);
            })
        }
        
        if (settings.onFriendConnect !== undefined) {
            presenceChannel.bind('pusher:member_added', function(member) {                
                settings.onFriendConnect(member);
            });
        }
        
        if (settings.onFriendLogOut !== undefined) {
            presenceChannel.bind('pusher:member_removed', function(member) {                
                settings.onFriendLogOut(member);
            });
        }
        /*-----------------------------------------------------------*
         * Bind the 'send-event' & update the chat box message log
         *-----------------------------------------------------------*/ 
        presenceChannel.bind('send-event', function(data) { 
            if(presenceChannel.members.me.id == data.to && data.from != presenceChannel.members.me.id){
                var obj = $('a[href=#'+data.from+']');
                createChatBox(obj);
                var name = $('#id_'+data.from).find('h2').find('.userName').html();
                $('#id_'+data.from+' .msgTxt').append('<p class="friend"><b>'+name+'</b><br/>'+ data.message+'</p>');       
                $('#id_'+data.from).addClass('recive').removeClass('writing');
                $('#id_'+data.from+' .logMsg').scrollTop($('#id_'+data.from+' .logMsg')[0].scrollHeight);      
                if ($('title').text().search('New message - ')==-1)
                    $('title').prepend('New message - ');
                    $.playSound('sounds/new');
            }
            if (presenceChannel.members.me.id == data.from){
                $('#id_'+data.to+' .msgTxt').append('<p class="you"><b>You</b><br/>'+ data.message+'</p>');
                $('#id_'+data.to+' .logMsg').scrollTop($('#id_'+data.to+' .logMsg')[0].scrollHeight);
            }    
        });   
        
        /*-----------------------------------------------------------*
         * detect when a friend is typing a message
         *-----------------------------------------------------------*/         
        presenceChannel.bind('typing-event', function(data) {
            if(presenceChannel.members.me.id == data.to && data.from != presenceChannel.members.me.id && data.message=='true' ){
                $('#id_'+data.from).addClass('writing');
            }
            else   if(presenceChannel.members.me.id == data.to && data.from != presenceChannel.members.me.id && data.message=='null' ){
                $('#id_'+data.from).removeClass('writing');
            }
        });
        
        // trigger whene user stop typing 
        $('.pusherChatBox textarea').live('focusout',function(){
            if($(this).next().next().next().val()=='true'){
                var from = $(this).parents('form');
                $(this).next().next().next().val('null');
                $.post(settings.serverPath, from.serialize());
            }
        });
        
        
        /*-----------------------------------------------------------*
         * slide up & down friends list & chat boxes
         *-----------------------------------------------------------*/  
        $('#pusherChat #expand,.pusherChatBox .expand').live('click',function(){
            var obj = $(this);    
            obj.parent().find('.scroll,.slider').slideToggle('1', function() {
                if ($(this).is(':visible')){
                    obj.find('.close').show();
                    obj.find('.open').hide();
                }else {
                    obj.find('.close').hide();
                    obj.find('.open').show();
                }
            });    
            return false
        });

        // close chat box
        $('#pusherChat .closeBox').live('click',function(){
            $(this).parents('.pusherChatBox').hide();
            updateBoxPosition();
            return false;
        });
        
        // trigger click on friend & create chat box
        $('#pusherChat #members-list a').live('click',function(){
            var obj=$(this);
            createChatBox(obj);
            return false;
        });
        
        // some action whene click on chat box
        $('.pusherChatBox').live('click',function(){
            var newMessage = false;
            $(this).removeClass('recive');
            $('.pusherChatBox').each(function(){
                if ($(this).hasClass('recive')){
                    newMessage = true;
                    return false; 
                }       
            });  
            if (newMessage == false)
                $('title').text(pageTitle);
        });
        
        /*-----------------------------------------------------------*
         * memberUpdate() place & update friends list on client page 
         *-----------------------------------------------------------*/  
        function memberUpdate(){    
            $.getJSON(settings.friendsList, function(data) {                   
                var offlineUser = onlineUser ='' ;
                var chatBoxOnline ;
                $.each(data, function(user_id, val) {
                    if (user_id!=presenceChannel.members.me.id) {          
                        user = presenceChannel.members.get(user_id);
                        if (user ){
                            onlineUser +='<a href="#'+user_id+'" class="on"><img src="'+val[1]+'"/> <span>'+val[0]+'</span></a>';
                            chatBoxOnline ='on';
                        }else {
                            offlineUser +='<a href="#'+user_id+'" class="off"><img src="'+val[1]+'"/> <span>'+val[0]+'</span></a>'; 
                            chatBoxOnline ='off';
                        }              
                    }
                    $('#id_'+user_id).removeClass('off').removeClass('on').addClass(chatBoxOnline);
                });
                $('#pusherChat #members-list').append(onlineUser+offlineUser);    
            });
    
            $('#pusherChat #members-list').html('');   
            if(presenceChannel.members.count>0){
                $("#count").html(presenceChannel.members.count - 1);
            }
        }
        
        /*-----------------------------------------------------------*
         * create a chat box from the html template 
         *-----------------------------------------------------------*/        
        function createChatBox(obj){
            var name = obj.find('span').html();  
            var img = obj.find('img').attr('src');  
            var id = obj.attr('href').replace('#', 'id_');                     
            var off = clone ='';
            if (obj.hasClass('off')) off='off';
    
            if (!$('#'+id).html()){                 
                $('#templateChatBox .pusherChatBox h2 .userName').html(name);               
                $('#templateChatBox .pusherChatBox h2 img').attr('src',img);
                $('.chatBoxslide').prepend($('#templateChatBox .pusherChatBox').clone().attr('id',id));            
            }
            else if (!$('#'+id).is(':visible') ){
                clone = $('#'+id).clone();
                $('#'+id).remove();
                if(!$('.chatBoxslide .pusherChatBox:visible:first').html())
                    $('.chatBoxslide').prepend(clone.show());     
                else
                    $(clone.show()).insertBefore('.chatBoxslide .pusherChatBox:visible:first');
            }
            if (settings.profilePage){
                $.getJSON(settings.friendsList, function(data) { 
                    var profileUrl = data[obj.attr('href').replace('#', '')][2];
                    $('#'+id+' h2 a').attr('href',profileUrl);
                });
            }  
            $('#'+id+' textarea').focus();
            $('#'+id+' .from').val(presenceChannel.members.me.id);
            $('#'+id+' .to').val(obj.attr('href'));
            $('#'+id).addClass(off);
            updateBoxPosition();
            return false
        }

        /*-----------------------------------------------------------*
         * reorganize the chat box position on adding or removing
         *-----------------------------------------------------------*/  
        function updateBoxPosition(){
            var right=0;
            var slideLeft = false;
            $('.chatBoxslide .pusherChatBox:visible').each(function(){
                $(this).css({
                    'right':right
                });
        
                right += $(this).width()+20;
        
                $('.chatBoxslide').css({
                    'width':right
                });
        
                if ($(this).offset().left- 20<0){
                    $(this).addClass('overFlow');
                    slideLeft = true;
                }
                else
                    $(this).removeClass('overFlow');
    
    
            });          
            if(slideLeft) $('#slideLeft').show();
            else $('#slideLeft').hide();
    
            if($('.overFlowHide').html()) $('#slideRight').show();
            else $('#slideRight').hide();
        }

      
        $('#slideLeft').live('click',function(){
            $('.chatBoxslide .pusherChatBox:visible:first').addClass('overFlowHide');
            $('.chatBoxslide .pusherChatBox.overFlow').removeClass('overFlow');
            updateBoxPosition();
        });

        $('#slideRight').live('click',function(){
            $('.chatBoxslide .pusherChatBox.overFlowHide:last').removeClass('overFlowHide');
            updateBoxPosition();
        });
     
        /*-----------------------------------------------------------*
         * send message & typing event to server
         *-----------------------------------------------------------*/ 
        $(".pusherChatBox textarea").live('keypress',function(event) {    
            var from = $(this).parents('form');
            if ( event.which == 13 ) {                
                $(this).next().next().next().val('false');
                $.post(settings.serverPath, from.serialize());
                event.preventDefault();
                $(this).val('');
                $(this).focus();         
            }else if (!$(this).val() || ($(this).next().next().next().val()=='null' && $(this).val())){               
                $(this).next().next().next().val('true');
                $.post(settings.serverPath, from.serialize());        
            }
        });     
        
        
        /*-----------------------------------------------------------*
         * some css tricks
         *-----------------------------------------------------------*/ 
        $('#pusherChat .scroll').css({
            'max-height':$(window).height()-50
        })               

        $('#pusherChat .chatBoxWrap').css({
            'width':$(window).width() -  $('#membersContent').width()-30 
        })           

        $(window).resize(function(){
            $('#pusherChat .scroll').css({
                'max-height':$(window).height()-50
            });
    
            $('#pusherChat .chatBoxWrap').css({
                'width':$(window).width() -  $('#membersContent').width() -30
            }) 
            updateBoxPosition();
        });
        
    };
    
    
})( jQuery );

