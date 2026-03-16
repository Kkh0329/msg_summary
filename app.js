require("dotenv").config();

const express = require("express");

const submitRouter = require('./routes/submit');

const app = express();

app.use(express.json());
app.use(express.static("public"));


app.use('/', submitRouter);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});