const express = require('express');
const mysql = require('mysql');

const app = express();
app.use(express.json());

const yhteys = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'customer',
  port: '3306'
});

yhteys.connect(err => {
  if (err) {
    console.error('MySQL-yhteys epäonnistui:', err);
  } else {
    console.log('MySQL-yhteys onnistui!');
  }
});

// POST
app.post('/api/customer', (req, res) => {
  const kentat = [
    { key: 'nimi', value: req.body.nimi },
    { key: 'osoite', value: req.body.osoite },
    { key: 'postinro', value: req.body.postinro },
    { key: 'postitmp', value: req.body.postitmp },
    { key: 'asty_avain', value: req.body.asty_avain }
  ];

  const puuttuvat = kentat
    .filter(k => k.value === undefined || k.value === null || k.value === '')
    .map(k => k.key);

  if (puuttuvat.length > 0) {
    const jarjestys = ['nimi','osoite','postinro','postitmp','asty_avain'];
    const puuttuvatJarjestyksessa = jarjestys.filter(k => puuttuvat.includes(k));
    return res.status(400).json({
      status: "NOT OK",
      message: "Pakollisia tietoja puuttuu:" + puuttuvatJarjestyksessa.join(',')
    });
  }

  const { nimi, osoite, postinro, postitmp, asty_avain } = req.body;
  const nyt = new Date();
  const muutospvm = nyt.toISOString().slice(0, 19).replace('T', ' ');

  const sql = `INSERT INTO asiakas (NIMI, OSOITE, POSTINRO, POSTITMP, ASTY_AVAIN, MUUTOSPVM)
    VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [nimi, osoite, postinro, postitmp, asty_avain, muutospvm];

  yhteys.query(sql, params, (err, result) => {
    if (err) {
      return res.status(400).json({
        status: "NOT OK",
        message: err.message
      });
    }

    const selectSql = `SELECT AVAIN, NIMI, OSOITE, POSTINRO, POSTITMP, ASTY_AVAIN FROM asiakas WHERE AVAIN = ? `;
    yhteys.query(selectSql, [result.insertId], (err2, rows) => {
      if (err2 || !rows || rows.length === 0) {
        return res.status(400).json({
          status: "NOT OK",
          message: err2 ? err2.message : "Lisättyä asiakasta ei löytynyt"
        });
      }
      const row = rows[0];
      res.status(201).json({
        avain: row.AVAIN,
        nimi: row.NIMI,
        osoite: row.OSOITE,
        postinro: row.POSTINRO,
        postitmp: row.POSTITMP,
        asty_avain: row.ASTY_AVAIN
      });
    });
  });
});

app.use((err, req, res, next) => {
  res.status(400).json({
    status: "NOT OK",
    message: err.message || "Tuntematon virhe"
  });
});

// DELETE
app.delete('/api/customer/:id', (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM asiakas WHERE AVAIN = ?";
  yhteys.query(sql, [id], (error, result) => {
    if (error) {
      return res.status(400).json({
        status: "NOT OK",
        message: error.message
      });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "NOT OK",
        message: `Poistettavaa asiakasta ${id} ei löydy`
      });
    }
    res.status(204).send();
  });
});

// PUT
app.put('/api/customer/:id', (req, res) => {
  const id = req.params.id;
  let { nimi, osoite, postinro, postitmp, asty_avain, muutospvm } = req.body;

  const kentat = [
    { key: 'nimi', value: nimi },
    { key: 'osoite', value: osoite },
    { key: 'postinro', value: postinro },
    { key: 'postitmp', value: postitmp },
    { key: 'asty_avain', value: asty_avain }
  ];
  let puuttuvat = kentat
    .filter(k => k.value === undefined || k.value === null || k.value === '')
    .map(k => k.key);

  if (!id || isNaN(id) || parseInt(id) <= 0) {
    puuttuvat.push('avain');
  }

  const jarjestys = ['nimi','osoite','postinro','postitmp','asty_avain','avain'];
  const puuttuvatJarjestyksessa = jarjestys.filter(k => puuttuvat.includes(k));
  if (puuttuvatJarjestyksessa.length > 0) {
    return res.status(400).json({
      status: "NOT OK",
      message: "Pakollisia tietoja puuttuu:" + puuttuvatJarjestyksessa.join(',')
    });
  }

  const doUpdate = (muutospvmToUse) => {
    yhteys.query("SELECT MUUTOSPVM FROM asiakas WHERE AVAIN = ?", [id], (err, rows) => {
      if (err) {
        return res.status(400).json({
          status: "NOT OK",
          message: err.message
        });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({
          status: "NOT OK",
          message: `Muokattavaa asiakasta ${id} ei löydy`
        });
      }

      const kannanMuutospvm = new Date(rows[0].MUUTOSPVM).toISOString();
      if (kannanMuutospvm !== muutospvmToUse) {
        return res.status(400).json({
          status: "NOT OK",
          message: "Tietoja ei voi päivittää, tiedot vanhentuneet"
        });
      }

      const uusiMuutospvm = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sql = `UPDATE asiakas SET NIMI=?, OSOITE=?, POSTINRO=?, POSTITMP=?, ASTY_AVAIN=?, MUUTOSPVM=? WHERE AVAIN=?`;
      const params = [nimi, osoite, postinro, postitmp, asty_avain, uusiMuutospvm, id];

      yhteys.query(sql, params, (error, result) => {
        if (error) {
          return res.status(400).json({
            status: "NOT OK",
            message: error.message
          });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({
            status: "NOT OK",
            message: `Muokattavaa asiakasta ${id} ei löydy`
          });
        }
        res.status(204).json({});
      });
    });
  };

  if (muutospvm === '') {
    return res.status(400).json({
      status: "NOT OK",
      message: "Tietoja ei voi päivittää, tiedot vanhentuneet"
    });
  } else if (!muutospvm) {
    yhteys.query("SELECT MUUTOSPVM FROM asiakas WHERE AVAIN = ?", [id], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        return res.status(404).json({
          status: "NOT OK",
          message: `Muokattavaa asiakasta ${id} ei löydy`
        });
      }
      const kannanMuutospvm = new Date(rows[0].MUUTOSPVM).toISOString();
      doUpdate(kannanMuutospvm);
    });
  } else {
    doUpdate(muutospvm);
  }
});

module.exports = app;