const express = require("express");
const Joi = require("joi");

const router = express.Router();
const { getPurchases, addPurchase, updatePurchase } = require("../DataModels/purchasesModel");
const validatorMiddleWare = require("../Middleware/requestValidator");

const schema = {
        get: Joi.object().keys({
                account_id: Joi.number().required(),
                mode: Joi.string().valid("all", "past", "current").required(),
        }),
        post: Joi.object().keys({
                purchase_date: Joi.string().required(),
                purchases: Joi.array()
                        .items(
                                Joi.object()
                                        .keys({
                                                ticker_id: Joi.number().required(),
                                                purchase_amount: Joi.number().required(),
                                                purchase_quantity: Joi.number().required(),
                                        })
                                        .unknown(true)
                        )
                        .min(1)
                        .required(),
        }),
        put: Joi.object()
                .keys({
                        purchase_id: Joi.number().required(),
                        purchase_date: Joi.string().required(),
                        purchase_amount: Joi.number().required(),
                        purchase_quantity: Joi.number().required(),
                })
                .unknown(true),
};

router.get("/", validatorMiddleWare(schema.get), async (req, res) => {
        const { account_id, mode } = req.validator;

        try {
                const operationResult = await getPurchases(account_id, mode);
                res.json(operationResult);
        } catch (error) {
                console.log("====================================");
                console.log(error);
                console.log("====================================");
                res.status(500).send();
        }
});

router.post("/", validatorMiddleWare(schema.post), async (req, res) => {
        const { purchase_date, purchases } = req.validator;

        try {
                let operationalArray = purchases.map((e) => {
                        return [e.ticker_id, e.purchase_amount, e.purchase_quantity, purchase_date];
                });
                const operationResult = await addPurchase(operationalArray);
                res.json(operationResult);
        } catch (error) {
                console.log("====================================");
                console.log(error);
                console.log("====================================");
                res.status(500).send();
        }
});

router.put("/", validatorMiddleWare(schema.put), async (req, res) => {
        const { purchase_date, purchase_id, purchase_amount, purchase_quantity } = req.validator;
        try {
                const operationResult = await updatePurchase(purchase_id, purchase_amount, purchase_quantity, purchase_date);
                res.json(operationResult);
        } catch (error) {
                console.log("====================================");
                console.log(error);
                console.log("====================================");
                res.status(500).send();
        }
});

module.exports = router;
