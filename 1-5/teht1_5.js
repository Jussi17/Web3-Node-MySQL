const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.json());

const yhteys = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'customer',
  port: 3306
});

yhteys.connect(err => {
  if (err) {
    console.error('MySQL-yhteys epäonnistui:', err);
  } else {
    console.log('MySQL-yhteys onnistui!');
  }
});

app.get('/api/customer', (req, res) => {
  let sql = `
    SELECT asiakas.AVAIN as AVAIN, 
      asiakas.NIMI as NIMI, 
      asiakas.OSOITE as OSOITE, 
      asiakas.POSTINRO as POSTINRO, 
      asiakas.POSTITMP as POSTITMP,
      asiakas.LUONTIPVM as LUONTIPVM, 
      asiakas.ASTY_AVAIN as ASTY_AVAIN,
      asiakastyyppi.SELITE as ASTY_SELITE
    FROM asiakas
    LEFT JOIN asiakastyyppi ON asiakas.ASTY_AVAIN = asiakastyyppi.AVAIN
    WHERE 1=1
  `;
  const params = [];

  if (req.query.nimi && req.query.nimi.trim() !== "") {
    sql += " AND LOWER(asiakas.NIMI) LIKE LOWER(?)";
    params.push(req.query.nimi.toLowerCase() + '%'); 
  }
  if (req.query.osoite && req.query.osoite.trim() !== "") {
    sql += " AND LOWER(asiakas.OSOITE) LIKE LOWER(?)";
    params.push(req.query.osoite.toLowerCase() + '%'); 
  }
  if (req.query.asty && req.query.asty.trim() !== "") {
    sql += " AND asiakas.ASTY_AVAIN = ?";
    params.push(req.query.asty);
  }

  yhteys.query(sql, params, (err, results) => {
    if (err || !results || results.length === 0) {
      return res.status(200).json({
        status: "NOT OK",
        message: "Virheellinen haku",
        data: []
      });
    }
    res.status(200).json({
      status: "OK",
      message: "",
      data: results
    });
  });
});

app.use((req, res) => {
  const url = req.originalUrl;
  yhteys.query('SELECT COUNT(*) AS count FROM asiakas', (err, results) => {
    let count = 0;
    if (!err && results && results.length > 0) {
      count = results[0].count;
    }
    res.status(404).json({
      message: "Osoite oli virheellinen:" + url,
      count: count
    });
  });
});

module.exports = app;