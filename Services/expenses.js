const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { getExpensebyExclude, getExpenceFilter, addExpense } = require("../DataModels/expenseModel");
const validatorMiddleWare = require("../Middleware/requestValidator");
const axios = require("axios");
// "Card Payment,Investment,Mortgage,Emergency Savings,Refundable,Maintanance"
const schema = {
        get: Joi.object().keys({
                excludelist: Joi.string().default("Card Payment,Investment,Emergency Savings,Refundable,Intra-Account Transfer,Nivedha"),
                filtermonth: Joi.number().optional(),
                filtertag: Joi.string().optional(),
        }),
        post: Joi.object().keys({
                account: Joi.string().required(),
                data: Joi.array()
                        .items(
                                Joi.object().keys({
                                        date: Joi.string().required(),
                                        name: Joi.string().required(),
                                        debit: Joi.string().required().allow(""),
                                        credit: Joi.string().required().allow(""),
                                })
                        )
                        .min(1),
        }),
};
router.get("/", validatorMiddleWare(schema.get), async (req, res) => {
        const { excludelist, filtermonth, filtertag } = req.validator;
        let excludeArray = excludelist.split(",");
        console.log("====================================");
        console.log(req.validator);
        console.log("====================================");
        try {
                if (filtermonth && filtertag) {
                        const operationResult = await getExpenceFilter(filtertag, filtermonth);
                        res.json(operationResult);
                } else {
                        const operationResult = await getExpensebyExclude(excludeArray);
                        res.json(operationResult);
                }
        } catch (error) {
                console.log("====================================");
                console.log(error);
                console.log("====================================");
                res.status(500).send();
        }
});

router.post("/", validatorMiddleWare(schema.post), async (req, res) => {
        const { data, account } = req.validator;

        let tags = data.map((e) => getLinkedTags(e.name));
        let extractedTags = await Promise.all(tags);
        let promisearr = data.map((e, index) => {
                let obj = {};
                obj.name = e.name;
                obj.date = e.date;
                obj.account = account;
                if (e.debit !== "") {
                        obj.inward = false;
                        obj.amount = parseFloat(e.debit);
                } else {
                        obj.inward = true;
                        obj.amount = parseFloat(e.credit);
                }
                obj.tags = extractedTags[index];
                return [obj.name, account, obj.amount, obj.inward, obj.date, obj.tags];
        });
        try {
                let operationResult = await addExpense(promisearr);
                res.json(operationResult);
        } catch (error) {
                console.log("====================================");
                console.log(error);
                console.log("====================================");
                res.status(500).send();
        }
});

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
                        console.log("====================================");
                        console.log(value);
                        console.log("====================================");
                        return value._source.name;
                }
        } catch (error) {
                console.log(error);
        }
        return "Others";
};

module.exports = router;
