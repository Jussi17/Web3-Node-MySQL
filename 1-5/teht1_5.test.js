const app = require('./teht1_5') // Link to your server file

const supertest = require('supertest')
//const request = supertest(app.listen(3004, "127.0.0.1"))
const request = supertest(app)

describe("Tehtävä 1", () => {

  test('Tehtävä 1, haetaan kaikki asiakkaat', async () => {
    const response = await request.get("/api/customer");
    // console.log("B:", response.body);
    // console.log("S:", response.status);    

    // Status koodi pitää olla 200
    expect(response.status).toBe(200)

    const data = response.body;

    // Tehtävässä 1 riittää palauttaa pelkkä taulukko, mutta jos on tehty myös tehtävä 4
    // palautuu tässä eri kentät    
    let asiakkaat = null;

    if ( data.status  )
    {
        expect(data.status).toBe("OK");
        expect(data.message).toBe("");

        asiakkaat = data.data;
    }
    else {
      asiakkaat = data;
    }

    // Palautetaan taulukko, jossa on vähintään 9 riviä
    expect(asiakkaat.length).toBeGreaterThan(8);

    const a = asiakkaat[0];
    console.log("a:", a)

    // Tarkistetaan että 1. objektissa on vaaditut datat
    expect(a.AVAIN).toBe(1);
    expect(a.NIMI).toBe("KALLE TAPPINEN");
    expect(a.OSOITE).toBe("OPISTOTIE 2");
    expect(a.POSTINRO).toBe("70100");
    expect(a.POSTITMP).toBe("KUOPIO");
    expect(a.ASTY_AVAIN).toBe(1);
  });
});

describe("Tehtävä 2", () => {

  test('Tehtävä 2, haetaan nimellä', async () => {
    const response = await request.get("/api/customer?nimi=K");

    // Status koodi pitää olla 200
    expect(response.status).toBe(200)

    const data = response.body;

    // Tehtävässä 1 riittää palauttaa pelkkä taulukko, mutta jos on tehty myös tehtävä 4
    // palautuu tässä eri kentät    
    let asiakkaat = null;

    if ( data.status  )
    {
        expect(data.status).toBe("OK");
        expect(data.message).toBe("");

        asiakkaat = data.data;
    }
    else {
      asiakkaat = data;
    }

    // Palautetaan taulukko, jossa on tasan 3 riviä
    expect(asiakkaat.length).toBe(3);

    const a = asiakkaat[0];
    console.log("a:", a)

    // Tarkistetaan että 1. objektissa on vaaditut datat
    expect(a.AVAIN).toBe(1);
    expect(a.NIMI).toBe("KALLE TAPPINEN");

  });

  test('Tehtävä 2, haetaan osoitteella', async () => {
    const response = await request.get("/api/customer?osoite=T");

    // Status koodi pitää olla 200
    expect(response.status).toBe(200)

    const data = response.body;

    // Tehtävässä 1 riittää palauttaa pelkkä taulukko, mutta jos on tehty myös tehtävä 4
    // palautuu tässä eri kentät    
    let asiakkaat = null;

    if ( data.status  )
    {
        expect(data.status).toBe("OK");
        expect(data.message).toBe("");

        asiakkaat = data.data;
    }
    else {
      asiakkaat = data;
    }

    // Palautetaan taulukko, jossa on tasan 2 riviä
    expect(asiakkaat.length).toBe(2);

    const a = asiakkaat[0];
    console.log("a:", a)

    // Tarkistetaan että 1. objektissa on vaaditut datat
    expect(a.AVAIN).toBe(3);
    expect(a.POSTINRO).toBe("70100");
    expect(a.ASTY_AVAIN).toBe(1);
  });

  test('Tehtävä 2, haetaan asiakastyypillä', async () => {
    const response = await request.get("/api/customer?asty=1");

    // Status koodi pitää olla 200
    expect(response.status).toBe(200)

    const data = response.body;

    // Tehtävässä 1 riittää palauttaa pelkkä taulukko, mutta jos on tehty myös tehtävä 4
    // palautuu tässä eri kentät    
    let asiakkaat = null;

    if ( data.status  )
    {
        expect(data.status).toBe("OK");
        expect(data.message).toBe("");

        asiakkaat = data.data;
    }
    else {
      asiakkaat = data;
    }

    // Palautetaan taulukko, jossa on tasan 3 riviä
    expect(asiakkaat.length).toBe(3);

    const a = asiakkaat[2];
    console.log("a:", a)

    // Tarkistetaan että 3. objektissa on vaaditut datat
    expect(a.AVAIN).toBe(7);
    expect(a.POSTINRO).toBe("89100");
    expect(a.ASTY_AVAIN).toBe(1);
    expect(a.POSTITMP).toBe("Rovaniemi");
  });

});

