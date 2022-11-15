const express = require("express");
const router = express.Router();
const csv = require("csv-parser");
const dayjs = require("dayjs");
const fs = require("fs");
const pool = require("../Database/mysql-connect");
const axios = require("axios");

const ModuleTempleate = {
        TDBANK: ["Date", "Name", "Debit", "Credit", "Total"],
        COSTCO: ["Date", "Posted Date", "Card No.", "Name", "Category", "Debit", "Credit"],
        WALMART: [
                "Date",
                "Posted Date",
                "Reference Number",
                "Activity Type",
                "Status",
                "Transaction Card Number",
                "Merchant Category",
                "Merchant Name",
                "Merchant City",
                "Merchant State/Province",
                "Merchant Postal Code/Zip",
                "Amount",
                "Rewards",
        ],
};
const testFolder = "./Dumps";
const getAllFiles = async () => {
        let result = [];
        fs.readdirSync(testFolder, { withFileTypes: true }).forEach((item) => {
                fs.readdirSync(`${testFolder}/${item.name}`, { withFileTypes: true }).forEach((inneritem) => {
                        let obj = {};
                        obj.type = item.name;
                        obj.path = inneritem.name;
                        result.push(obj);
                });
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
        if (data.type === "TDBANK") {
                obj = await formatTDCredit(data);
        } else if (data.type === "WALMART") {
                obj = await formatWalmartCredit(data);
        } else if (data.type === "COSTCO") {
                obj = await formatCostCoCredit(data);
        }
        saveEvent(obj);
        return obj;
};

const formatTDCredit = async (data) => {
        let obj = {
                date: data["Date"],
                name: data["Name"].replace(/\s+/g, " ").trim(),
                category: null,
                account: `TD Credit Card`,
        };
        if (data["Debit"] !== "") {
                obj.inward = false;
                obj.amount = parseFloat(data["Debit"]);
        } else {
                obj.inward = true;
                obj.amount = parseFloat(data["Credit"]);
        }
        obj.tags = await getLinkedTags(obj.name);
        return obj;
};

const formatCostCoCredit = async (data) => {
        let obj = {
                date: data["Date"],
                name: data["Name"]?.replace(/\s+/g, " ").trim() ?? "",
                category: data["Category"],
                account: `Costco Credit Card - ${data["Card No."]}`,
        };
        if (data["Debit"] !== "") {
                obj.inward = false;
                obj.amount = parseFloat(data["Debit"]);
        } else {
                obj.inward = true;
                obj.amount = parseFloat(data["Credit"]);
        }
        obj.tags = await getLinkedTags(obj.name);
        return obj;
};

const formatWalmartCredit = async (data) => {
        let amount = data["Amount"].substring(data["Amount"].charAt(0) == "-" ? 2 : 1);

        let obj = {
                date: data["Date"],
                name: data["Merchant Name"].replace(/\s+/g, " ").trim(),
                category: data["Merchant Category"],
                account: `Walmart Credit Card - ${data["Transaction Card Number"]}`,
                amount: parseFloat(amount),
        };
        obj.inward = data["Amount"].charAt(0) == "-";
        obj.tags = await getLinkedTags(obj.name);
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
                Message: `${processedTransaction.length} Transaction processed`,
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
                let sql = `SELECT * FROM expense`;
                pool.query(sql, (err, result) => {
                        if (err) {
                                reject(new Error(`Database error ${err}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const saveEvent = ({ name, category, account, amount, inward, date, tags }) => {
        if (name) {
                return new Promise((resolve, reject) => {
                        let sql = `INSERT INTO expense (name,category,account,amount,inward,date,tags) values(?,?,?,?,?,?,?)`;
                        pool.query(sql, [name, category, account, amount, inward, dayjs(date).format("YYYY-MM-DD"), tags], (err, result) => {
                                if (err) {
                                        console.log("sdadsdA", sql, [name, category, account, amount, inward, dayjs(date).format("YYYY-MM-DD"), tags]);
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
