var ros = new ROSLIB.Ros();

var defaultUrL = "";
var table = "";
var config_values = {};

//pub
var send_order_publisher;
var send_order_pub_topic = "send_order";
var send_order_pub_type = "simple_delivery_msgs/DeliveryOrder"

//sub
var delivery_status_sub_topic = "delivery_status";
var delivery_status_sub_type = "simple_delivery_msgs/DeliveryStatus";

// remapping rules setting
if(delivery_status_sub_topic in rocon_interactions.remappings)
  delivery_status_sub_topic = rocon_interactions.remappings[delivery_status_sub_topic];

if(send_order_pub_topic in rocon_interactions.remappings)
  send_order_pub_topic = rocon_interactions.remappings[send_order_pub_topic];


//parameter setting
if (rocon_interactions.hasOwnProperty('rosbridge_uri')){
    defaultUrL = rocon_interactions.rosbridge_uri;
}else{
    defaultUrL = 'localhost';
}
if (rocon_interactions.parameters.hasOwnProperty('extra_data')){
    table = rocon_interactions.parameters.extra_data;
}else{
    table = "table1";
}

config_values['table'] = table;

// public variable
// delivery_status_list = {
//10 : "IDLE",
//20 : "GO_TO_FRONTDESK",
//30 : "ARRIVAL_AT_FRONTDESK",
//40 : "WAITING_FOR_FRONTDESK",
//51 : "GO_TO_RECEIVER",
//52 : "ARRIVAL_AT_RECEIVER",
//53 : "WAITING_CONFIRM_RECEIVER",
//54 : "COMPLETE_DELIVERY",
//60 : "COMPLETE_ALL_DELIVERY",
//70 : "RETURN_TO_DOCK",
//80 : "COMPELTE_RETURN",
//-10 : "ERROR"

//menu item setting
var menu_list = {
                    "COKE":{"name":'COKE',
                     "disable_img":"./img/coke_disable.png",
                     "img_qty_1"   :"./img/coke.png",
                     "img_qty_2"   :"./img/coke_2.png",
                     "click_count" : 0},
                    "WELCHS":{"name":'WELCHS',
                     "disable_img" :"./img/welchs_disable.png",
                     "img_qty_1"    :"./img/welchs.png",
                     "img_qty_2"    :"./img/welchs_2.png",
                     "click_count" : 0},
                    }; 
/*
var menu_list = {
                    "cider":{"name":'cider',
                     "disable_img":"./img/cider.jpg",
                     "img_qty_1"   :"./img/cider.jpg",
                     "img_qty_2"   :"./img/cider.jpg",
                     "click_count" : 0},
                    "coke":{"name":'coke',
                     "disable_img"  :"./img/coke.jpg",
                     "img_qty_1"    :"./img/coke.jpg",
                     "img_qty_2"    :"./img/coke.jpg",
                     "click_count" : 0}
                  };
*/

//ui setting
var currentDiv = 0;
var divList = []
var img_path = "./img/"

//order setting
var id = "";
var cur_order_list = [];
var is_showing_modal = false;

$().ready(function(e){

  initDiv();
  initMenu();
  initEvent();

  // setting ros callbacks
  settingROSCallbacks();
  ros.connect(defaultUrL);
  $(".rosbridge-ip-info").html(defaultUrL);
  initConfig(config_values);

});

function initSlideShow(){
  console.log("slide show");
  $('.flexslider').flexslider({
        animation: "slide",
        slideshow: true,
        animationLoop: true,
        slideshowSpeed: 4000,
        animationSpeed: 1000,
        controlNav: false, 
        directionNav: false,

  });
  $('.flexslider').flexslider("Play");

}

