const pool = require("../Database/mysql-connect");

const getDividend = (account) => {
        return new Promise((resolve, reject) => {
                let sql = `SELECT p.*,a.ticker FROM purchases p join allocations a on p.ticker_id = a.id and a.end is null and a.type = 'Regular'`;
                let arr = null;
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
                                reject(new Error(`getDividend saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const addDividend = (ticker_id, amount, date) => {
        return new Promise((resolve, reject) => {
                let sql = `INSERT INTO dividend SET ticker_id = ? ,amount = ?,date = ?,total_value = (select sum(purchase_amount) from purchases where ticker_id in (select id from allocations where ticker in (select ticker from allocations where id = ?)));`;
                console.log("====================================");
                console.log(sql);
                console.log("====================================");
                pool.query(sql, [ticker_id, amount, date, ticker_id], (err, result) => {
                        if (err) {
                                reject(new Error(`addDividend saving error ${err.code}`));
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
        getDividend,
        addDividend,
        // updatePurchase,
};
