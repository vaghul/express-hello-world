const express = require("express");
const router = express.Router();
const csv = require("csv-parser");
const dayjs = require("dayjs");
const fs = require("fs");
const pool = require("../Database/mysql-connect");
const axios = require("axios");

const ModuleTempleate = {
        CRYPTO: [
                "Timestamp (UTC)",
                "Transaction Description",
                "Currency",
                "Amount",
                "To Currency",
                "To Amount",
                "Native Currency",
                "Native Amount",
                "Native Amount (in USD)",
                "Transaction Kind",
        ],
};
const testFolder = "./Dumps";
const getAllFiles = async () => {
        let result = [];
        fs.readdirSync(testFolder, { withFileTypes: true }).forEach((item) => {
                if (item.name === "CRYPTO") {
                        fs.readdirSync(`${testFolder}/${item.name}`, { withFileTypes: true }).forEach((inneritem) => {
                                let obj = {};
                                obj.type = item.name;
                                obj.path = inneritem.name;
                                result.push(obj);
                        });
                }
        });
        return result;
};

const extractFromCsv = async ({ path, type }) => {
        console.log(`./Dumps/${type}/${path}`);
        return new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(`./Dumps/${type}/${path}`)
                        .pipe(csv({ headers: ModuleTempleate[type], skipLines: type === "TDBANK" ? 0 : 1 }))
                        .on("data", (data) => results.push({ ...data, type: type }))
                        .on("end", () => {
                                resolve(results);
                        });
        });
};

const formatCsv = async (data) => {
        let obj = {};
        if (data.type === "CRYPTO") {
                obj = await formatTDCredit(data);
        }
        saveEvent(obj);

        return obj;
};

const formatTDCredit = async (data) => {
        let obj = {};
        let amount = parseFloat(data["Native Amount"]);
        obj.date = data["Timestamp (UTC)"];
        console.log(data["Transaction Kind"]);
        if (data["Transaction Kind"] === "viban_purchase") {
                obj.currency = data["To Currency"].replace(/\s+/g, " ").trim();
                obj.amount = amount;
                obj.quantity = parseFloat(data["To Amount"]);
                obj.type = "Purchase";
        } else if (data["Transaction Kind"] === "crypto_earn_interest_paid") {
                obj.currency = data["Currency"].replace(/\s+/g, " ").trim();
                obj.amount = amount;
                obj.quantity = parseFloat(data["Amount"]);
                obj.type = "Interest";
        } else if (data["Transaction Kind"] === "dust_conversion_credited") {
                obj.currency = data["Currency"].replace(/\s+/g, " ").trim();
                obj.amount = amount;
                obj.quantity = parseFloat(data["Amount"]);
                obj.type = "Dust";
        } else if (data["Transaction Kind"] === "referral_card_cashback") {
                obj.currency = data["Currency"].replace(/\s+/g, " ").trim();
                obj.amount = amount;
                obj.quantity = parseFloat(data["Amount"]);
                obj.type = "Cashback";
        } else if (data["Transaction Kind"] === "crypto_withdrawal") {
                obj.currency = data["Currency"].replace(/\s+/g, " ").trim();
                obj.amount = amount;
                obj.quantity = parseFloat(data["Amount"]);
                obj.type = "Withdraw";
        } else if (data["Transaction Kind"] === "dust_conversion_debited") {
                obj.currency = data["Currency"].replace(/\s+/g, " ").trim();
                obj.amount = amount;
                obj.quantity = parseFloat(data["Amount"]);
                obj.type = "DustDebit";
        } else if (data["Transaction Kind"] === "crypto_viban_exchange") {
                obj.currency = data["Currency"].replace(/\s+/g, " ").trim();
                obj.amount = -amount;
                obj.quantity = parseFloat(data["Amount"]);
                obj.type = "Sell";
        }

        return obj;
};

const getLinkedTags = async (key) => {
        var data = JSON.stringify({
                query: {
                        match: {
                                tags: key,
                        },
                },
        });

        var config = {
                method: "post",
                url: "http://localhost:9200/tags/_search",
                headers: {
                        "Content-Type": "application/json",
                },
                data: data,
        };

        try {
                let result = await axios(config);
                if (result.data.hits.hits && result.data.hits.hits.length > 0) {
                        let value = result.data.hits.hits[0];
                        return value._source.name;
                }
        } catch (error) {
                console.log(error);
        }
        return "Others";
};

router.post("/", async (req, res) => {
        const { vendor_id, vendor_name } = req.body;
        let val = await getAllFiles();
        console.log("val", val);
        let promise = val.map(async (files) => {
                return extractFromCsv(files);
        });
        let result = await Promise.all(promise);
        let final = [];
        result.forEach((val) => {
                val.forEach((inter) => {
                        final.push(formatCsv(inter));
                });
        });
        const processedTransaction = await Promise.all(final);
        res.json({
                value: processedTransaction,
        });
});

router.delete("/", async (req, res) => {
        let deleted = await flushAll();
        res.json(deleted);
});
router.get("/", async (req, res) => {
        let result = await showEvent();
        res.json(result);
});

const showEvent = () => {
        return new Promise((resolve, reject) => {
                let sql = `SELECT * FROM crypto`;
                pool.query(sql, (err, result) => {
                        if (err) {
                                reject(new Error(`Database error ${err}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const saveEvent = ({ date, currency, amount, quantity, type }) => {
        if (date && currency) {
                return new Promise((resolve, reject) => {
                        let sql = `INSERT INTO crypto (date,currency,amount,quantity,type) values(?,?,?,?,?)`;
                        pool.query(sql, [date, currency, amount, quantity, type], (err, result) => {
                                if (err) {
                                        reject(new Error(`Database error ${err}`));
                                } else {
                                        resolve(result);
                                }
                        });
                });
        }
};

const flushAll = () => {
        return new Promise((resolve, reject) => {
                let sql = `DELETE FROM expense;`;
                pool.query(sql, (err, result) => {
                        if (err) {
                                reject(new Error(`Database error ${err}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

module.exports = router;