function initEvent(){
  //set event
  // common
  $(".oa-ui-prev-btn").click(function(){
    prevDiv = currentDiv - 1;
    updateDiv(prevDiv);
  });

  $(".oa-ui-next-btn").click(function(){
    nextDiv = currentDiv + 1;
    updateDiv(nextDiv);
  });

  // title-layer
  $(".title-layer").click(function(){
    nextDiv = currentDiv + 1;
    updateDiv(nextDiv);
  });

  // intro-layer
  $(".intro-layer-img-button").mouseup(function(){
    console.log("mouse up");
    $(".intro-layer-img-button").attr('src','./img/2_intro_button_off.png');
    nextDiv = currentDiv + 1;
    updateDiv(nextDiv);
  });
  $(".intro-layer-img-button").mousedown(function(){
    console.log("mouse down");
    $(".intro-layer-img-button").attr('src','./img/2_intro_button_on.png');
  });

  //menu-layer

  $("img."+'cancel-img-btn').mouseup(function(){
    $("img."+'cancel-img-btn').attr('src','./img/3_order_button_cancel_off.png');
    nextDiv = currentDiv - 1;
    updateDiv(nextDiv);
  });
  $("img."+'cancel-img-btn').mousedown(function(){
    $("img."+'cancel-img-btn').attr('src','./img/3_order_button_cancel_on.png');
  });

  $("img."+'order-img-btn').mouseup(function(){
    $("img."+'order-img-btn').attr('src','./img/3_order_button_order_off.png');
    if (cur_order_list.length){
      nextDiv = currentDiv + 1;
      updateDiv(nextDiv);  
    }
    else{
      $("img."+'order-img-btn').attr('src','./img/3_order_button_order_disabled.png');
    }
    
  });
  $("img."+'order-img-btn').mousedown(function(){
    $("img."+'order-img-btn').attr('src','./img/3_order_button_order_on.png');
  });
 
  //modal
  $('#confirm-modal').on('hide', function () {
    console.log("modal hide");
    is_showing_modal = false;
  });

   $("img.yes-img-btn").mouseup(function(){
    $('img.yes-img-btn').attr('src','./img/4_modalbox_button_yes_off.png');
    sendOrder();
    nextDiv = currentDiv + 1;
    updateDiv(nextDiv);
  });
  $("img.yes-img-btn").mousedown(function(){
    $('img.yes-img-btn').attr('src','./img/4_modalbox_button_yes_on.png');
  });
  
  $("img.no-img-btn").mouseup(function(){
    $('img.no-img-btn').attr('src','./img/4_modalbox_button_no_off.png');
  });
  $("img.no-img-btn").mousedown(function(){
    $('img.no-img-btn').attr('src','./img/4_modalbox_button_no_on.png');
  });
}

function initDiv(){
  for (k = 0  ;k < $('.oa-ui').length ; k ++){
    class_list = $('.oa-ui')[k].classList;
    target_class_name = class_list[class_list.length - 1];
    $('.'+target_class_name).css("height",$( window ).height());
    $('.'+target_class_name).css("width",$( window ).width());

    $('.test-width').html($( window ).width());
    $('.test-height').html($( window ).height());
    
    divList.push($('.'+target_class_name))
  }
  updateDiv(currentDiv);
}

