export const StatsCtrl = {
    map: null,
    data: null,
    rainfalldata: null,
    geoJSONLayer: null, 
    baseMaps: null,
    overlayMaps: null,

    onViewReady: function() {
        console.log("Statistics View is Ready");
        
        // Load JSON data
        webix.ajax().get("data.json", function(text) {
            StatsCtrl.data = JSON.parse(text);
            StatsCtrl.initializeMap();
            StatsCtrl.initializeCharts();
            StatsCtrl.loadDataTable();
            StatsCtrl.loadGeoJSONLayer();
        });
    },
    
    initializeMap: function() {
        StatsCtrl.map = L.map('map').setView([10.8505, 76.2711], 15);
        var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        });
        osm.addTo(StatsCtrl.map);
        
        StatsCtrl.baseMaps = {
            "OpenStreetMap": osm
        };

        StatsCtrl.updateMap(StatsCtrl.data);

        StatsCtrl.overlayMaps = {
            "Tweets": StatsCtrl.featuresLyrGrp
        };
        console.log("StatsCtrl.featuresLyrGrp: ",StatsCtrl.featuresLyrGrp);
        console.log("baseMaps: ",osm)

    },
    
    featuresLyrGrp: L.layerGroup(),

    // Function to convert "dd-mm-yyyy" to Date object
    parseDate: function(dateStr) {
        const [day, month, year] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-based in JavaScript Date
    },

    updateMap: function(data) {
        if (StatsCtrl.map) {
            // Remove existing markers
            StatsCtrl.map.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    StatsCtrl.map.removeLayer(layer);
                }
            });

            // Add new markers
            data.forEach(tweet => {
                if (tweet.Locations) {
                    const locations = JSON.parse(tweet.Locations.replaceAll('"',"'").replaceAll("'",'"')); //replaceall was required to read the tweet locations
                    locations.forEach(loc => {
                        var tempFeature = L.marker([loc.lat, loc.lon], {
                            title: tweet.Tweet,
                            icon: L.icon({
                                iconUrl: tweet.Sentiment === 'Positive' ? 'green-icon.png' : tweet.Sentiment === 'Negative' ? 'red-icon.png' : 'blue-icon.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        })

                        console.log("tweet:- ",tweet);
                        var dateStr = tweet.Date.split(" ")[0];
                        console.log("dateStr:- ",dateStr);
                        var [day, month, year] = dateStr.split('-').map(Number);
                        var tempDate = new Date(year, month - 1, day);
                        tweet.dateObj = tempDate;

                        tempFeature.bindPopup(`${tweet.Timestamp}<br>${tweet.Tweet}`).addTo(StatsCtrl.featuresLyrGrp);
                    });
                }
            });

            //data.sort((a, b) => StatsCtrl.parseDate(a.date) - StatsCtrl.parseDate(b.date));
            data.sort((a, b) => a.dateObj - b.dateObj);

            StatsCtrl.featuresLyrGrp.addTo(StatsCtrl.map);
        }
    },
    
    initializeCharts: function() {
        // Process data for Pie Chart
        const sentimentCounts = StatsCtrl.data.reduce((acc, tweet) => {
            acc[tweet.Sentiment] = (acc[tweet.Sentiment] || 0) + 1;
            return acc;
        }, {});

        const pieChartData = {
            labels: Object.keys(sentimentCounts),
            datasets: [{
                data: Object.values(sentimentCounts),
                backgroundColor: [ '#90EE90', '#FFCE56','#FF6384']
            }]
        };
        
        const pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
            type: 'pie',
            data: pieChartData,
            options: {
                onClick: (event, elements) => {
                    console.log("In Click:- ",elements.length);
                    if (elements.length) {
                        const index = elements[0].index;
                        const sentiment = pieChartData.labels[index];
                        StatsCtrl.filterDataBySentiment(sentiment);
                    }
                }
            }
        });


        /*tweet.forEach(fuction(item,index){
            var dateStr = item.Date.split(" ")[0];
            var [day, month, year] = dateStr.split('-').map(Number);
            tempDate = new Date(year, month - 1, day); // month is 0-based in JavaScript Date
            item["dateObj"] = tempDate;
        });*/

        // Process data for Bar Chart
        const tweetsPerDay = StatsCtrl.data.reduce((acc, tweet) => {
            /*const date = tweet.Date.split(" ")[0];
            console.log("date:-",date);
            acc[date] = (acc[date] || 0) + 1;
            console.log("acc:- ",acc);
            return acc;
            */
            
            /*const date = tweet.dateObj;
            console.log("date:-",date);
            acc[date] = (acc[date] || 0) + 1;
            console.log("acc:- ",acc);
            return acc;
            */

            const date = tweet.Date.split(" ")[0];
            console.log("date:- ",date)
            acc[date] = (acc[date] || 0) + 1;
            console.log("acc:- ",acc);
            return acc;
            //return date;

        }, {});
        console.log("tweetsPerDay:- ",tweetsPerDay)

        const barChartData = {
            labels: Object.keys(tweetsPerDay),
            datasets: [{
                label: 'Tweets per Day',
                data: Object.values(tweetsPerDay),
                backgroundColor: '#36A2EB'
            }]
        };

        const barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
            type: 'bar',
            data: barChartData,
            options: {
                onClick: (event, elements) => {
                    if (elements.length) {
                        const index = elements[0].index;
                        const date = barChartData.labels[index];
                        StatsCtrl.filterDataByDate(date);
                    }
                }
            }
        });

        webix.ajax().get("rainfall.json", function(text) {
            StatsCtrl.rainfalldata = JSON.parse(text);

            const rainfallPerDay = StatsCtrl.rainfalldata.reduce((acc, rainfall) => {
                /*const date = tweet.Date.split(" ")[0];
                console.log("date:-",date);
                acc[date] = (acc[date] || 0) + 1;
                console.log("acc:- ",acc);
                return acc;
                */
                
                /*const date = tweet.dateObj;
                console.log("date:-",date);
                acc[date] = (acc[date] || 0) + 1;
                console.log("acc:- ",acc);
                return acc;
                */
    
                const date = rainfall.Date;
                console.log("date:- ",date)
                acc[date] = (acc[date] || 0) + 1;
                /*acc["Rainfall (mm)"] = (acc["Rainfall (mm)"] || 0) + 1;
                acc["Reservoir level (m)"] = (acc["Reservoir level (m)"] || 0) + 1;
                acc["Gross Inflow (MCM)"] = (acc["Gross Inflow (MCM)"] || 0) + 1;
                acc["Spill (MCM)"] = (acc["Spill (MCM)"] || 0) + 1;*/
                console.log("acc:- ",acc);
                return acc;
                //return date;
    
            }, {});
            console.log("rainfallPerDay:- ",rainfallPerDay)

            var tempRainfallList = [];
            for (const element of StatsCtrl.rainfalldata) {
                console.log(element);
                tempRainfallList.push(element["Rainfall (mm)"]);
            }
            var rainfallList = tempRainfallList;

            var tempReserviorList = [];
            for (const element of StatsCtrl.rainfalldata) {
                console.log(element);
                tempReserviorList.push(element["Reservoir level (m)"]);
            }
            var reserviorList = tempReserviorList;

            var tempGrossInflowList = [];
            for (const element of StatsCtrl.rainfalldata) {
                console.log(element);
                tempGrossInflowList.push(element["Gross Inflow (MCM)"]);
            }
            var grossInfoList = tempGrossInflowList;

            var tempSpillList = [];
            for (const element of StatsCtrl.rainfalldata) {
                console.log(element);
                tempSpillList.push(element["Spill (MCM)"]);
            }
            var spillList = tempSpillList;

            const lineChartData = {
                labels: Object.keys(rainfallPerDay),
                datasets: [{
                    label: 'Rainfall',
                    data: rainfallList,
                    backgroundColor: '#36A2EB'
                },{
                    label: 'Reservior',
                    data: reserviorList,
                    backgroundColor: '#36A2EB'
                },{
                    label: 'Gross Inflow',
                    data: grossInfoList,
                    backgroundColor: '#36A2EB'
                },{
                    label: 'Spill',
                    data: spillList,
                    backgroundColor: '#36A2EB'
                }]
            };
    
            const lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
                type: 'line',
                data: lineChartData
            });
        });
        
    },
    
    loadDataTable: function() {
        $$("tweetsTable").parse(StatsCtrl.data);
        
        $$("tweetsTable").attachEvent("onItemClick", function(id) {
            const item = this.getItem(id);
            const filteredData = StatsCtrl.data.filter(tweet => tweet.Date === item.Timestamp);
            StatsCtrl.updateMap(filteredData);
        });
    },
    
    loadGeoJSONLayer: function() {
        // Load GeoJSON layer onto the map
        if (StatsCtrl.geoJSONLayer) {
            // If the layer already exists, remove it before loading a new one
            StatsCtrl.map.removeLayer(StatsCtrl.geoJSONLayer);
        }
        
        // Load the GeoJSON file
        fetch("Kerala_subdistrict_join2.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(geoJSONData => {
            // Define getColor function
            function getColor(d) {
                console.log("d:- ",d);
                //return d > 2 ? '#800026' :
                /*return d > 2 ? '#a34662' :
                       d > 1 ? '#BD0026' :
                       d > 0 ? '#E31A1C' :
                               '#FFEDA0';*/
                if(d>=2){
                    return '#b35475';
                }else if(d>=1){
                    return '#8f7e7e';
                }
                else if(d>=0){
                    return '#FFEDA0';
                }
            }

            // Define style function
            function style(feature) {
                console.log("getColor(feature.properties.No):- ",getColor(feature.properties.No));
                return {
                    fillColor: getColor(feature.properties.No), 
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            }

            // Define threshold values for choropleth
            //const threshold2 = [0, 1, 2];

            // Create the GeoJSON layer with the style
            StatsCtrl.geoJSONLayer = L.geoJSON(geoJSONData, {
                style: style,
                onEachFeature: function (feature, layer) {
                    layer.on({
                        mouseover: highlightFeature,
                        mouseout: resetHighlight,
                        click: zoomToFeature
                    });
                }
            });

            StatsCtrl.overlayMaps["Vulnerable Areas"] = StatsCtrl.geoJSONLayer;
            var layerControl = L.control.layers(StatsCtrl.baseMaps, StatsCtrl.overlayMaps).addTo(StatsCtrl.map);
            
            // Optionally, fit the map bounds to the GeoJSON layer
            StatsCtrl.map.fitBounds(StatsCtrl.geoJSONLayer.getBounds());
        })
        .catch(error => {
            console.error("Error loading GeoJSON layer:", error);
        });
    },
    
    filterDataBySentiment: function(sentiment) {
        //console.log("tweet:",tweet);
        const filteredData = StatsCtrl.data.filter(tweet => tweet.Sentiment === sentiment);
        StatsCtrl.updateMap(filteredData);
    },
    
    filterDataByDate: function(date) {
        //const filteredData = StatsCtrl.data.filter(tweet => tweet.Timestamp.split(" ")[0] === date);
        //console.log("tweet:",tweet);
        const filteredData = StatsCtrl.data.filter(tweet => tweet.Date.split(" ")[0] === date);
        StatsCtrl.updateMap(filteredData);
    },

    resetFilters: function() {
        StatsCtrl.updateMap(StatsCtrl.data);
        $$("tweetsTable").clearAll();
        $$("tweetsTable").parse(StatsCtrl.data);
    }
};

// Define highlight feature function
function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

// Define reset highlight function
function resetHighlight(e) {
    StatsCtrl.geoJSONLayer.resetStyle(e.target);
}

// Define zoom to feature function
function zoomToFeature(e) {
    StatsCtrl.map.fitBounds(e.target.getBounds());
}
