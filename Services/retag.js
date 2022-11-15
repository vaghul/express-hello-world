const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { getExpenseByTags, updateTags } = require("../DataModels/expenseModel");
const validatorMiddleWare = require("../Middleware/requestValidator");
const axios = require("axios");
const schema = {
        get: Joi.object().keys({}),
};
router.get("/", validatorMiddleWare(schema.get), async (req, res) => {
        try {
                const operationResult = await getExpenseByTags();
                let linkpromise = operationResult.map((e) => {
                        return getLinkedTags(e.name);
                });
                let linktags = await Promise.all(linkpromise);
                let finalOpArr = linktags.map((e, index) => {
                        return updateTags(operationResult[index].id, e);
                });
                let result = await Promise.all(finalOpArr);
                res.json(result);
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