function initMenu(){
  //init menu layer
  $(".menu-layer-drink-img-group").html("");
  context = "";
  for (menu in menu_list){
    templete = '<img src='+ menu_list[menu].disable_img +' class="menu-layer-drink-img ' + menu_list[menu].name +'">'
    context += templete
  }
  $(".menu-layer-drink-img-group").html(context);

  $("img."+'cancel-img-btn').attr("src",'./img/3_order_button_cancel_disabled.png');
  $("img."+'order-img-btn').attr("src",'./img/3_order_button_order_disabled.png');

  cur_order_list = []

  //init menu layer event
  $(".menu-layer-drink-img").click(function(data){
    console.log(data.currentTarget.classList)
    class_name = data.currentTarget.classList[data.currentTarget.classList.length -1];
    img_src = $("img."+class_name).attr("src");
    console.log(class_name)

    var max_order_count = 2;
    if (cur_order_list.length > max_order_count -1 ){
      console.log()
      for (var i = cur_order_list.length - 1; i >= 0; i--) {
        idx = jQuery.inArray( class_name, cur_order_list)
        if (idx >= 0 ){
          cur_order_list.splice(idx,1);
          $("img."+class_name).attr("src",menu_list[class_name].disable_img);
          menu_list[class_name].click_count = 0;
        }  
      };
    }
    else{
      if(menu_list[class_name].click_count == 0){
        $("img."+class_name).attr("src", menu_list[class_name].img_qty_1);
        cur_order_list.push(class_name);
        menu_list[class_name].click_count = 1;
      }
      else if(menu_list[class_name].click_count == 1){
        $("img."+class_name).attr("src", menu_list[class_name].img_qty_2);
        cur_order_list.push(class_name);
        menu_list[class_name].click_count = 2;
      }
      else{
        $("img."+class_name).attr("src",menu_list[class_name].disable_img);
        idx = jQuery.inArray( class_name, cur_order_list)
        cur_order_list.splice(idx,1);
        cur_order_list.splice(idx,1);
        menu_list[class_name].click_count = 0;
      }
    }

    if( cur_order_list.length === 0){
      $("img."+'cancel-img-btn').attr("src",'./img/3_order_button_cancel_disabled.png');
      $("img."+'order-img-btn').attr("src",'./img/3_order_button_order_disabled.png');
    }
    else{
      $("img."+'cancel-img-btn').attr("src",'./img/3_order_button_cancel_off.png');
      $("img."+'order-img-btn').attr("src",'./img/3_order_button_order_off.png');
    }
  }); 
}

function updateDiv(target_div){
    $('.oa-ui').hide();
    div_flow=1;
    //refresh
    if(currentDiv === target_div){ 
      div_flow = 0;
      if (divList[currentDiv].selector.indexOf("on-delivery-layer") > 0){
        //post proc
        console.log("Play ad");
        initSlideShow();
        //$(".video-rocon-adv")[0].play();
        divList[target_div].show();
        currentDiv = target_div;
      }
      else{
        divList[target_div].show();
        currentDiv = target_div;  
      }
    }
    //back
    else if(currentDiv > target_div){
      div_flow = -1; 
      
      if (target_div < 0){
       target_div += divList.length;
      }

      if (divList[currentDiv].selector.indexOf("arrival-layer") > 0){
        console.log("Play ad");
        initSlideShow();
        //$(".video-rocon-adv")[0].play();
        divList[target_div].show();
        currentDiv = target_div;
      }

      if (divList[currentDiv].selector.indexOf("menu-layer") > 0){
        //post proc
        initMenu()
        divList[0].show();
        currentDiv = 0;
      }
      else{
        //$(".video-rocon-adv")[0].load();
        deliveryProgressControl(0);
        divList[target_div].show();
        currentDiv = target_div;  
      }
    }
    //forward
    else{ 
      div_flow = 1; 
      if (target_div >= divList.length){
        target_div -= divList.length;
      }
      
      if (divList[currentDiv].selector.indexOf("ordered-layer") > 0){
        //post proc
        console.log("Play ad");
        initSlideShow();
        //$(".video-rocon-adv")[0].play();
        deliveryProgressControl(1);
        divList[target_div].show();
        currentDiv = target_div;
      }
      else if (divList[currentDiv].selector.indexOf("menu-layer") > 0){
        //post proc
        if (is_showing_modal === true){
          is_showing_modal = false;
          divList[target_div].show();
          currentDiv = target_div;
          waittingUpdateDiv(3000);
        }
        else{
          is_showing_modal = true;
          showConfirmModal();
          divList[currentDiv].show();
        }
      }
      else if (divList[currentDiv].selector.indexOf("on-delivery-layer") > 0){
          //post proc
          waittingUpdateDiv(30000);
          divList[target_div].show();
          currentDiv = target_div;
      }
      else if (divList[currentDiv].selector.indexOf("arrival-layer") > 0){
          //post proc
          waittingUpdateDiv(3000);
          divList[target_div].show();
          currentDiv = target_div;
      }
      else if (divList[currentDiv].selector.indexOf("delivery-end-layer") > 0){
        //post proc
        initMenu();
        cur_order_list = [];

        divList[target_div].show();
        currentDiv = target_div;
      }
      else{
        //post proc
        console.log("none post proc")
        //$(".video-rocon-adv")[0].load();
        deliveryProgressControl(0);
        divList[target_div].show();
        currentDiv = target_div;
      }  
    }
}

