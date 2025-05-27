var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 3306,
    database: 'tilaus'
});

const executeSQL = (query, params) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, function (error, results, fields) {
            error ? reject(error) : resolve(results);
        });
    })
}

const getTypes = (lyhenne, selite) => {

    return new Promise((resolve, reject) => {
        let query = "SELECT AVAIN, LYHENNE, SELITE from asiakastyyppi WHERE 1=1";

        let params = [];
        if (lyhenne != null) {
            query += " AND LYHENNE = ? "
            params.push(lyhenne);
        }

        console.log("query:" + query);
        connection.query(query, params, function (error, result, fields) {

            if (error) {
                console.log("Virhe", error);
                reject(error);
            }
            else {
                console.log("result", result);
                resolve(result);
            }
        });
    })

}

const getOrdersAndRowsByCustomerId = (asiakasid) => {
    return new Promise((resolve, reject) => {
        let tilausQuery = `
            SELECT 
                t.*, 
                IFNULL(SUM(tr.maara * tr.yksikkohinta), 0) AS hintayht_veroton,
                IFNULL(SUM(tr.maara * tr.yksikkohinta * (1.0 + tr.veroprosentti/100.0)), 0) AS hintayht
            FROM tilaus t LEFT JOIN tilausrivi tr ON t.id = tr.tilausid
            WHERE t.asiakasid = ? GROUP BY t.id ORDER BY t.id `;

        let rivitQuery = `
            SELECT 
                tr.*, 
                (tr.maara * tr.yksikkohinta) AS hintayht_veroton,
                (tr.maara * tr.yksikkohinta * (1.0 + tr.veroprosentti/100.0)) AS hintayht
            FROM tilausrivi tr JOIN tilaus t ON tr.tilausid = t.id WHERE t.asiakasid = ? ORDER BY tr.id `;

        connection.query(tilausQuery, [asiakasid], function (err, tilaukset) {
            if (err) return reject(err);
            connection.query(rivitQuery, [asiakasid], function (err2, rivit) {
                if (err2) return reject(err2);
                resolve({ tilaukset, tilausrivit: rivit });
            });
        });
    });
};

const addOrderWithRows = (tilaus, tilausrivit) => {
    return new Promise((resolve, reject) => {
        if (!tilausrivit || tilausrivit.length === 0) {
            return reject(new Error("Tilausta ei lisätty, tilausrivit puuttuvat"));
        }
        connection.beginTransaction(err => {
            if (err) return reject(err);
            connection.query(
                "INSERT INTO tilaus (tilausnumero, tilauspvm, toimituspvm, asiakasid) VALUES (?, ?, ?, ?)",
                [tilaus.tilausnumero, tilaus.tilauspvm, tilaus.toimituspvm, tilaus.asiakasid],
                (err, result) => {
                    if (err) return connection.rollback(() => reject(err));
                    const tilausid = result.insertId;
                    const values = tilausrivit.map(rivi => [
                        tilausid, rivi.tuote, rivi.maara, rivi.yksikko, rivi.huomautus, rivi.yksikkohinta, rivi.veroprosentti, rivi.toimitettu
                    ]);
                    connection.query(
                        "INSERT INTO tilausrivi (tilausid, tuote, maara, yksikko, huomautus, yksikkohinta, veroprosentti, toimitettu) VALUES ?",
                        [values],
                        (err2) => {
                            if (err2) return connection.rollback(() => reject(err2));
                            connection.commit(err3 => {
                                if (err3) return connection.rollback(() => reject(err3));
                                resolve({ tilausid });
                            });
                        }
                    );
                }
            );
        });
    });
};

