"use strict";
const fs = require("node:fs");
fs.mkdirSync("site", {recursive:true});
for (const file of ["index.html","engine.js","app.js","style.css","icon.svg"]) fs.copyFileSync(file,"site/"+file);