describe("Tehtävä 3", () => {

  test('Tehtävä 3, palautetaan ASTY_SELITE', async () => {
    const response = await request.get("/api/customer");

    // Status koodi pitää olla 200
    expect(response.status).toBe(200)

    const data = response.body;

    // Tehtävässä 1 riittää palauttaa pelkkä taulukko, mutta jos on tehty myös tehtävä 4
    // palautuu tässä eri kentät    
    let asiakkaat = null;

    if ( data.status  )
    {
        expect(data.status).toBe("OK");
        expect(data.message).toBe("");

        asiakkaat = data.data;
    }
    else {
      asiakkaat = data;
    }

    // Palautetaan taulukko, jossa on tasan 9 riviä
    expect(asiakkaat.length).toBeGreaterThan(8);

    const a = asiakkaat[0];
    console.log("a:", a)

    // Tarkistetaan että 1. objektissa on vaaditut datat
    expect(a.AVAIN).toBe(1);
    expect(a.NIMI).toBe("KALLE TAPPINEN");

    expect(a.ASTY_SELITE).toBe("YRITYSASIAKAS");

  });
});

describe("Tehtävä 4", () => {

  test('Tehtävä 4, palautetaan data JSON-objektina, status=OK', async () => {
    const response = await request.get("/api/customer");

    // Status koodi pitää olla 200
    expect(response.status).toBe(200)

    const data = response.body;

    let asiakkaat = null;

    // Kun haetaan kaikki asiakkaat, pitäisi palautua status=OK
    if ( data.status  )
    {
        expect(data.status).toBe("OK");
        expect(data.message).toBe("");

        asiakkaat = data.data;
    }
    
    expect(asiakkaat.length).toBeGreaterThan(8);

    const a = asiakkaat[0];
    console.log("a:", a)

    // Tarkistetaan että 1. objektissa on vaaditut datat
    expect(a.AVAIN).toBe(1);
    expect(a.NIMI).toBe("KALLE TAPPINEN");

    expect(a.ASTY_SELITE).toBe("YRITYSASIAKAS");

  });

  test('Tehtävä 4, palautetaan data JSON-objektina, status=NOT OK', async () => {
    const response = await request.get("/api/customer?nimi=XXX");

    // Status koodi pitää olla 200
    expect(response.status).toBe(200)

    const data = response.body;

    let asiakkaat = null;

    // Kun haetaan asiakkaita nimellä, jota ei ole kannassa, pitäisi palautua status=NOT OK
    if ( data.status  )
    {
        expect(data.status).toBe("NOT OK");
        expect(data.message).toBe("Virheellinen haku");

        asiakkaat = data.data;
    }
    
    expect(asiakkaat.length).toBe(0);
  });

});

describe("Tehtävä 5", () => {

  test('Tehtävä 5, väärä reitti', async (done) => {

    return await request.get("/api/reitti_vaarin")
      .then(response => {
        const data = response.body;

        expect(response.status).toBe(404)
        expect(data.message).toBe("Osoite oli virheellinen:/api/reitti_vaarin");
        expect(data.count).toBe(9);

        done()
      })
  });
});

afterAll( async done => {
  console.log("... Test Ended");
  done();  
});
