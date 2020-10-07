const app = require("./server");

const port =  process.env.PORT|| 3000;
const host ="0.0.0.0"
app.listen(port, host,() => {
  console.log("Server is up on port " + port);
}); 