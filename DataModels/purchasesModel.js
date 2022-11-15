const pool = require("../Database/mysql-connect");

const getPurchases = (account, mode) => {
        return new Promise((resolve, reject) => {
                let sql = `SELECT p.*,a.ticker FROM purchases p join allocations a on p.ticker_id = a.id`;
                let arr = null;
                if (mode === "current") {
                        sql += ` where a.end is null and a.type = 'Regular'`;
                } else if (mode === "past") {
                        sql += ` where a.end is not null and a.type = 'Regular'`;
                } else if (mode === "all") {
                        sql += ` where a.type = 'Regular'`;
                }
                if (account) {
                        sql += " and a.account_id = ?";
                        arr = [account];
                }
                sql += ` order by purchase_date desc;`;
                console.log("====================================");
                console.log(sql);
                console.log("====================================");
                pool.query(sql, arr, (err, result) => {
                        if (err) {
                                reject(new Error(`getPurchases saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const addPurchase = (elements) => {
        return new Promise((resolve, reject) => {
                let sql = `INSERT INTO purchases (ticker_id,purchase_amount,purchase_quantity,purchase_date) VALUES ?`;
                pool.query(sql, [elements], (err, result) => {
                        if (err) {
                                reject(new Error(`addPurchase saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const updatePurchase = (id, purchase_amount, purchase_quantity, purchase_date) => {
        return new Promise((resolve, reject) => {
                let sql = `UPDATE purchases SET purchase_amount = ?,purchase_quantity = ?,purchase_date = ? where id = ?`;
                pool.query(sql, [purchase_amount, purchase_quantity, purchase_date, id], (err, result) => {
                        if (err) {
                                reject(new Error(`updatePurchase saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

module.exports = {
        getPurchases,
        addPurchase,
        updatePurchase,
};
