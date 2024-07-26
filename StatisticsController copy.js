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
        StatsCtrl.map = L.map('map').setView([10.8505, 76.2711], 8);
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
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
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
        fetch("Kerala_subdistrict.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(geoJSONData => {
            // Create the GeoJSON layer
            StatsCtrl.geoJSONLayer = L.geoJSON(geoJSONData).addTo(StatsCtrl.map);
            
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
        fetch("Kerala_subdistrict.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(geoJSONData => {
            // Create the GeoJSON layer
            StatsCtrl.geoJSONLayer = L.geoJSON(geoJSONData).addTo(StatsCtrl.map);
            
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
