const http = require("http");
const fs = require("fs");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2), {
  default: {
    port : 5000
  },
  alias: {
    port : 'p'
  }
});

//Creating variable to store html files
let homeContent = "";
let projectContent = "";
let registrationContent = "";

fs.readFile("./home.html", (err, home) => {
    if (err) {
      throw err;
    }
    homeContent = home;
   });

fs.readFile("./project.html",(err,project) => {
    if(err){
        throw err;
    }
    projectContent = project;
});

fs.readFile("./registration.html",(err,registrationForm) => {
    if(err){
        throw err;
    }
    registrationContent = registrationForm;
});

  http
  .createServer((request, response) => {
    let url = request.url;
    response.writeHeader(200, { "Content-Type": "text/html" });
    switch (url) {
        case "/project":
          response.write(projectContent);
          response.end();
          break;
        case "/registration":
            response.write(registrationContent);
            response.end();
            break;
        default:
          response.write(homeContent);
          response.end();
          break;
      }
  })
  .listen(args.port);