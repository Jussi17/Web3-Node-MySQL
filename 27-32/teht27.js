const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root', 
  database: 'jalkapallo'
};
const pool = mysql.createPool(dbConfig);

router.get('/pages/football/27', (req, res) => {
  res.render('index', {
    choices: ['Help', 'Info', 'News', 'Management', 'Teams'],
    events: [
      '01.05.2019 Germany - Finland',
      '04.07.2019 Football tournament in Regensburg',
      '12.11.2019 Season highlights',
      '28.11.2019 Training season starts',
    ]
  });
});

router.get('/pages/football/28', (req, res) => {
  pool.query(
    "SELECT aika, kuvaus FROM tapahtuma WHERE aika > CURDATE() ORDER BY aika LiMIT 4",
    (error, results) => {
      if (error) {
        return res.status(500).send('Tietokantavirhe: ' + error.message);
      }
      const events = results.map(r => {
        const date = new Date(r.aika);
        const formattedDate = date.toLocaleDateString('fi-FI');
        return `${formattedDate} ${r.kuvaus}`;
      });
      res.render('index', {
        choices: ['Help', 'Info', 'News', 'Management', 'Teams'],
        events
      });
    }
  );
});

router.get('/pages/football/29', (req, res) => {
  res.render('index', {
    choices: ['Choose ...', 'Help', 'Info', 'News', 'Management', 'Teams'],
    events: null 
  });
});

router.get('/events', (req, res) => {
  pool.query(
    "SELECT aika, kuvaus FROM tapahtuma WHERE aika > CURDATE() ORDER BY aika",
    (error, results) => {
      if (error) {
        return res.status(500).send('Tietokantavirhe: ' + error.message);
      }
      const events = results.map(r => {
        const date = new Date(r.aika);
        const formattedDate = date.toLocaleDateString('fi-FI');
        return `${formattedDate} ${r.kuvaus}`;
      });
      res.render('events', { events });
    }
  );
});

router.get('/leaguetable', (req, res) => {
  pool.query(
    `SELECT 
        joukkue.Nimi AS joukkue, 
        joukkue.Kaupunki AS kaupunki, 
        joukkue.Perustamisvuosi AS perustamisvuosi,
        sarjataulukko.Ottelumaara AS ottelut,
        sarjataulukko.Voittoja AS voitot,
        sarjataulukko.Tappioita AS tappiot,
        sarjataulukko.Tasapeleja AS tasapelit,
        (sarjataulukko.Tehdyt_maalit - sarjataulukko.Paastetyt_maalit) AS maaliero,
        sarjataulukko.Pisteet AS pisteet
     FROM sarjataulukko
     JOIN joukkue ON sarjataulukko.Joukkue_id = joukkue.Id
     ORDER BY sarjataulukko.Pisteet DESC, maaliero DESC`,
    (error, results) => {
      if (error) {
        return res.status(500).send('Tietokantavirhe: ' + error.message);
      }
      res.render('leaguetable', { table: results });
    }
  );
});

router.get('/playersandteams', (req, res) => {
  pool.query(
    `SELECT Etunimi, Sukunimi, Pelinumero FROM pelaaja ORDER BY Sukunimi, Etunimi`,
    (error, players) => {
      if (error) {
        return res.status(500).send('Tietokantavirhe: ' + error.message);
      }
      pool.query(
        `SELECT Nimi, Kaupunki, Perustamisvuosi FROM joukkue ORDER BY Nimi`,
        (error, teams) => {
          if (error) {
            return res.status(500).send('Tietokantavirhe: ' + error.message);
          }
          res.render('playersandteams', { players, teams });
        }
      );
    }
  );
});

router.get('/teams', (req, res) => {
  pool.query(
    "SELECT Id, Nimi, Kaupunki, Perustamisvuosi FROM joukkue ORDER BY Nimi",
    (error, teams) => {
      if (error) {
        return res.status(500).send('Tietokantavirhe: ' + error.message);
      }
      res.render('teams', { teams });
    }
  );
});

router.get('/players/:teamId', (req, res) => {
  pool.query(
    "SELECT Etunimi, Sukunimi, Pelinumero FROM pelaaja WHERE Joukkue_id = ? ORDER BY Sukunimi, Etunimi",
    [req.params.teamId],
    (error, players) => {
      if (error) {
        return res.status(500).send('Tietokantavirhe: ' + error.message);
      }
      res.render('players', { players });
    }
  );
});

module.exports = router;