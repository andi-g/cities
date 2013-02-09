/*
 * This animation shows where the biggest cities existed over time. 
 * Some really big cities, like Mexico City, are not shown because at the time
 * that they became big, they were not the biggest.
 * It shows that all the biggest cities in their time were in a narrow strip
 * of latitude coordinates, which had the best climate for farming to be able
 * to support such a large, concentrated population.
 * Author: Andreas Gros http://andreasgros.net
 */

//
// for the map
var width = 921,
    height = 450,
    centered;
//
// minimum and maximum longitude of cities currently shown
var mxmax = 0, mxmin = width;

//
// time line slider dimensions
var sliderwidth = 460, 
	sliderheight = 10,
	sliderpos = 0,
	sliderareaheight = 52,
	sliderareawidth = 560;

var sliderxoffset = 20,
	slideryoffset = 7;

var sliderpointwidth = 20,
	sliderpointheight = 20;

//
// city info
var timediv = d3.select("#yeardiv");
var namediv = d3.select("#namediv");
var popdiv = d3.select("#popdiv");

//
// setting up the slider
var drag = d3.behavior.drag()
    .origin(Object)
    .on("drag", dragmove)
	.on("dragend", updatesliderpoint);

var slider = d3.select("#slider").append("svg")
	.attr("width", sliderareawidth)
	.attr("height", sliderareaheight);

slider.append( "rect" )
	.attr( "class", "background" )
	.attr("width", sliderwidth)
	.attr("height", sliderareaheight);

var pline = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("linear");

var plinepoints = [ { "x" :  0, "y" :  0 }, 
   					{ "x" :  0, "y" : 16 },
					{ "x" : 10, "y" :  8 }	];

var play = slider.append( "path" )
	.attr("d", pline(plinepoints) + " Z")
	.attr("class", "playbuttonpassive")
	.attr("transform", "translate(" + ( sliderareawidth - 45 ) + ", 0)" )
	.on( "click", clickPlay );

var pauselinepointsA = [ { "x" :  2, "y" :  0 },
						 { "x" :  2, "y" : 16 } ];

var pauselinepointsB = [ { "x" :  8, "y" : 0 },
						 { "x" :  8, "y" : 16 }];

slider.append( "rect" )
	.attr( "class", "pausebuttonbackground" )
	.attr( "width", 10 )
	.attr( "height", 16 )
	.attr( "transform", "translate(" + ( sliderareawidth - 29 ) + ", 0)")
	.on( "click", clickPause );

var pauseA = slider.append( "path" )
	.attr("d", pline(pauselinepointsA) )
	.attr("class", "pausebuttonforeground")
	.attr("transform", "translate(" + ( sliderareawidth - 29 ) + ", 0)" )

var pauseB = slider.append( "path" )
	.attr("d", pline(pauselinepointsB) )
	.attr("class", "pausebuttonforeground")
	.attr("transform", "translate(" + ( sliderareawidth - 29 ) + ", 0)" )

slider.append( "rect" )
	.attr( "class", "sliderbar" )
	.attr( "width", sliderwidth )
	.attr( "height", 5 )
	.attr( "x", sliderxoffset )
	.attr( "y", slideryoffset );

var sliderpoint = slider.append("rect")
	.attr( "class", "sliderpointrect" )
	.attr( "width", sliderpointwidth )
	.attr( "height", sliderpointheight )
	.attr( "y", "-2")
	.attr( "x", "0" )
	.attr( "transform", "translate( " + sliderxoffset +  ", 8)")
	.call(drag);

//
// the map projection
var projection = d3.geo.mercator()
    .scale(width)
    .translate([0, 0]);
 
var path = d3.geo.path()
    .projection(projection);
 
//
// set up of the map
var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", click);
 
var g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
  .append("g")
    .attr("id", "states");
 
// 
// house keeping for the animations	
var paused = false;
var allyears = new Array();
var citydata = new Array();
var numyears = 0;
var maxYear = -5000;
var minYear = 2030;
var lastYear = minYear;
var currentYearIndex = 0;
var plottedCities = {};
var citiesByYear = {};
var citytimeline = new Array();
var citiesbyid = new Array();



//
//loading the json data
function load(){
queue()
    .defer(d3.json, "./data/countries.json")
    .defer(d3.tsv, "./data/greatest_cities.tsv")
    .await(ready);
}

