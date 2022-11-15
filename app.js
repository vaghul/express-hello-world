const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv/config");
const morgan = require("morgan");
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });

morgan.token("body", (req) => {
        if (req.method === "GET") {
                return JSON.stringify(req.params);
        } else {
                return JSON.stringify(req.body);
        }
});

if (process.env.ENV === "production") {
        app.use(
                morgan(
                        "/-- [:date] :remote-addr :user-agent :method :url :body Status code: :status  Response Size: :res[content-length]KB Response time: :response-time ms Total time: :total-time ms --/",
                        { stream: accessLogStream }
                )
        );
} else {
        app.use(morgan("dev"));
}
app.use(express.json());
app.use(
        express.urlencoded({
                extended: true,
        })
);

const serviceRoute = require("./Services");

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.set("trust proxy", true);
app.use("/api", serviceRoute);
app.get("/", function (req, res) {
        res.json({
                Messsage: "Deployment Success",
                env: process.env,
        });
});
app.use((req, res, next) => {
        res.status(404).send();
});

// Used for Push Notification
// cron.schedule("5 * * * * *", () => {
//         console.log(`Birthday Cron At ${Date()}`);
// }).start();

const PORT = process.env.PORT || 6000;
app.listen(PORT, console.log(`started on port ${PORT}`));

module.exports = app;

// Market Hook
