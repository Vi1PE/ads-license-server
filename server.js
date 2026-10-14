
const express = require("express");
const verify = require("./api/verify");

const app = express();

app.use(express.json());

app.all("/api/verify", verify);

app.get("/", (req, res) => {
  res.json({
    status: "License server is running successfully!",
    endpoint: "/api/verify",
    methods: ["GET", "POST"]
  });
});

const port = process.env.PORT || 10000;

app.listen(port, "0.0.0.0", () => {
  console.log(`License server listening on port ${port}`);
});
