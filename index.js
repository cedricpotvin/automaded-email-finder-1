var express = require('express');
var path = require('path');
var bodyParser = require('body-parser')
var debug = require('debug')('index');
var swig  = require('swig');
var async = require('async');
var template = swig.compileFile(__dirname + '/lib/emails.txt');
var emailExistence = require('email-existence');
var googleSpreadsheet = require('google-spreadsheet');

var emailFinder = require('./lib/email-finder')

var app = express();

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

var rootDir = path.resolve(__dirname);

app.set('port', (process.env.PORT || 5000));

// Configure jade as template engine
app.set('views', rootDir + '/views');
app.set('view engine', 'ejs');
app.set("view options", {layout: false});

// Parse the body
// Warning: http://andrewkelley.me/post/do-not-use-bodyparser-with-express-js.html
// parse application/json
app.use(bodyParser.json())

// Serve static content from "public" directory
app.use(express.static(rootDir + '/public'));


app.get('/', function(req, res){
  res.render('index', {
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID || ''
  });
});

app.post('/find', function(req, res) {

  // var data = {
  //   name: req.params.name,
  //   domain: req.params.domain
  // };
  // emailList =  createEmailsList(program.domain, firstname, lastname);
  if (true){
    console.log("Reporting to Google Sheets")
    updateGoogleSheet()
  }
  res.sendDate
});

  // All set, start listening!
app.listen(app.get('port'), function() {
  console.log(`Server running at http://localhost:${app.get('port')}`);
 

});

async function updateGoogleSheet() {
  try {
    const doc = new googleSpreadsheet.GoogleSpreadsheet('1RkfPLcTzsXPAjaWPYPuAIN2soVGy6QQmZnwoEgxyP-E');

    await doc.useServiceAccountAuth(require('./creds-from-google.json'));

    await doc.loadInfo(); 
    var sheet = doc.sheetsByIndex[0];
    console.log(sheet.title);
    var rows = await sheet.getRows();
    await update_data(rows);
  }
  catch(e) {
    console.log('Catch an error: ', e);
  }
}

function createEmailsList(domain, firstname, lastname){
 
  firstname  = "" + firstname;
  lastname = "" + lastname;
  var fi = firstname.charAt(0);
  var li = lastname.charAt(0);

  var output = template({
      li : li,
      fi : fi,
      fn : firstname,
      ln : lastname,
      domain : domain
  });

  console.log(output)

  var emailsArr = output.split('\n');

  return new Promise(function(resolve, reject) {

    var q = async.queue(function (email, callback) {

       emailExistence.check(email, function(err, res) {

        if (err) {
          return callback();
        }

         if (res) {
           console.log("%s is a valid email address", email);

          // Kill the queue
          q.kill();
          return resolve(email);
         }

        callback();
      });

    }, 2);

    emailsArr.forEach(function(email){
      q.push(email, function (err) {});
    });

    q.drain = function() {
      console.log('Not found: ', JSON.stringify(domain, firstname, lastname));
      return resolve(null);
    }
  });
}

async function update_data(rows) {
  var i = 0;
  for (var row in rows) {
    console.log(rows[i]["First Name"])

      if (rows[i]["First Name"] && rows[i]["Last Name"] && rows[i].URL && !rows[i].Email){
        var domain = rows[i].URL.replace('http://','').replace('https://','').split(/[/?#]/)[0];
        email_list = await createEmailsList(domain, rows[i]["First Name"], rows[i]["Last Name"]);
        console.log("result");
        console.log(email_list)
        if (email_list){
          rows[i].Email =email_list;
        }
        else{
          rows[i].Email ="Not Found!";
        }
        await rows[i].save();

      }
     
  
    i++;

  }

  return -1;

}