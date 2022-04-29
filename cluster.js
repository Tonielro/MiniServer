const cluster = require("cluster");
const http = require("http");
const { setupMaster } = require("@socket.io/sticky");

const WORKERS_COUNT = 1;

if (cluster.isMaster) {
  //console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < WORKERS_COUNT; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    //console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });

  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  const PORT = process.env.PORT || 8080;
  const ONLINE = "192.168.0.176";
  const HOTSPOT = "172.20.10.4"
  httpServer.listen(PORT, ONLINE,() =>
    console.log(`server listening at http://localhost:${PORT}`)
  );
} else {
  console.log(`Worker ${process.pid} started`);
  require("./server");
}
function getClusters(){
  return cluster.worker.id;
}
module.exports = {getClusters};
