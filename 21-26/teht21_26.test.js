const app = require('./teht21_26/teht21')
const init = require('./teht21_26.db_test')

const supertest = require('supertest')
const request = supertest(app)

let etunimi = 'Teija ' + Date.now();
let sukunimi = 'Testaaja ' + Date.now();
let lahiosoite = "Testaajanpolku 13-20";
let postinro = "70100";
let postitoimipaikka = "Koodarinkylä";
let typeid = 1;
let osoiteid = 3

//HUOM! AINA ennen kuin ajat testiä, tyhjennä kannan data ja lisää sinne testidata. Tiedostossa student kannan data.sql
// on sql-lauseet, jolla kannan data tyhjennetään ja lisätään testidata!

// Alla on myös koodi, joka ajetaan aina ennen testejä ja tuo koodi alustaa kannan 
// samoilla lauseilla jotka ovat em. tiedostossa
// Laita tarvittaessa kommentteihin ao. koodi, jos et halua hidasta testejä ja/tai tyhjentää dataa ennen jokaista testiä
beforeAll(async () => {
    await init.initializeDatabase();
});

// HUOM! Jos haluat ohittaa tehtävän 13 testin (ettet lisää koko ajan samaa opiskelijaa)
// laita describe.skip (toimii myös test.skip)
describe("Tehtävä 21", () => {

    test('Tehtävä 21, haetaan vain aktiiviset asiakkaat', async () => {
        const response = await request.get("/api/asiakas?all=1");

        expect(response.status).toBe(200);
        const data = response.body;

        expect(data.length).toBe(3);

        const a = data[0];
        expect(a.id).toBe(5);
        expect(a.nimi).toBe("Maija");
        expect(a.kayntiosoite).toBe("Opistotie 2");
        expect(a.postinumero).toBe("70100");
        expect(a.postitoimipaikka).toBe("Kuopio");
        expect(a.status).toBe(0);
        expect(a.tilauslkm).toBe(1);
        expect(a.tilausyht).toBe(50);
        expect(a.tilausyht_verollinen).toBe(62);
    });

    test('Tehtävä 21, haetaan kaikki asiakkaat', async () => {
        const response = await request.get("/api/asiakas?all=0");

        expect(response.status).toBe(200);
        const data = response.body;

        expect(data.length).toBe(4);

        const a = data[3];
        expect(a.id).toBe(8);
        expect(a.nimi).toBe("Heikki");
        expect(a.kayntiosoite).toBe("Koppelokuja 7 e 45");
        expect(a.postinumero).toBe("00100");
        expect(a.postitoimipaikka).toBe("Helsinki");
        expect(a.status).toBe(1);
        expect(a.tilauslkm).toBe(1);
        expect(a.tilausyht).toBe(190);
        expect(a.tilausyht_verollinen).toBe(202);
    });
});


describe("Tehtävä 22", () => {

    test('Tehtävä 22, haetaan asiakkaan tilaukset ja tilausrivit, tarkista tilaukset', async () => {
        const response = await request.get("/api/tilaus/6");

        expect(response.status).toBe(200);
        const tilaukset = response.body.tilaukset;

        expect(tilaukset.length).toBe(2);

        const t = tilaukset[0];
        expect(t.id).toBe(1);
        expect(t.tilausnumero).toBe("2034");
        expect(t.tilauspvm).toBe("2021-04-06T21:00:00.000Z");
        expect(t.toimituspvm).toBe("2021-05-18T21:00:00.000Z");
        expect(t.hintayht_veroton).toBe(340);
        expect(t.hintayht).toBe(421.6);
    });

    test('Tehtävä 22, haetaan asiakkaan tilaukset ja tilausrivit, tarkista tilausrivit', async () => {
        const response = await request.get("/api/tilaus/6");

        expect(response.status).toBe(200);
        const rivit = response.body.tilausrivit;

        expect(rivit.length).toBe(4);

        const t = rivit[3];
        expect(t.id).toBe(11);
        expect(t.tilausid).toBe(10);
        expect(t.tuote).toBe("Lisävalot");
        expect(t.maara).toBe(3);
        expect(t.yksikko).toBe("kpl");
        expect(t.huomautus).toBe(null);
        expect(t.veroprosentti).toBe(24);
        expect(t.toimitettu).toBe(1);
        expect(t.hintayht_veroton).toBe(300);
        expect(t.hintayht).toBe(372);
    });

});

const newTilaus = {
    tilaus:
    {
        tilausnumero: "1001655",
        tilauspvm: "2022-03-29T06:00:00.000Z",
        toimituspvm: "2022-05-19T20:00:00.000Z",
        asiakasid: 5
    },
    tilausrivit: [
        {
            tuote: "Kovalevy",
            maara: 10,
            yksikko: "kpl",
            huomautus: "SD-levy",
            veroprosentti: 20,
            toimitettu: 0,
            yksikkohinta: 245
        },
        {
            tuote: "Näppäimistö",
            maara: 1,
            yksikko: "kpl",
            huomautus: null,
            veroprosentti: 24,
            toimitettu: 0,
            yksikkohinta: 180
        }
    ]
}