function waittingUpdateDiv(timeout){
  setTimeout(function(){
    nextDiv = currentDiv + 1;
    updateDiv(nextDiv)
  },timeout);
}

var isBlank;
function doBlink(item){
  var visible = item.css("visibility")
  visible = visible.indexOf("visible") >= 0 ? "hidden" : "visible";
  item.css("visibility", visible);
}
function startBlink(item){
  isBlank = setInterval(function(){
    doBlink(item);
  },350);
}
function stopBlink(item){
  clearInterval(isBlank);
}

function deliveryProgressControl(video_src){
  if(video_src == 1){ //first step
    console.log("play 1: prepairing");
    $("img."+'on-delivery-layer-status-img').attr('src','./img/6_order status_ready.png');
    $("img."+'on-delivery-layer-status-img').show();
    startBlink($("img."+'on-delivery-layer-status-img'));
  }
  else if(video_src == 2){ //secend step
    console.log("play 2: delivery");
    $("img."+'on-delivery-layer-status-img').attr('src','./img/6_order status_delivery.png');
    $("img."+'on-delivery-layer-status-img').show();
    startBlink($("img."+'on-delivery-layer-status-img'));
  }
  else{ //all stop
    console.log("stop 1 and stop 2");
    $("img."+'on-delivery-layer-status-img').hide();
  }
}

function showConfirmModal(){
  console.log("showConfirmModal");
  $('.modal-drink-img-group').html("");
  
  context = '';
  for (var i = cur_order_list.length - 1; i >= 0; i--) {
    menu = cur_order_list[i];
    templete = '<img src='+ menu_list[menu].img_qty_1 +' class="modal-drink-img">';
    context += templete;
  };  
  console.log(context);
  $('.modal-drink-img-group').html(context);
  $('#confirm-modal').modal('show');
}

function sendOrder(){
  console.log("send_order: ", cur_order_list);
  id = uuid()
  //hardcoded
  var order = new ROSLIB.Message({
    order_id : id,
    receivers : [{location: config_values['table']+"", qty : 1, menus:cur_order_list}]
  });
  send_order_publisher.publish(order)
  console.log("order: ",order, send_order_publisher)
}

function settingROSCallbacks(){
  ros.on('connection',function() {
    console.log("Connected");
    $(".rosbridge-connection-info").html("Connection");
    // subscribe to order list    
    var delivery_status_listener = new ROSLIB.Topic({
      ros : ros,
      name : delivery_status_sub_topic,
      messageType: delivery_status_sub_type
      });
    delivery_status_listener.subscribe(processDeliveryStatusUpdate);

    //setting publisher
    send_order_publisher = new ROSLIB.Topic({
        ros : ros,
        name : send_order_pub_topic,
        messageType : send_order_pub_type
    });
  }

  );
  ros.on('error',function(e) {
    console.log("Error!",e);
    $(".rosbridge-connection-info").html("Error: "+ e);
  }
  );

  ros.on('close',function() {
    console.log("Connection Close!");
    $(".rosbridge-connection-info").html("Connection Close!");
    //alert("ROS Connection Close!");
  }
  );
};

current_order_status = 10
function processDeliveryStatusUpdate(data){
  console.log(data);
  if (data.order_id == id) {
    if(current_order_status != data.status){
      current_order_status = data.status;
      if (current_order_status.status >= 20 && current_order_status <= 40){
        deliveryProgressControl(1); 
      }
      else if(current_order_status == 51){
        deliveryProgressControl(2);
      }
      else if(current_order_status == 53){
        nextDiv = currentDiv + 1;
        updateDiv(nextDiv);
      }
      else if(current_order_status == 60){
        nextDiv = currentDiv + 1;
        updateDiv(nextDiv);
      }
    }
    else{
      console.log("same order status");
    }
  }
  else{
    console.log(id)
    console.log(data.uuid)
    console.log('other delivery status')
  }
};
