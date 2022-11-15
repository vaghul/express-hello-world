const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { getDividend, addDividend } = require("../DataModels/dividendModel");
const validatorMiddleWare = require("../Middleware/requestValidator");

const schema = {
        get: Joi.object().keys({
                account_id: Joi.number().required(),
        }),
        post: Joi.object().keys({
                ticker_id: Joi.number().required(),
                amount: Joi.number().required(),
                date: Joi.string().required(),
        }),
};
router.get("/", validatorMiddleWare(schema.get), async (req, res) => {
        const { account_id } = req.validator;

        try {
                const operationResult = await getDividend(account_id);
                res.json(operationResult);
        } catch (error) {
                console.log("====================================");
                console.log(error);
                console.log("====================================");
                res.status(500).send();
        }
});

router.post("/", validatorMiddleWare(schema.post), async (req, res) => {
        const { date, ticker_id, amount } = req.validator;
        try {
                const operationResult = await addDividend(ticker_id, amount, date);
                res.json(operationResult);
        } catch (error) {
                console.log("====================================");
                console.log(error);
                console.log("====================================");
                res.status(500).send();
        }
});

module.exports = router;