const deleteCustomer = async (asiakasid) => {
    return new Promise((resolve, reject) => {
        const checkQuery = `
            SELECT tr.* FROM tilausrivi tr
            JOIN tilaus t ON tr.tilausid = t.id
            WHERE t.asiakasid = ? AND tr.toimitettu = 1
        `;
        connection.query(checkQuery, [asiakasid], (err, rows) => {
            if (err) return reject(err);
            if (rows.length > 0) {
                rows = rows.map(tr => ({
                    ...tr,
                    hintayht_veroton: tr.maara * tr.yksikkohinta,
                    hintayht: tr.maara * tr.yksikkohinta * (1.0 + tr.veroprosentti / 100.0)
                }));
                return reject({ message: "Asiakasta ei voi poistaa, koska siihen liittyy toimitettu tilausrivi", tilausrivit: rows });
            }

            connection.beginTransaction(err => {
                if (err) return reject(err);
                connection.query(
                    "DELETE tr FROM tilausrivi tr JOIN tilaus t ON tr.tilausid = t.id WHERE t.asiakasid = ?",
                    [asiakasid],
                    (err) => {
                        if (err) return connection.rollback(() => reject(err));
                        connection.query(
                            "DELETE FROM tilaus WHERE asiakasid = ?",
                            [asiakasid],
                            (err) => {
                                if (err) return connection.rollback(() => reject(err));
                                connection.query(
                                    "DELETE FROM asiakas WHERE id = ?",
                                    [asiakasid],
                                    (err) => {
                                        if (err) return connection.rollback(() => reject(err));
                                        connection.commit(err => {
                                            if (err) return connection.rollback(() => reject(err));
                                            resolve();
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    });
};

const updateOrderRows = (tilausid, rivit) => {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(err => {
            if (err) return reject(err);
            connection.query(
                "DELETE FROM tilausrivi WHERE tilausid = ?",
                [tilausid],
                (err) => {
                    if (err) return connection.rollback(() => reject(err));
                    if (!rivit || rivit.length === 0) {
                        return connection.commit(err => {
                            if (err) return connection.rollback(() => reject(err));
                            resolve();
                        });
                    }
                    const values = rivit.map(rivi => [
                        tilausid, rivi.tuote, rivi.maara, rivi.yksikko, rivi.huomautus, rivi.yksikkohinta, rivi.veroprosentti, rivi.toimitettu
                    ]);
                    connection.query(
                        "INSERT INTO tilausrivi (tilausid, tuote, maara, yksikko, huomautus, yksikkohinta, veroprosentti, toimitettu) VALUES ?",
                        [values],
                        (err2) => {
                            if (err2) return connection.rollback(() => reject(err2));
                            connection.commit(err3 => {
                                if (err3) return connection.rollback(() => reject(err3));
                                resolve();
                            });
                        }
                    );
                }
            );
        });
    });
};

const getCustomersWithOrderInfo = (onlyActive) => {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT 
                a.id, a.nimi, a.kayntiosoite, a.postinumero, a.postitoimipaikka, a.status,
                COUNT(DISTINCT t.id) AS tilauslkm,
                IFNULL(SUM(tr.maara * tr.yksikkohinta), 0) AS tilausyht,
                IFNULL(SUM(tr.maara * tr.yksikkohinta * (1.0 + tr.veroprosentti/100.0)), 0) AS tilausyht_verollinen
            FROM asiakas a LEFT JOIN tilaus t ON a.id = t.asiakasid LEFT JOIN tilausrivi tr ON t.id = tr.tilausid
            ${onlyActive ? "WHERE a.status = 0" : ""}
            GROUP BY a.id, a.nimi, a.kayntiosoite, a.postinumero, a.postitoimipaikka, a.status
            ORDER BY a.id
        `;
        connection.query(query, [], function (error, result) {
            if (error) reject(error);
            else resolve(result);
        });
    });
};

module.exports = {

    getCustomerTypes: () => {
        let sql = "SELECT * FROM ASIAKASTYYPPI "
        return executeSQL(sql, []);
    },
    getCustomerTypesByLyhenne: (lyhenne) => {
        return getTypes(lyhenne, null);
    },

    getCustomers: (nimi, osoite) => {

        return new Promise((resolve, reject) => {
            let query = "SELECT * from asiakas ";

            connection.query(query, function (error, result, fields) {

                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
        })
    },
    getOrdersAndRowsByCustomerId,
    addOrderWithRows,
    deleteCustomer,
    updateOrderRows,
    getCustomersWithOrderInfo,
}