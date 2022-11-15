const pool = require("../Database/mysql-connect");

const getAllocations = (account, mode) => {
        return new Promise((resolve, reject) => {
                let sql = `SELECT a.*,count(ticker_id) as total,(CEIL(DATEDIFF(now(), start)/7)   * (acc.contribution*allocation/100) ) AS purchase_required,sum(purchase_amount) as purchased_amount ,sum(purchase_quantity) as purchased_quantity,(select sum(amount) from dividend where ticker_id = p.ticker_id) as dividend FROM account.purchases p right join allocations a on p.ticker_id = a.id left join accounts acc on a.account_id = acc.id`;
                let arr = null;
                if (mode === "current") {
                        sql += ` where end is null and type = 'Regular'`;
                } else if (mode === "past") {
                        sql += ` where end is not null and type = 'Regular'`;
                } else if (mode === "all") {
                        sql += ` where type = 'Regular'`;
                }
                if (account) {
                        sql += " and a.account_id = ?";
                        arr = [account];
                }
                sql += " group by 1 order by a.id;";
                pool.query(sql, arr, (err, result) => {
                        if (err) {
                                reject(new Error(`getAllocations saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const createAllocations = (ticker, exchange, allocation, type, start, end, account) => {
        return new Promise((resolve, reject) => {
                let sql = `INSERT INTO allocations SET ticker = ?,account_id =?,exchange = ?,allocation = ?,type= ?,start =?`;
                let arr = [ticker, account, exchange, allocation, type, start];
                if (end !== "") {
                        sql += `,end =?`;
                        arr.push(end);
                }

                pool.query(sql, arr, (err, result) => {
                        if (err) {
                                reject(new Error(`createAllocations saving error ${err.code}`));
                        } else {
                                resolve(result);
                        }
                });
        });
};

const checkforDuplicate = (ticker, account, amount, quantity, date) => {
        return new Promise((resolve, reject) => {
                let sql = `SELECT * from purchases where ticker_id in (select id from allocations  where ticker = ? and account_id  = ?) and purchase_amount = ? and purchase_quantity = ? and purchase_date = ?`;
                let arr = [ticker, account, amount, quantity, date];
                pool.query(sql, arr, (err, result) => {
                        if (err) {
                                reject(new Error(`checkforDuplicate saving error ${err.code}`));
                        } else {
                                resolve({
                                        data: result,
                                        object: {
                                                ticker,
                                                account,
                                                amount,
                                                quantity,
                                                date,
                                        },
                                });
                        }
                });
        });
};
const insertFromWealth = (ticker, account, amount, quantity, date) => {
        return new Promise((resolve, reject) => {
                let sql = ` INSERT INTO purchases set ticker_id = (select id from allocations  where ticker = ? and account_id  = ? and start < ? and end > ? limit 1), purchase_amount = ?, purchase_quantity = ?, purchase_date = ?`;
                let arr = [ticker, account, date, date, amount, quantity, date];
                pool.query(sql, arr, (err, result) => {
                        if (err) {
                                reject(new Error(`insertFromWealth saving error ${err.code}`));
                        } else {
                                resolve({
                                        data: result,
                                        object: {
                                                ticker,
                                                account,
                                                amount,
                                                quantity,
                                                date,
                                        },
                                });
                        }
                });
        });
};

module.exports = {
        getAllocations,
        createAllocations,
        checkforDuplicate,
        insertFromWealth,
};
