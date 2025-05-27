const express = require('express');
const mysql = require('mysql');
var bodyParser = require('body-parser');
const app = express();
app.use(express.json());
app.use(bodyParser.json());

const yhteys = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'student',
    port: 3306
});

yhteys.connect(err => {
    if (err) {
        console.error('MySQL-yhteys epäonnistui:', err);
    } else {
        console.log('MySQL-yhteys onnistui!');
    }
});

//GET
app.get('/api/student', (req, res) => {
    let { etunimi, sukunimi, typeid } = req.query;
    let sql = `SELECT student.id, student.etunimi, student.sukunimi, osoite.lahiosoite, student.postinro, postinro.postitoimipaikka, student.typeid AS tyyppi_id, studentype.selite AS tyyppi_selite
    FROM student
    LEFT JOIN osoite ON student.osoite_idosoite = osoite.idosoite
    LEFT JOIN postinro ON student.postinro = postinro.postinumero
    LEFT JOIN studentype ON student.typeid = studentype.typeid
    WHERE 1=1
  `;
    let params = [];

    if (etunimi) {
        if (etunimi.endsWith('*')) {
            sql += " AND student.etunimi LIKE ?";
            params.push(etunimi.slice(0, -1) + '%');
        } else {
            sql += " AND student.etunimi = ?";
            params.push(etunimi);
        }
    }
    if (sukunimi) {
        if (sukunimi.endsWith('*')) {
            sql += " AND student.sukunimi LIKE ?";
            params.push(sukunimi.slice(0, -1) + '%');
        } else {
            sql += " AND student.sukunimi = ?";
            params.push(sukunimi);
        }
    }
    if (typeid) {
        sql += " AND student.typeid = ?";
        params.push(typeid);
    }

    sql += " ORDER BY student.id ASC";

    yhteys.query(sql, params, (err, rows) => {
        if (err) {
            return res.status(400).json({
                statusid: "NOT OK",
                message: err.message
            });
        }
        res.status(200).json(rows);
    });
});

app.get('/api/studenttype', (req, res) => {
    const { all } = req.query;
    let sql = "SELECT typeid, selite, status FROM studentype";
    let params = [];
    if (all !== "1") {
        sql += " WHERE status = 0";
    }
    sql += " ORDER BY typeid ASC";
    yhteys.query(sql, params, (err, rows) => {
        if (err) {
            return res.status(400).json({
                statusid: "NOT OK",
                message: err.message
            });
        }
        const data = rows.map(r => ({
            typeid: r.typeid,
            selite: r.selite,
            status: r.status === 0 ? "KAYTOSSA" : "EI KAYTOSSA"
        }));
        res.status(200).json(data);
    });
});

app.get('/api/student/by/postinumero/:postinumero', (req, res) => {
    const { postinumero } = req.params;
    let sql, params = [];

    if (postinumero === "-100") {
        sql = `
            SELECT p.postinumero, COUNT(s.id) AS count
            FROM postinro p
            LEFT JOIN student s ON p.postinumero = s.postinro
            GROUP BY p.postinumero
            ORDER BY p.postinumero ASC
        `;
    } else {
        sql = `
            SELECT p.postinumero, COUNT(s.id) AS count
            FROM postinro p
            LEFT JOIN student s ON p.postinumero = s.postinro
            WHERE p.postinumero = ?
            GROUP BY p.postinumero
            ORDER BY p.postinumero ASC
        `;
        params.push(postinumero);
    }

    yhteys.query(sql, params, (err, rows) => {
        if (err) {
            return res.status(400).json({
                statusid: "NOT OK",
                message: err.message
            });
        }
        res.status(200).json(rows);
    });
});