//
//deferred loading
function ready(error, countries, citysizes)
{
  g.selectAll("path")
      .data(countries.features)
    .enter().append("path")
      .attr("d", path);

  	var citydict = {};
	var cnt = 0;
	citysizes.forEach(function(d) { 
	   var year = parseInt( d.year );
	   if( year < minYear ){
	   		minYear = year;
	   }
	   if( year > maxYear ){
	   	 maxYear = year;
	   }
	   var id = cnt;
	   if( citydict[ d.city ] !== undefined ){
	   		id = citydict[ d.city ];
	   } else {
	   		citydict[ d.city ] = id;
	   } 
	   citiesByYear[year] = { "name" : d.city, "coordinates" : projection([ parseFloat(d.lon), parseFloat(d.lat) ]), "size" : parseInt(d.size), "year" : year, "id" : citydict[ d.city ] };
	   allyears.push(year);
	   cnt++;
   });
	numyears = allyears.length;
	lastYear = allyears[ 0 ];
    currentYearIndex = 0;

	var timelineyears = new Array();
	var numyearstoshow = 10;
	timelineyears.push( minYear );
	var yearinterval = (maxYear - minYear) / ( numyearstoshow );
	for ( var i = 1; i < numyearstoshow; i++ ){
		timelineyears.push( Math.floor( minYear + yearinterval * i ) );
	}
	timelineyears.push( maxYear );

	slider.selectAll( "text" ).data( timelineyears ).enter().append("text")
		.attr( "class", "timelineyear" )
		.attr("text-anchor", "middle")
		.text( function( d ) { return d; } )
		.attr("x", function( d ) { return  sliderxoffset + ( sliderwidth ) * ( d - minYear ) / ( maxYear - minYear );  })
		.attr("y", "38");


}

//
// update the play/pause button next to the timeline slider
function setButtonsToPlay( isplaying ){
	if( isplaying ) {
		play.attr( "class", "playbuttonpassive" );
		pauseA.attr( "class", "pausebuttonforeground" );
		pauseB.attr( "class", "pausebuttonforeground" );
	} else {
		play.attr( "class", "playbutton" );
		pauseA.attr( "class", "pausebuttonforegroundpassive" );
		pauseB.attr( "class", "pausebuttonforegroundpassive" );
	}
}

//
// the play button has been clicked
function clickPlay(){
	setPaused( false );
}

//
// the pause button has been clicked
function clickPause(){
	setPaused( true );
}

//
// set the animation on pause
function setPaused( pause ){
	if( pause != paused ){
		togglePaused();
	}
}

//
// an action caused a play/pause event
function togglePaused(){
	paused = paused ? false : true;
	if (!paused) {
		setButtonsToPlay( true );
		if( currentYearIndex >= numyears - 1 ){
			currentYearIndex = -1;
			lastYear = minYear;
			showCitiesUntil( minYear );

		}
	} else {
		setButtonsToPlay( false );
	}
}

//
// show city info in the upper left table
function fillCityInfo( city ){
	namediv.text( city.name );
	popdiv.text( city.size );
	timediv.text( city.year );
}

//
// perform all the action needed to stop the animation and show the city info
function displayCityInfo( city ){
	setPaused( true );
	fillCityInfo( city );
	updatesliderpos( city.year, minYear, maxYear );
}

//
// somebody clicked on a city circle
function circleClick( city ){
	d3.selectAll( "circle" ).attr( "class", "oldcity" );
	d3.select(this).attr( "class", "city" );
	displayCityInfo( city );
}

//
// the animation loop
setInterval(function() {
 	if ( !paused ) {
		if( currentYearIndex < numyears ) {  
		   	next( );
		   	updatesliderpos( lastYear < maxYear ? lastYear : maxYear, minYear, maxYear );
		   	redraw();
	 	} else {
			zoomOut();
			setPaused( true );
	 	}
  	}
 }, 2000);

//
// put cities on the SVG map
function addCitiesToMap(){
	//
	// this is a weird construction
	// to make sure the last city is colored red
	// after dragging around the time slider
	var len = citytimeline.length;
	if( len > 1 ){
		var city = citytimeline[ len - 1 ];
		citytimeline.splice( len - 1, 1);
		redraw();
		citytimeline.push( city );
	}
	redraw();
}

//
// show all cities that were the biggest before a given year
function showCitiesUntil( year ){
	lastYear = Math.floor( year );
	mxmin = 5000;
	mxmax = -5000;
	citytimeline = new Array();
	var circle = g.selectAll("circle")
		   .data(citytimeline);
	circle.exit().remove();

	for ( var i = 0; ( i < numyears ) && ( allyears[ i ] <= year ); i++ ){
		var city = citiesByYear[ allyears[ i ] ];
		citytimeline.push( city );
		if( city.coordinates[0] < mxmin ){
			mxmin = city.coordinates[0];
		}
		if( city.coordinates[0] > mxmax ){
			mxmax = city.coordinates[0];
		}
		currentYearIndex = Math.min( i + 1, numyears - 1 );
	}
	if( citytimeline.length > 0 ){
		fillCityInfo( citytimeline[ citytimeline.length - 1 ] );
	}
	addCitiesToMap();
	if ( year >= maxYear - 3 ){
		zoomOut();
	}
}