describe("Tehtävä 23", () => {

    test('Tehtävä 23, lisätään tilaus ja tilausrivit', async () => {

        const response = await request.post("/api/tilaus")
            .set('Content-type', 'application/json')
            .send(newTilaus);

        expect(response.status).toBe(201);
     });

     test('Tehtävä 23, tarkistetaan lisätty tilaus', async () => {
        const response = await request.get("/api/tilaus/" + newTilaus.tilaus.asiakasid);

        expect(response.status).toBe(200);
        console.log("23:", response.body)
        const tilaukset = response.body.tilaukset;

        expect(tilaukset.length).toBe(2);

        const t = tilaukset[1];
        expect(t.tilausnumero).toBe(newTilaus.tilaus.tilausnumero);
        // expect(t.tilauspvm).toBe(newTilaus.tilaus.tilauspvm);
        // expect(t.toimituspvm).toBe(newTilaus.tilaus.toimituspvm);
        expect(t.hintayht_veroton).toBe(2630);
        expect(t.hintayht).toBe(3163.2);
    });

    test('Tehtävä 23, tarkistetaan lisätyt tilausrivit', async () => {
        const response = await request.get("/api/tilaus/" + newTilaus.tilaus.asiakasid);

        expect(response.status).toBe(200);
        const tilausrivit = response.body.tilausrivit;

        expect(tilausrivit.length).toBe(3);
        const addedRivi = tilausrivit[2];

        const tr = newTilaus.tilausrivit[1];

        expect(addedRivi.tuote).toBe(tr.tuote);
        expect(addedRivi.maara).toBe(tr.maara);
        expect(addedRivi.yksikko).toBe(tr.yksikko);
        expect(addedRivi.huomautus).toBe(tr.huomautus);
        expect(addedRivi.veroprosentti).toBe(tr.veroprosentti);
        expect(addedRivi.toimitettu).toBe(tr.toimitettu);
        expect(addedRivi.hintayht_veroton).toBe(180);
        expect(addedRivi.hintayht).toBe(223.2);
    });
});

describe("Tehtävä 24", () => {

    test('Tehtävä 24, poistetaan asiakas, jonka saa poistaa', async () => {

        let response = await request.delete("/api/asiakas/5");

        expect(response.status).toBe(204);

        // tarkistetaan että asiakas poistetiin
        response = await request.get("/api/tilaus/5");

        expect(response.status).toBe(200);
        expect(response.body.tilaukset.length).toBe(0);
        expect(response.body.tilausrivit.length).toBe(0);
     });

     test('Tehtävä 24, poistetaan asiakas, jota EI saa poistaa', async () => {

        let response = await request.delete("/api/asiakas/6");

        expect(response.status).toBe(400);
        const {message} = response.body;
        expect(message).toBe("Asiakasta ei voi poistaa, koska siihen liittyy toimitettu tilausrivi");

        // tarkistetaan että asiakas löytyy vielä
        response = await request.get("/api/tilaus/6");

        expect(response.status).toBe(200);
        expect(response.body.tilaukset.length).toBe(2);
        expect(response.body.tilausrivit.length).toBe(4);
     });

});

describe("Tehtävä 25", () => {

     test('Tehtävä 25, poistetaan asiakas, jota EI saa poistaa', async () => {

        let response = await request.delete("/api/asiakas/6");

        expect(response.status).toBe(400);
        const {message, tilausrivit} = response.body;
        expect(message).toBe("Asiakasta ei voi poistaa, koska siihen liittyy toimitettu tilausrivi");

        expect(tilausrivit.length).toBe(3);

        const tr = tilausrivit[1];

        expect(tr.tuote).toBe("Tuoli");
        expect(tr.maara).toBe(4);
        expect(tr.yksikko).toBe("kpl");
        expect(tr.huomautus).toBe(null);
        expect(tr.veroprosentti).toBe(24);
        expect(tr.toimitettu).toBe(1);
        expect(tr.hintayht_veroton).toBe(40);
        expect(tr.hintayht).toBe(49.6);
     });

});

const muutettava_tr =
[
    {
        tuote: "Renkaat",
        maara: 8,
        yksikko: "kpl",
        huomautus: "Muutettu veroprosentti, maara ja toimitettu",
        veroprosentti: 22,
        toimitettu: 1,
        yksikkohinta : 50
    },
    {
        tuote: "Aluvanteet",
        maara: 4,
        yksikko: "sarja",
        huomautus: "Muutettu tuote ja yksikko",
        veroprosentti: 24,
        toimitettu: 0,
        yksikkohinta : 125
    }
];

describe("Tehtävä 26", () => {

    test('Tehtävä 26, muutetaan tilausrivit', async () => {

       let response = await request.put("/api/tilausrivi/2")
        .set('Content-type', 'application/json')
        .send(muutettava_tr);

       expect(response.status).toBe(204);

        // tarkistetaan että tilausrivit ovat muuttuneet
        response = await request.get("/api/tilaus/7");

        expect(response.status).toBe(200);
        const {tilausrivit} = response.body;
        expect(tilausrivit.length).toBe(3);

        let tr = tilausrivit[1];
        expect(tr.tuote).toBe(muutettava_tr[0].tuote);
        expect(tr.maara).toBe(muutettava_tr[0].maara);
        expect(tr.yksikko).toBe(muutettava_tr[0].yksikko);
        expect(tr.huomautus).toBe(muutettava_tr[0].huomautus);
        expect(tr.veroprosentti).toBe(muutettava_tr[0].veroprosentti);
        expect(tr.toimitettu).toBe(muutettava_tr[0].toimitettu);
        expect(tr.yksikkohinta).toBe(muutettava_tr[0].yksikkohinta);
    });

});
