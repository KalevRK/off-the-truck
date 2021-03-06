//Map controller

angular.module('offTheTruck.mapCtrl', [])

.controller('mapCtrl', ['$scope', '$firebaseObject', 'Map', function($scope, $firebaseObject, Map){

  //We are storing the lat / long data in firebase, so we need reference to our firebase:
  var ref = new Firebase("https://offthetruck.firebaseio.com/Trucks");
     
  //This is how you create a new Google map
  var map = Map.getMap();

  //Gives our views access to the map data
  $scope.map = map;

  //These little windows pop up when a user clicks on the map icon on the map
  $scope.truckInfo = function(marker, message){
    Map.populateTruckInfo(marker, message);
  };

  /*This storage object keeps track of the trucks that should be on the map. This is an object
  that sits client side and is updated whenever Firebase is updated.*/
  var markerStorage = {};

  //The cute trucks we drop on the map instead of the standard Google marker
  var markerImg = './img/truckMarker100x116.png';

  /*This 'once' code initializes the map to show the trucks that are active and selling when the client
  first logs in.*/
  ref.once('value', function(snapshot){
    var data = snapshot.val();
    //loops through all objects in firebase to see which ones are active ('isSelling === true')
    for(var key in data){
      if(data[key].isServing){
        //Creates a new truckMarker and puts it on the map at the right location
        var truckMarker = new google.maps.Marker({
          position: new google.maps.LatLng(data[key].lat, data[key].long),
          map: map,
          animation: google.maps.Animation.DROP,
          title: data[key].truckname,
          icon: new google.maps.MarkerImage( markerImg, undefined, undefined, undefined, new google.maps.Size(35, 41))
        });

        /*Adds the Truck name to the pin, so when a user clicks it, they can see the truck name on the map
        Function is defined below.*/
        $scope.truckInfo(truckMarker, data[key].truckname);

        //Save the marker to the local storage on each client instance
        markerStorage[data[key].truckname] = truckMarker;
      }
    }
  });

  //A listener, to see if there are any changes to isServing
  ref.on('child_changed', function(changedObj){
    var data = changedObj.val();
    //Checks to see if the trucks is actively serving
    if(data.isServing){
      //Checks to see if it's already on the map and already in local client storage
      if(markerStorage[data.truckname]){
        //In this case, then, the only thing possible is the active truck changed positions.
        //Here we set it locally
        var position = new google.maps.LatLng(data.lat, data.long);
        //and then update our local storage using Google Marker's methods. This places it on the map.
        //This only takes a very specific data type, which is defined in 'var position' above
        markerStorage[data.truckname].setPosition(position);
      } else {
        //Otherwise we know that the Truck is serving but is not yet on our map. So we create a new marker:
        var truckMarker = new google.maps.Marker({
          position: new google.maps.LatLng(data.lat, data.long),
          map: map,
          animation: google.maps.Animation.DROP,
          title: data.truckname,
          icon: markerImg
        });
        //...and then add that marker to our local storage, which has the effect of adding it the map (see below)
        $scope.truckInfo(truckMarker, data.truckname);
        markerStorage[data.truckname] = truckMarker;
      }
    } else {
      //Otherwise we know that the truck is no longer serving and needs to be removed from our map
      if(markerStorage[data.truckname]){
        markerStorage[data.truckname].setMap(null);
        delete markerStorage[data.truckname];
      }
    }
  });

}]);
