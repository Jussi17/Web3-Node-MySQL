const app = require('./teht6_12') // Link to your server file
const init = require('./teht6_12.db_test') 

const supertest = require('supertest')
const request = supertest(app)

let nimi = 'Testaa 6-12';
let osoite = "Testaajanpolku 8";
let postinumero = "99565";
let postitmp = "Koodarinkylä";
let asty_avain = 3; 

beforeAll(async () => {
  await init.initializeDatabase();
});


describe("Tehtävä 6", () => {

  test('Tehtävä 6, lisätään uusi asiakas', async () => {
    const response = await request.post("/api/customer")
                        .set('Content-type', 'application/json')
                        .send({ nimi : nimi, osoite : osoite, postinro : postinumero, postitmp : postitmp, asty_avain : asty_avain });
                        
    // Status koodi pitää olla 201
    expect(response.status).toBe(201)

    const a = response.body;

    // Tarkistetaan että objektissa on vaaditut datat
    expect(a.avain).toBeGreaterThan(1);
    expect(a.nimi).toBe(nimi);
    expect(a.osoite).toBe(osoite);
    expect(a.postinro).toBe(postinumero);
    expect(a.postitmp).toBe(postitmp);
    expect(a.asty_avain).toBe(asty_avain);

  });
});

describe("Tehtävä 7", () => {

  test('Tehtävä 7, lisätään uusi asiakas, pakolliset kentät ', async () => {

    const response = await request.post("/api/customer")
                        .set('Content-type', 'application/json')
                        .send({ nimi : nimi, postinro : postinumero, postitmp : postitmp });
                        
    // Status koodi pitää olla 400
    expect(response.status).toBe(400)

    const data = response.body;

    expect(data.status).toBe("NOT OK")
    expect(data.message).toBe("Pakollisia tietoja puuttuu:osoite,asty_avain")

  });
});

describe("Tehtävä 8", () => {

  test('Tehtävä 8, poistetaan asiakas', async () => {
    const response = await request.delete("/api/customer/2")
                        
    // Status koodi pitää olla 204
    expect(response.status).toBe(204)
  });
});

describe("Tehtävä 9", () => {

  const avain = 2098754;
  test('Tehtävä 9, poistetaan asiakas jota ei ole olemassa', async () => {
    const response = await request.delete(`/api/customer/${avain}`)
                        
    // Status koodi pitää olla 404
    expect(response.status).toBe(404)

    const data = response.body;

    expect(data.status).toBe("NOT OK")
    expect(data.message).toBe(`Poistettavaa asiakasta ${avain} ei löydy`)

  });
});

describe("Tehtävä 10", () => {

  test('Tehtävä 10, muokataan asiakasta', async () => {

    postinumero = "70100";
    asty_avain = 4;

    const response = await request.put("/api/customer/4")
                        .set('Content-type', 'application/json')
                        .send({ nimi : nimi, osoite : osoite, postinro : postinumero, postitmp : postitmp, asty_avain : asty_avain });
                        
    // Status koodi pitää olla 204
    // console.log("R", response)
    expect(response.status).toBe(204)

    const a = response.body;

    expect(a).toStrictEqual({});
  });
});

describe("Tehtävä 11", () => {

  test('Tehtävä 11, muokataan asiakasta, pakolliset kentät ', async () => {
    const response = await request.put("/api/customer/100001")
                        .set('Content-type', 'application/json')
                        .send({ });
                        
    // Status koodi pitää olla 400
    expect(response.status).toBe(400)

    const data = response.body;

    expect(data.status).toBe("NOT OK")
    expect(data.message).toBe("Pakollisia tietoja puuttuu:nimi,osoite,postinro,postitmp,asty_avain")

  });
});

describe("Tehtävä 12", () => {

  test('Tehtävä 12, muokataan asiakasta joka on jo muuttunut kannassa', async () => {

    postinumero = "70100";
    asty_avain = 4;
    muutospvm = ""

    const response = await request.put("/api/customer/4")
                        .set('Content-type', 'application/json')
                        .send({ nimi : nimi, osoite : osoite, postinro : postinumero, postitmp : postitmp, asty_avain : asty_avain, muutospvm : muutospvm });
                        
    // Status koodi pitää olla 400
    expect(response.status).toBe(400)

    const a = response.body;

    expect(a.status).toBe("NOT OK")
    expect(a.message).toBe("Tietoja ei voi päivittää, tiedot vanhentuneet")
  });
});


afterAll( async done => {
  console.log("... Test Ended");
  done();  
});
