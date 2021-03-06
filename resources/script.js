

function twoDimensions(app, dim1, dim2) {
    var hyperCubeDef = {
        qDimensions: [
          {
              qDef: { qFieldDefs: [dim1] }
          },
          {
              qDef: { qFieldDefs: [dim2] }
          }
        ],
        qInterColumnSortOrder: [2, 0, 1],
        qInitialDataFetch: [
        {
            qTop: 0,
            qLeft: 0,
            qHeight: 200,
            qWidth: 3
        }
        ]
    }
    return createcube(app, hyperCubeDef, dim1, dim2)
}

function dim_measure(app, dim, meas, func) {
  var local_qdef = '=' + func + '( distinct [' + meas + '])'
  var hyperCubeDef = {
    qDimensions: [
      {
        qDef: {
          qFieldDefs: [dim]
        },
        qNullSuppression: true
      },
    ],
    qMeasures: [
      {
        qDef: { qDef: local_qdef},
        qSortBy: { qSortByNumeric: true }
      }
    ],
    qInitialDataFetch: [
      {
        qTop: 0,
        qLeft: 0,
        qHeight: 500,
        qWidth: 2
      }
    ]
  }
  return createcube(app, hyperCubeDef, dim, meas)
}

function createcube(app, hyperCubeDef, dim1, dim2) {
  var list = []
  return new Promise((resolve, reject) => {
    app.createCube(hyperCubeDef, hypercube => {
      let matrix = hypercube.qHyperCube.qDataPages[0].qMatrix
      matrix.forEach((row, index) => {
          let obj = {}
          // check if any qText is null
          if(row[0].qText != null && row[1].qText != null) {
            // if row[0] have multiple things
            if (row[0].qText.includes(",") == true) {
              let dimension1 = row[0].qText.split(",")
              obj[dim1] = dimension1
            } else {
              obj[dim1] = row[0].qText
            }

            //if row[1] have multiple things
            if (row[1].qText.includes(",") == true) {
              let dimension2 = row[1].qText.split(",")
              obj[dim2] = dimension2
            } else {
              obj[dim2] = row[1].qText
            }
            list.push(obj)
          }
      })
      resolve(list)
    })
  })

}

let dataSet = [];


// this is the config object used to connect to an app on a Qlik Sense server
var config = {
  host: 'playground-sense.qlik.com',
  prefix: '/showcase/',
  port: '443',
  isSecure: true,
  rejectUnauthorized: false,
  appname: '1a95d089-d275-466b-ae89-695a226048c4'
}

function main(update_top_displays_cb) {
  // our API uses requirejs, so here we're setting up our base URL
  require.config({
    baseUrl:
      (config.isSecure ? 'https://' : 'http://') +
      config.host +
      (config.port ? ':' + config.port : '') +
      config.prefix +
      'resources'
  })
  /**
   * Load the entry point for the Capabilities API family
   * See full documention:
   * https://help.qlik.com/en-US/sense-developer/September2018/Subsystems/APIs/Content/Sense_ClientAPIs/CapabilityAPIs/qlik-interface-interface.htm
   */
  require(['js/qlik'], function(qlik) {
    // We're now connected

    // Suppress Qlik error dialogs and handle errors how you like.
    qlik.setOnError(function(error) {
        console.log('ERROR', error)
    })

    // Open a dataset on the server
    app = qlik.openApp(config.appname, config)
    console.log("App Opened", app)

    get_top_commitments(app, update_top_displays_cb);

    var dataToPullFromQlikEngine =
      {
        0: 'Commitment Title',
        1: 'Partners',
        2: 'Lead entity',
        3: 'Ocean Basins',
        4: 'Indicator ID',
        5: 'Goal ID',
        6: 'Target Title'
      }

    var listOfStuff = Object.values(dataToPullFromQlikEngine);

    var promises = []

    listOfStuff.forEach((thing, index) => {
      var result_set = dim_measure(app, 'Country', thing, 'count').then((response) => {

        //console.log(response)
        return new Promise((resolve, reject) => {
        var result = []
          response.forEach((element) => {
              //tooltip[thing][country] = response[i][thing]
              var obj = {}
              obj[thing] = element[thing];
              result[element['Country']] = obj;
          });
          resolve(result)
        })

      })
      promises.push(result_set)
    });
    Promise.all(promises).then((dataSetLists) => {
      dataSet = dataSetLists;
    });
  })
}