//
// put the next city on the map
function next( ){
	lastYear = allyears[ currentYearIndex ];
	if( lastYear !== undefined ){
		city = citiesByYear[ lastYear ];
		if( citiesbyid[ city.id ] !== undefined ){
			var pos =  citiesbyid[ city.id ];
			citytimeline.slice( pos, 1);
			for( var i = pos; i < citytimeline.length; i++ ){
				citiesbyid[ citytimeline[ i ].id ] = i;
			} 	
		}
		citytimeline.push( city );
		citiesbyid[ city.id ] = citytimeline.length - 1;
		if( city.coordinates[0] < mxmin ){
			mxmin = city.coordinates[0];
		}
		if( city.coordinates[0] > mxmax ){
			mxmax = city.coordinates[0];
		}
		fillCityInfo( city );
	}
	currentYearIndex++;
}

//
// set the timeline slider to a given year 
function updatesliderpos( year, minyear, maxyear ){
	var tpos = ( sliderwidth - sliderpointwidth ) * ( year - minyear ) / ( maxyear - minyear );
	sliderpoint.transition()
			.duration(1000)
			.attr("x", Math.floor(tpos) );
}

//
// get city circle size
function getCircleSize( pop ){
    return Math.pow( pop / 1000, 0.25 );
}


//
// update the circle display and shift the map into the right position
function redraw() {
	if( citytimeline.length > 0 ) {
		var k = width / ( ( mxmax - mxmin + 40));
		if( k > 4 ) { k = 4; }
		var circle = g.selectAll("circle")
		   .data(citytimeline);

		circle.transition()
			.duration(1000)
			.attr("r", function(d) { return getCircleSize( d.size );  })
			.attr( "class", "oldcity" )
			.style("stroke-width", 4 / k + "px");
		
	   circle.enter().append("circle")
			.attr( "class", "city" )
			.attr("cx", function(d) { return d.coordinates[0]; })
			.attr("cy", function(d) { return d.coordinates[1]; })
			.attr("r", function(d) { return getCircleSize( d.size );  })
			.attr( "id", function( d ) { return d.id; })
			.style("stroke-width", 4 / k + "px")
			.on( "click", circleClick );

		circle.exit().remove();

		var x = -(mxmax + mxmin)/2;
		var y = -citytimeline[ citytimeline.length - 1].coordinates[1];
		if( k > 4 ) { k = 4; }
		g.transition()
		  .duration(2000)
		  .attr("transform", "scale(" + k + ")translate(" + x + "," + y + ")")
		  .style("stroke-width", 1.5 / k + "px");

	}
 }

//
// show the final frame of the animation
function zoomOut(){
	var circle = g.selectAll("circle")
		   .data(citytimeline);

	circle.transition()
	   		.duration(1000)
			.attr("r", function(d, i) { return Math.log(d.size);  })
			.attr( "class", "city" )
			.style("stroke-width", "1px");

	g.transition()
      .duration(2000)
      .attr("transform", "scale(1)translate(0,0)")
      .style("stroke-width", "1.5px");

}

//
// update the slider's position and the corresponding cities up 
// until that point in time
// -- called when the slider is bein dragged
function dragmove(d) {
	setPaused( true );

	var x = Math.floor( d3.mouse(this)[0] );
	var year = Math.min( Math.max( x, 0 ), sliderwidth) / sliderwidth * ( maxYear - minYear ) + minYear;
  	sliderpoint
      .attr("x",  Math.floor( Math.max(0, Math.min(sliderwidth - sliderpointwidth, x))));
	showCitiesUntil( year );
}

//
// the slider was moved, 
function updatesliderpoint( d ){
	//var point = d3.mouse(this),
	//	x = point[0];
	//updatesliderpos(x + minYear, minYear, maxYear);
	setPaused( true );
}

//
// Mike's function for zoomin/panning the map based on whether 
// somebody clicked on a country
function click(d) {
  var x = 0,
      y = 0,
      k = 1
 
  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = -centroid[0];
    y = -centroid[1];
    k = 4;
    centered = d;
  } else {
    centered = null;
  }
 
  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });
 
  g.transition()
      .duration(1000)
      .attr("transform", "scale(" + k + ")translate(" + x + "," + y + ")")
      .style("stroke-width", 1.5 / k + "px");
}



