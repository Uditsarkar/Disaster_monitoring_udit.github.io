export const StatsCtrl = {
    map: null,
    data: null,
    geoJSONLayer: null, // Store the GeoJSON layer reference

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
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(StatsCtrl.map);
        
        StatsCtrl.updateMap(StatsCtrl.data);
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
                    const locations = JSON.parse(tweet.Locations.replaceAll('"',"'").replaceAll("'",'"'));
                    locations.forEach(loc => {
                        L.marker([loc.lat, loc.lon], {
                            title: tweet.Tweet,
                            icon: L.icon({
                                iconUrl: tweet.Sentiment === 'Positive' ? 'green-icon.png' : tweet.Sentiment === 'Negative' ? 'red-icon.png' : 'blue-icon.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        }).addTo(StatsCtrl.map).bindPopup(`${tweet.Timestamp}<br>${tweet.Tweet}`);
                    });
                }
            });
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
                    if (elements.length) {
                        const index = elements[0].index;
                        const sentiment = pieChartData.labels[index];
                        StatsCtrl.filterDataBySentiment(sentiment);
                    }
                }
            }
        });

        // Process data for Bar Chart
        const tweetsPerDay = StatsCtrl.data.reduce((acc, tweet) => {
            const date = tweet.Date.split(" ")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

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
                return d > 2 ? '#800026' :
                       d > 1 ? '#BD0026' :
                       d > 0 ? '#E31A1C' :
                                '#FFEDA0';
            }

            // Define style function
            function style(feature) {
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
            }).addTo(StatsCtrl.map);
            
            // Optionally, fit the map bounds to the GeoJSON layer
            StatsCtrl.map.fitBounds(StatsCtrl.geoJSONLayer.getBounds());
        })
        .catch(error => {
            console.error("Error loading GeoJSON layer:", error);
        });
    },
    
    filterDataBySentiment: function(sentiment) {
        const filteredData = StatsCtrl.data.filter(tweet => tweet.Sentiment === sentiment);
        StatsCtrl.updateMap(filteredData);
    },
    
    filterDataByDate: function(date) {
        const filteredData = StatsCtrl.data.filter(tweet => tweet.Timestamp.split(" ")[0] === date);
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
