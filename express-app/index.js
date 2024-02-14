const express = require("express");
const app = express();
const prometheus = require("prom-client");
const { createResponse } = require("./createResponse");
const register = new prometheus.Registry();
const metricsInterval = prometheus.collectDefaultMetrics({register});
const os = require('os');

const totalHttpRequestsCounter = new prometheus.Counter({
  name: 'total_http_requests',
  help: 'Total number of HTTP requests received',
});

const total500Requests = new prometheus.Counter({
  name: 'total_500_requests',
  help: 'Total number of 500 ( Internal Server Error ) HTTP requests received',
});

const total200Requests = new prometheus.Counter({
  name: 'total_200_requests',
  help: 'Total number of 200 ( OK ) HTTP requests received',
});

const latencyHistogram = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Histogram for HTTP request duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5],
});

app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const endTime = Date.now();
    const latency = (endTime - startTime) / 1000;
    latencyHistogram.observe(latency);
  });
  next();
});

app.get("/user-detail", (req, res) => {
  const user = [{
    id: 1,
    username: "kls_git",
    email: "kls_git@gmail.com",
    role: "admin",
    requester: req.socket.remoteAddress
  }];

  totalHttpRequestsCounter.inc(1);
  total200Requests.inc(1);
  const response = createResponse('User data fetched', 'success', user);
  res.status(200).send(response);
});

app.get("/bad-request", (req, res) => {
  const response = createResponse('Could not process the request', 'error', []);
  total500Requests.inc(1);
  totalHttpRequestsCounter.inc(1);
  res.status(500).send(response);
});

app.get("/random-delay", async (req, res) => {
  const delay = Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  totalHttpRequestsCounter.inc(1);
  total200Requests.inc(1);
  const response = createResponse('Request delayed', 'success', []);
  res.status(200).send(response);
});

app.get("/metrics", async (req, res) => {
  try {
    const metrics = await prometheus.register.metrics();
    res.set("Content-Type", prometheus.register.contentType);
    res.end(metrics);
  } catch (error) {
    console.error("Error generating metrics:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3001, () => {
  console.log("Hello World Running.");
  console.log(os.hostname());
});

process.on('SIGTERM', () => {
  clearInterval(metricsInterval);
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })

})