const validatormiddleware = (schema) => {
        return (req, res, next) => {
                let parameters = { ...req.body, ...req["query"], ...req["params"], ...req["auth"] };
                const { error, value } = schema.validate(parameters);
                if (!error) {
                        req.validator = value;
                        return next();
                } else {
                        const { details } = error;
                        console.error("error", details);
                        const message = details.map((i) => i.message.replace(/"/g, "")).join(",");
                        return res.status(422).json({ error: message });
                }
        };
};
module.exports = validatormiddleware;
