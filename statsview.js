// statsview.js
import {StatsCtrl} from './StatisticsController.js';

export const StatsView = {
    id: 'statistics-view',
    view: 'scrollview',
    scroll: 'y',
    body: {   
    rows: [{
        view: 'template',
        id: 'sts_map',
        template: "<div id='map' style='width: 100%; height: 400px;'></div>",
        height: 400,
        on: {
            onAfterRender: () => { StatsCtrl.onViewReady(); }
        }
    },{
        height: 5
    },{
        height: 300,
        cols:[{
            view: 'template',
            id: 'sts_barchart',
            template: "<!--input type='reset' id='reset_btn_0' value='Reset' style='position: absolute; left: 10px;'--><canvas id='barChart'></canvas>"
        },/*{
            width: 12
        }*/{
            view: 'template',
            id: 'sts_linechart',
            template: "<!--input type='reset' id='reset_btn_0' value='Reset' style='position: absolute; left: 10px;'--><canvas id='lineChart'></canvas>"
        },{
            /*type: 'clean',
            cols: [{
                view: 'template',
                id: 'sts_piechart',
                width: 500,
                template: "<input type='reset' id='reset_btn' value='Reset All' style='position: absolute; right: 10px;'><canvas id='pieChart'></canvas>"
            }]*/
            view: 'template',
            id: 'sts_piechart',
            //width: 500,
            template: "<input type='reset' id='reset_btn' value='Reset All' style='position: absolute; right: 10px;'><canvas id='pieChart'></canvas>"
        }]
    },{
        view: "datatable", 
        id: "tweetsTable",
        autoheight: false,
        height: 300,
        scroll: true,
        columns: [
            { id: "Date", header: "Date", width: 150 },
            { id: "Timestamp", header: "Timestamp", width: 150 },
            { id: "Tweet", header: "Tweet", fillspace: true },
            { id: "Sentiment", header: "Sentiment", width: 100 }
        ]
    }],
},
    getController: () => {
        return StatsCtrl;
    }
};
