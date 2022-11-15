const pool = require("../Database/mysql-connect");

const getExpensebyExclude = (excludeArray) => {
        return new Promise((resolve, reject) => {
                let sql = `SELECT tags,sum(amount) as expense,Month(date) as month,(select sum(amount) from expense where month(date) = month and inward = 0 and tags not in (?)) as total_expense FROM account.expense where year(date) = 2022 and inward = 0 and tags not in (?) group by Month(date),tags order by Month(date) desc,expense desc;`;
                let arr = [excludeArray, excludeArray];
                console.log("====================================");
                console.log(sql, arr);
                console.log("====================================");
                pool.query(sql, arr, (err, result) => {
                        if (err) {
                                reject(new Error(`getExpense saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};
const getExpenceFilter = (tag, month) => {
        return new Promise((resolve, reject) => {
                let sql = `SELECT * from expense where tags = ? and month(date) = ? and inward = 0`;
                let arr = [tag, month];
                console.log("====================================");
                console.log(sql, arr);
                console.log("====================================");
                pool.query(sql, arr, (err, result) => {
                        if (err) {
                                reject(new Error(`getExpense saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const addExpense = (elements) => {
        return new Promise((resolve, reject) => {
                let sql = `INSERT IGNORE INTO expense (name,account,amount,inward,date,tags) VALUES ?`;
                pool.query(sql, [elements], (err, result) => {
                        if (err) {
                                reject(new Error(`addExpense saving error ${err.code}`));
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
const getExpenseByTags = () => {
        return new Promise((resolve, reject) => {
                let sql = `select id,name,tags from expense where iscustomtag = 0;`;
                pool.query(sql, null, (err, result) => {
                        if (err) {
                                reject(new Error(`getPurchaseByTags saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const updateTags = (id, tag) => {
        return new Promise((resolve, reject) => {
                let sql = `update expense set tags = ? where id = ?`;
                pool.query(sql, [tag, id], (err, result) => {
                        if (err) {
                                reject(new Error(`updateTags saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};
module.exports = {
        getExpensebyExclude,
        getExpenceFilter,
        addExpense,
        getExpenseByTags,
        updateTags,
        // updatePurchase,
};
