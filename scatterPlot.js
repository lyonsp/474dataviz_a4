'use strict';

(function() {

  let data = "no data";
  let svgContainer = "";
  let circles = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    d3.csv("./dataEveryYear.csv")
      .then((data) => makeScatterPlot(data, "1960"));
  }

  // make scatter plot
  function makeScatterPlot(csvData, year) {
    data = csvData;
    var startData = data.filter((row) => row['time'] == year);
    
    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = startData.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = startData.map((row) => parseFloat(row["life_expectancy"]));
    let years = data.map((row) => parseFloat(row["time"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions, startData);

    // draw title and axes labels
    makeLabels();

    // get list with non-repeating years
    var uniqueYears = years.filter(function(item, pos){
      return years.indexOf(item)== pos; 
    });

    uniqueYears = uniqueYears.map((row) => row.toString());

    // create drop down menu with years
    let dropBox = d3.select('body').append('select')
      .attr('name', 'year-list');
  
    var options = dropBox.selectAll('option')
      .data(uniqueYears)
      .enter()
      .append('option')
      .html(uniqueYears)

    options.text(function(d) {return d;})
      .attr('value', function(d) {return d;});

    // recreate plot based on selected year in dropbox
    dropBox.on("change", function() {
      d3.selectAll("svg > *").remove();
      var selected = this.value;
      var selectedData = data.filter(function(d) {
        return d.time == selected;
      });
      fertility_rate_data = selectedData.map((row) => parseFloat(row["fertility_rate"]));
      life_expectancy_data = selectedData.map((row) => parseFloat(row["life_expectancy"]));
      axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);
      mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy");
      plotData(mapFunctions, selectedData);
      makeLabels();
      });
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Countries by Life Expectancy and Fertility Rate");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, selectedData) {
    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    // append data to SVG and plot as points
    circles = svgContainer.selectAll('.dot')
      .data(selectedData)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["pop_mlns"]))
        .attr('fill', "#4286f4")
        // tooltip on mouseover
        .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html("Country: " + d.location + "<br/>" 
        + "Year: " + d.time + "<br/>" 
        + "Population: " + numberWithCommas(d["pop_mlns"]*1000000) + "<br/>" 
        + "Life Expectancy: " + d.life_expectancy + "<br/>"
        + "Fertility Rate: " + d.fertility_rate)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }


  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5])
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5])
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
