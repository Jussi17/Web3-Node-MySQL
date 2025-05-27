const express = require('express');
const app = express();

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

const teht27 = require('./teht27');
app.use(teht27);

let port = 3004;
let hostname = "127.0.0.1";

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
