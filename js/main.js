/*
ko.bindingHandlers.googlemap = {
    init: function (element, valueAccessor) {
        var
          value = valueAccessor(),
          latLng = new google.maps.LatLng(value.latitude, value.longitude),
          mapOptions = {
            zoom: 10,
            center: latLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
            },
          map = new google.maps.Map(element, mapOptions),
          marker = new google.maps.Marker({
            position: latLng,
            map: map
          });
    }
};
*/

function ViewModel() {
    var self=this;
    this.name=ko.observable();
    this.map=ko.observable();
    this.markers = [];
       // TODO: use a constructor to create a new map JS object. You can use the coordinates
       // we used, 40.7413549, -73.99802439999996 or your own!
    this.type=ko.observable();
    this.image=ko.observable("problem.jpg");
    
    this.types=ko.observableArray(['Park', 'Home', 'Company','Restaurant', 'Others']);
    this.local=ko.observable({latitude: 37.4191334, longitude: -121.896173315});
	  this.street= ko.observable();
    this.city= ko.observable();
    this.states= ko.observableArray(['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
            'Delaware', 'Florida', 'Georgia' ,'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
            'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
            'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 
            'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
            'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']);
    this.state= ko.observable();
    this.zipcode= ko.observable();
    this.remember= ko.observable(false);
    this.fulladdr= ko.computed(function() {
        return this.street()+"+"+this.city()+"+"+this.state()+"+"+this.zipcode();
    }, this);
    this.valid= ko.pureComputed(function() {
        return this.name()&&this.type()&&this.street() ?  undefined : 'disabled';
    },this);
    var bound;
    this.placeArray=ko.observableArray([
        {latlng : { lat: 37.4158559, lng: -121.8975733 },
         location : "447 Great Mall Dr+Milpitas+California+95035",
         type : "Others",
         name : "Shihlin Taiwan Street Snacks",
         remember : false},
        {latlng : { lat: 37.4176568 , lng: -121.9016895 } ,
         location : "62 Sun Song+Milpitas+California+95035",
         type : "Home",
         name : "Alan's Home",
         remember : false}
         ]);
    this.gasArray=ko.observableArray();


    var infowindow;
    
    this.f_new_place=ko.observable(false);
    this.f_findPlace=ko.observable(false);
    this.f_big_map=ko.pureComputed(function(){
        return !(this.f_new_place()||this.f_findPlace());
    }, this);
    this.f_small_map=ko.pureComputed(function(){
        return (this.f_new_place()&&this.f_findPlace());
    }, this);

    $(".close").on("click", function(){
        $(this).parent().addClass("noshow");
        
        if($(this).parent().attr("id")==="info"){
            self.f_findPlace(false);
        }else{
            self.f_new_place(false);
        };
        if(self.f_small_map()===false){
            $("#map_wrapper").removeClass("tinymap");
        };
        if(self.f_big_map()===true){
            $("#map_wrapper").removeClass("smallmap");
        };
        
        self.initMap();
    });
    $("#find").on("click", function(){
         $("#info").removeClass("noshow");
         self.f_findPlace(true);
         if(self.f_big_map()===false){
            var add="smallmap";
            if(self.f_small_map()===true){
              add="tinymap";
            };
            $("#map_wrapper").addClass(add);
         };
    });
    $("#add").on("click", function(){
         $("#getaddr").removeClass("noshow");
         self.f_new_place(true);
         if(self.f_big_map()===false){
            var add="smallmap";
            if(self.f_small_map()===true){
              add="tinymap";
            };
            $("#map_wrapper").addClass(add);
         };
         self.initMap();
    });
    var gmarkers=[];

    function renderComments(latlng){
      //console.log(latlng.lat());

      $.ajax({
        crossDomain : true,
        dataType : 'json',
        method : 'GET',
        url : 'https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=gas&latitude='+latlng.lat()+'&longitude='+latlng.lng()+'&categories=servicestations&sort_by=distance&limit=25',
        headers : {
        'authorization': 'Bearer IyepryQA29OGHKN0Hyw2aLBVg0rYRlsc-Fqxz2DYBtjRhP4mv8nT_4bjIybvOr3A6p8oNcGESXPGsygBBQmVB24X3ZHmD0XzJNJSxULgJNeKP5igN20QtU99cK5eWXYx'
        },
        success: function( response ){
          var gbound = new google.maps.LatLngBounds();
          gbound.extend({lat: latlng.lat(), lng: latlng.lng()});

          for(var i=0;i<gmarkers.length;i++){
            gmarkers[i].setMap(null);
          }
          var i=0;
          var j=0;

          while(i<3&&j<20){
            j++;
            //self.gasArray.push(response.businesses[i]);
            var markerlatlng = {lat: response.businesses[j].coordinates.latitude, 
                                lng: response.businesses[j].coordinates.longitude};
            console.log(response.businesses[j]);

            if (!(markerlatlng.lat&&markerlatlng.lng))
                continue;           
            var cata="";
            
            for (var k=0;k<response.businesses[j].categories.length;k++ ){
              if(response.businesses[j].categories[k].title==="Gas Stations"){
                cata="Gas Stations";
                break;
              }
            };
            if (cata!="Gas Stations")
              continue;            
              
            $('#gas_title'+i).replaceWith('<h4 id="gas_title'+ i +'">'+response.businesses[j].name+'</h4>')
            $('#gas_img'+i).replaceWith('<img id="gas_img'+ i +'" src="'+response.businesses[j].image_url+'" width="200px" meters away</img>')
            $('#gas_distance'+i).replaceWith('<p id="gas_distance'+ i +'">'+response.businesses[j].distance+' meters away</p>')
              
              var title = response.businesses[j].name;
              var type = "Gas Station";
              //create and push the marker
              var marker = new google.maps.Marker({
                  position: markerlatlng,
                  map: self.map,
                  title: title,
                  type: type,
                  animation: google.maps.Animation.DROP,
                  icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
              });
              gmarkers.push(marker);
              // make the marker within bound
              gbound.extend(marker.position);
              // Set infowindow
              var infowindow = new google.maps.InfoWindow();
              marker.addListener("click", function(){
                  popInfowindowg(this, infowindow);
              });
              i++;
          };
          self.map.fitBounds(gbound);

      }});
      }; 
/*
      $.ajaxSetup(
        {
          "async" : true,
          "headers" : {
          "Authorization" :  "Bearer IyepryQA29OGHKN0Hyw2aLBVg0rYRlsc-Fqxz2DYBtjRhP4mv8nT_4bjIybvOr3A6p8oNcGESXPGsygBBQmVB24X3ZHmD0XzJNJSxULgJNeKP5igN20QtU99cK5eWXYx"
        }
      })
      $.ajax({
        type: "GET",
        dataType :"json",
        url: url
              }).done(function(data){
        console.log(data);
      });
*/ 
    function popInfowindowg(marker, infowindow){
            if (infowindow.marker != marker) {
              infowindow.marker = marker;
              infowindow.setContent('<div width="100px">' + marker.title + '</div>'+'<div width="100px">'+ marker.type+'</div>');
              infowindow.open(map, marker);
              // Make sure the marker property is cleared if the infowindow is closed.
              infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
                //infowindow.marker.setMap(null);
              }); 

            }
    };
    function popInfowindow(marker, infowindow){
        if (infowindow.marker != marker) {
          infowindow.marker = marker;
          infowindow.setContent('<div width="100px">' + marker.title + '</div>'+'<div width="100px">'+ marker.type+'</div>');
          infowindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
            //self.gasArray=ko.observableArray(null);
          }); 

        }
    };

    this.initMap= function initMap() {
        // Constructor creates a new map
        this.map = new google.maps.Map(document.getElementById('map'), {
          center: self.placeArray()[0].latlng, //{lat: 40.7413549, lng: -73.9980244},
          zoom: 14
        });
        self.bound = new google.maps.LatLngBounds();

                //loop over placeArray and set markers
        for(var i=0; i<Object.keys(self.placeArray()).length;i++){
            var markerlatlng = self.placeArray()[i].latlng;
            var title = self.placeArray()[i].name;
            var type = self.placeArray()[i].type;
            //create and push the marker
            var marker = new google.maps.Marker({
                position: markerlatlng,
                map: self.map,
                title: title,
                type: type,
                animation: google.maps.Animation.DROP
            });
            self.markers.push(marker);
            // make the marker within bound
            self.bound.extend(marker.position);
            // Set infowindow
            self.infowindow = new google.maps.InfoWindow();
            marker.addListener("click", function(){
                renderComments(this.position);

                popInfowindow(this, self.infowindow);
            });
        };

        self.map.fitBounds(self.bound);
        google.maps.event.addListenerOnce(self.map, 'bounds_changed', function(event) {
            if (this.getZoom() > 15) {
                this.setZoom(14);
            };
        });
    };
    
    this.processing = function() {
        
    }
    this.load = function loadData(fulladdr) {
        var address = self.fulladdr();
        address = address.split(' ').join('+');
        var locationurl="https://maps.googleapis.com/maps/api/geocode/json?address="+address+"&key=AIzaSyDsNP2t-xraE6Nn-rCuTM4SuF9zAPyXXjg";
        var addNewlocation=$.getJSON(locationurl, function(data){
            var latlng=data.results[0].geometry.location;

            var place={
                name : self.name(),
                type : self.type(),
                location : self.fulladdr(),
                latlng: latlng,
                remember : self.remember()
              };
            self.placeArray.push(place);

            //console.log(self.place);
            self.initMap();
          
        });
        
        console.log("success");
        
        
        console.log(self.placeArray());
        return false;
    };
};
/*
var yelp_call=function(){
  $.ajax({
            type : 'POST',
            url : 'https://api.yelp.com/oauth2/token',
            dataType :'application/json',
            data : {
              grant_type : "client_credentials",
              client_id : "ZNxD5HfCBsAnw2sYjs6QHw",
              client_secret : "01DifFhVwFGoKyuFcOrQH3ulF5hN5ojROFKiXowZpsHC99mWeOPtLUJVjmhQNPB6"
            },

          }).success(function(result){console.log(result);});
}
*/


var vm = new ViewModel()
ko.applyBindings(vm);
    


