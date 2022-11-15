const express = require("express");
const router = express.Router();
const csv = require("csv-parser");
const dayjs = require("dayjs");
const fs = require("fs");
const pool = require("../Database/mysql-connect");
const axios = require("axios");

const endpoint = "https://sandbox-api.coinmarketcap.com";
const prod = "https://pro-api.coinmarketcap.com";
const getCryptoPrice = async (data, key, totalobj) => {
        var config = {
                method: "GET",
                url: `${prod}/v1/cryptocurrency/quotes/latest?convert=CAD&symbol=${key}`,
                headers: {
                        "X-CMC_PRO_API_KEY": "eda6b837-0c9a-41c5-8bf9-47c8f12dd4b4",
                },
        };
        try {
                let result = await axios(config);
                if (result.data) {
                        let currentTotal = 0;
                        let final = data.map((cryptoitem) => {
                                let crypto = result.data.data[cryptoitem.coin];
                                let obj = cryptoitem;
                                console.log("obj", obj);
                                if (crypto) {
                                        obj.name = crypto.name;
                                        obj.last_updated = crypto.last_updated;
                                        obj.currentCAD = obj.coin == "TCAD" ? 1 : crypto.quote?.CAD?.price;
                                        obj.currentValue = obj.currentCAD * obj.quantity;
                                        currentTotal += obj.currentValue;
                                        obj.quantityallocation = (obj.quantity * 100) / totalobj.totalQuantity;
                                        obj.PurchaseCADallocation = (obj.currentValue * 100) / totalobj.totalValue;
                                }
                                return obj;
                        });
                        totalobj.currentTotal = currentTotal;
                        final.forEach((element) => {
                                element.CurrentCADallocation = (element.currentValue * 100) / currentTotal;
                        });
                        return { final, totalobj };
                }
        } catch (error) {
                console.log(error);
        }
};

router.get("/", async (req, res) => {
        let result = await showEvent();
        let totalValue = 0;
        let totalQuantity = 0;
        let currency = result.map((cryptoitem) => {
                totalValue += cryptoitem.purchaseCAD;
                totalQuantity += cryptoitem.quantity;
                return cryptoitem.coin;
        });
        if (currency.length > 0) {
                let finalResult = await getCryptoPrice(result, currency.join(","), { totalValue, totalQuantity });
                res.json(finalResult);
        } else {
                res.status(500).send();
        }
});

const showEvent = () => {
        return new Promise((resolve, reject) => {
                let sql = `select currency as coin,sum(amount) as purchaseCAD,sum(quantity) as quantity from account.crypto group by currency having quantity > 0 ;`;
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