//POST
app.post('/api/student', (req, res) => {
    const { etunimi, sukunimi, osoiteid, lahiosoite, postinro, postitoimipaikka, typeid } = req.body;
const kentat = [
  { key: 'etunimi', value: etunimi },
  { key: 'sukunimi', value: sukunimi },
  { key: 'postinro', value: postinro },
  { key: 'typeid', value: typeid }
];

if ((lahiosoite === undefined || lahiosoite === '') &&
    (osoiteid === undefined || isNaN(osoiteid) || Number(osoiteid) < 0)) {
  kentat.push({ key: 'osoiteid', value: undefined });
}

const puuttuvat = kentat
  .filter(k =>
    k.value === undefined ||
    k.value === null ||
    k.value === '' ||
    (k.key === 'typeid' && (isNaN(k.value) || Number(k.value) < 0))
  )
  .map(k => k.key);

    if (puuttuvat.length > 0) {
        return res.status(400).json({
            statusid: "NOT OK",
            message: "Pakollisia tietoja puuttuu:" + puuttuvat.join(',')
        });
    }

    yhteys.query('SELECT selite FROM studentype WHERE typeid = ? AND status = 1', [typeid], (err, rows) => {
        if (err) {
            return res.status(400).json({
                statusid: "NOT OK",
                message: err.message
            });
        }
        if (rows.length > 0) {
            return res.status(400).json({
                statusid: "NOT OK",
                message: `Tyyppi ${rows[0].selite} ei ole käytössä`
            });
        }

        const checkSql = `SELECT * FROM student WHERE etunimi = ? AND sukunimi = ?`;
        yhteys.query(checkSql, [etunimi, sukunimi], (err, results) => {
            if (err) {
                return res.status(400).json({
                    statusid: "NOT OK",
                    message: err.message
                });
            }
            if (results.length > 0) {
                return res.status(400).json({
                    statusid: "NOT OK",
                    message: `Opiskelija ${etunimi},${sukunimi} on jo olemassa`
                });
            }

            function haeTaiLisaaOsoite(callback) {
                if (osoiteid) return callback(null, osoiteid);
                yhteys.query('SELECT idosoite FROM osoite WHERE lahiosoite = ?', [lahiosoite], (err, rows) => {
                    if (err) return callback(err);
                    if (rows.length > 0) return callback(null, rows[0].idosoite);
                    yhteys.query('INSERT INTO osoite (lahiosoite) VALUES (?)', [lahiosoite], (err, result) => {
                        if (err) return callback(err);
                        callback(null, result.insertId);
                    });
                });
            }

            function haeTaiLisaaPostinro(callback) {
                yhteys.query('SELECT postinumero FROM postinro WHERE postinumero = ?', [postinro], (err, rows) => {
                    if (err) return callback(err);
                    if (rows.length > 0) return callback(null, postinro);
                    if (!postitoimipaikka || postitoimipaikka === '') {
                        return callback({ message: "Pakollisia tietoja puuttuu:postitoimipaikka" });
                    }
                    yhteys.query('INSERT INTO postinro (postinumero, postitoimipaikka) VALUES (?, ?)', [postinro, postitoimipaikka], (err) => {
                        if (err) return callback(err);
                        callback(null, postinro);
                    });
                });
            }

            haeTaiLisaaOsoite((err, osoite_id) => {
                if (err) {
                    return res.status(400).json({
                        statusid: "NOT OK",
                        message: err.message || "Osoitteen käsittely epäonnistui"
                    });
                }
                haeTaiLisaaPostinro((err, postinumero) => {
                    if (err) {
                        return res.status(400).json({
                            statusid: "NOT OK",
                            message: err.message || "Postinumeron käsittely epäonnistui"
                        });
                    }

                    const sql = `INSERT INTO student (etunimi, sukunimi, osoite_idosoite, postinro, typeid)
                       VALUES (?, ?, ?, ?, ?)`;
                    const params = [etunimi, sukunimi, osoite_id, postinumero, typeid];

                    yhteys.query(sql, params, (err, result) => {
                        if (err) {
                            return res.status(400).json({
                                statusid: "NOT OK",
                                message: err.message
                            });
                        }
                        res.status(201).json({ statusid: "OK", message: "Opiskelija lisätty" });
                    });
                });
            });
        });
    });
});

app.use((err, req, res, next) => {
    res.status(400).json({
        status: "NOT OK",
        message: err.message || "Tapahtui virhe"
    });
});

app.listen(3004, () => {
    console.log('Palvelin käynnissä portissa 3004');
});

module.exports = app;