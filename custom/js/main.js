// All Global Variable
var draw;
var flagIsDrawingOn = false;
var PointType = ['ATM','Tree','Telephone','Electricity Poles'];
var LineType = ['National Highway','State Highway','River','Telephone Lines'];
var PolygonType = ['Water Body','Commercial Land','Residential Land','Building'];
var selectedGeomType;
// custom control

// Define the namespace for the appliction

window.app = {};
var app = window.app;

// Define rotate to north control

/** 
 * @constructor
 * @extends {ol.control.Control}
 * @param {object=} opt_option Control options.

*/
app.DrawingApp = function (opt_option) {
  var options = opt_option || {};

  var button = document.createElement("button");
  button.id = 'drawbtn'
  button.innerHTML = '<i class="fa-solid fa-pen-ruler"></i>';
  // button.innerHTML ='N';

  var this_ = this;
  var StartStopApp = function () {
    if (flagIsDrawingOn == false) {
      $("#StartDrawModal").modal("show");
    //   document.getElementById('drawbtn').innerHTML = '<i class="fa-solid fa-circle-stop"></i>';
    } else {
        map.removeInteraction(draw)
        flagIsDrawingOn = false
        document.getElementById('drawbtn').innerHTML = '<i class="fa-solid fa-pen-ruler"></i>';
        defineTypeofFeature()
        $('#enterInformationModal').modal('show');
    }
  };

  button.addEventListener("click", StartStopApp, false);
  button.addEventListener("touchstart", StartStopApp, false);

  var element = document.createElement("div");
  element.className = "draw-app ol.unselectable ol-control";
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target,
  });
};
ol.inherits(app.DrawingApp, ol.control.Control);

// View

var myview = new ol.View({
  center: [8804023.258278675, 2410251.558721957],
  zoom: 13,
});

// OSM Layer
var baseLayer = new ol.layer.Tile({
  source: new ol.source.OSM({
    attributions: "Survey Application On OSM",
  }),
});

// Draw Vector Layer
// 1. Define source
var drawSource = new ol.source.Vector({});

// 2. Define Layer
var drawLayer = new ol.layer.Vector({
  source: drawSource,
});

//Layer Array
var layerArray = [baseLayer, drawLayer];
// Map
var map = new ol.Map({
  controls: ol.control
    .defaults({
      attributions: {
        collapsible: false,
      },
    })
    .extend([new app.DrawingApp()]),
  target: "mymap",
  view: myview,
  layers: layerArray,
});

// Function to start Drawing
function startDraw(geomType) {
  // console.log(geomType)
  // draw = geomType
  // console.log(draw)
  selectedGeomType = geomType;
  draw = new ol.interaction.Draw({
    type: geomType,
    source: drawSource,
  });
  $("#StartDrawModal").modal("hide");
  // drawSource.clear();
  map.addInteraction(draw);
  flagIsDrawingOn = true
  document.getElementById('drawbtn').innerHTML = '<i class="fa-solid fa-circle-stop"></i>';
}


// Function to add types based on feature
function defineTypeofFeature(){
    var dropdowntype = document.getElementById('typeofFeatures');
    dropdowntype.innerHTML = ''
    if(selectedGeomType == 'Point'){
        for(i=0;i<PointType.length;i++){
            var op = document.createElement('option')
            op.value = PointType[i]
            op.innerHTML = PointType[i]
            dropdowntype.appendChild(op)
        }
    }else if(selectedGeomType == 'LineString'){
        for(i=0;i<LineType.length;i++){
            var op = document.createElement('option')
            op.value = LineType[i]
            op.innerHTML = LineType[i]
            dropdowntype.appendChild(op)
        }
    }else{
        for(i=0;i<PolygonType.length;i++){
            var op = document.createElement('option')
            op.value = PolygonType[i]
            op.innerHTML = PolygonType[i]
            dropdowntype.appendChild(op)
        }
    }
}

// Function to save information in db
function savetodb(){
    // get array of all features
    var featureArray = drawSource.getFeatures()
    // Define geojson format
    var geogJSONformat = new ol.format.GeoJSON()
    // Use method to convert feature to geojson
    var featuresGeojson = geogJSONformat.writeFeaturesObject(featureArray)
    // Array of all geojson
    var geojsonFeatureArray = featuresGeojson.features

    for (i=0;i<geojsonFeatureArray.length;i++){
      // console.log(geojsonFeatureArray[i].geometry)
      var type = document.getElementById('typeofFeatures').value
      var name = document.getElementById('exampleInputtext1').value
      var geom = JSON.stringify(geojsonFeatureArray[i].geometry)
      if(type != ''){
        $.ajax({
          url:'save.php',
          type:'POST',
          data:{
            typeofgeom : type,
            nameofgeom : name,
            stringofgeom : geom
          },
          success : function(dataResult){
            var result = JSON.parse(dataResult)
            // status code 200 > successfully
            // status code 403 > request is forbidden
            // status code 404 > requested file/url not found
            console.log(result)
            if(result.statusCode == 200){
              console.log('data added successfully')
            }else{
              console.log('data not added successfully')
            }
          }
        })
      }else{
        alert('please select type')
      }
    }
  // Close the Modal 
  $("#enterInformationModal").modal('hide')
  clearDrawSource()

}


function clearDrawSource(){
  drawSource.clear()
}






  // Geolocation 
  // set up geolocation to track our position
  var geolocation = new ol.Geolocation({
    tracking: true,
    projection : map.getView().getProjection(),
    enableHighAccuracy: true,
  });
  // bind it to the view's projection and update the view as we move
  // geolocation.bindTo('projection', myview);
  geolocation.on('change:position', function() {
    myview.setCenter(geolocation.getPosition());
    addmarker(geolocation.getPosition())
  });
  // add a marker to display the current location
  var marker = new ol.Overlay({
    element: document.getElementById('currentLocation'),
    positioning: 'center-center',
    // position:  geolocation
  });
  map.addOverlay(marker);
  // and bind it to the geolocation's position updates

  function addmarker(array){
  marker.setPosition(array);
  // myview.setZoom(16)
   }

  // create a new device orientation object set to track the device
  var deviceOrientation = new ol.DeviceOrientation({
    tracking: true
  });
  // when the device changes heading, rotate the view so that
  // 'up' on the device points the direction we are facing
  deviceOrientation.on('change:heading', onChangeHeading);
  function onChangeHeading(event) {
    var heading = event.target.getHeading();
    view.setRotation(-heading);
  }

















// to get the array of data into the GeoJSON format we need to follow the above steps 
// drawSource.getFeatures()
// (6) [Hk, Hk, Hk, Hk, Hk, Hk]0:
// var geogJSONformat = new ol.format.GeoJSON()
// undefined
// geogJSONformat.writeFeaturesObject(drawSource.getFeatures())
// {type: 'FeatureCollection', features: Array(6)}
// var featuresGeojson = geogJSONformat.writeFeaturesObject(drawSource.getFeatures())
// undefined
// featuresGeojson
// {type: 'FeatureCollection', features: Array(6)}
// featuresGeojson.features[0]
// {type: 'Feature', geometry: {…}, properties: null}geometry: coordinates: (2) [8805201.691825021, 2409408.592762616]0: 8805201.6918250211: 2409408.592762616length: 
// featuresGeojson.features[0].geometry
// {type: 'Point', coordinates: Array(2)}