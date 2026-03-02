const express = require("express");
const app = express();
const port = 3000;

app.get("/", async (req, res) =>{
    return res.send("Hello World");
});

// Start the server
app.listen(port, () => {
  console.log(`API running on port: ${port}`);
});