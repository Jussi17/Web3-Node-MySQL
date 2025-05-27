const app = require('./teht13_20') 
const init = require('./teht13_20.db_test') 

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
describe("Tehtävä 13", () => {

  test('Tehtävä 13, lisätään uusi opiskelija', async () => {
    const response = await request.post("/api/student")
                        .set('Content-type', 'application/json')
                        .send({ etunimi, sukunimi, postinro, typeid, osoiteid });
                        
    // Status koodi pitää olla 201
    expect(response.status).toBe(201)
  });

  test('Tehtävä 13, testataan pakolliset arvot', async () => {
    const response = await request.post("/api/student")
                        .set('Content-type', 'application/json')
                        .send({ etunimi : "", sukunimi: "", postinro : "", typeid : -1, osoiteid: -1 });
                        
    expect(response.status).toBe(400)

    const r = response.body;
    expect(r.statusid).toBe("NOT OK");
    expect(r.message).toBe("Pakollisia tietoja puuttuu:etunimi,sukunimi,postinro,typeid,osoiteid");
  });
});


describe("Tehtävä 14", () => {

    test('Tehtävä 14, lisätään uusi opiskelija joka on jo kannassa', async () => {
      const response = await request.post("/api/student")
                          .set('Content-type', 'application/json')
                          .send({ etunimi : "Maija", sukunimi : "Mehiläinen", postinro : "01320", typeid : 1, osoiteid: 1 });
                          
      expect(response.status).toBe(400)
      const r = response.body;
      expect(r.statusid).toBe("NOT OK");
      expect(r.message).toBe("Opiskelija Maija,Mehiläinen on jo olemassa");  
    });  
});

describe("Tehtävä 15", () => {

    test('Tehtävä 15, lisätään uusi opiskelija ja lähiosoite, postinumero on jo olemassa', async () => {
      const response = await request.post("/api/student")
                          .set('Content-type', 'application/json')
                          .send({ etunimi : "Testi " + Date.now(), sukunimi : "Opiskelija " + Date.now() , postinro, typeid, lahiosoite : "Uusi osoite " + Date.now() });
      
      console.log("R:", response.body);

      // Status koodi pitää olla 201
      expect(response.status).toBe(201)  
    });

    test('Tehtävä 15, lisätään uusi opiskelija ja lähiosoite, postinumeroa EI ole olemassa', async () => {
        const response = await request.post("/api/student")
                            .set('Content-type', 'application/json')
                            .send({ etunimi : "Testi " + Date.now(), sukunimi : "Opiskelija " + Date.now(), postinro: "82300", typeid, lahiosoite : "Uusi osoite " + Date.now(), postitoimipaikka : "Uusikaupunki" });
                            
        console.log("R:", response.body);

        // Status koodi pitää olla 201
        expect(response.status).toBe(201)
      });      

  });
  
  

describe("Tehtävä 16", () => {

    test('Tehtävä 16, lisätään uusi opiskelija, typeid EI KAYTOSSA', async () => {
      const response = await request.post("/api/student")
                          .set('Content-type', 'application/json')
                          .send({ etunimi : etunimi, sukunimi : sukunimi, postinro : "70100", typeid :4, osoiteid: 1 });
                          
      expect(response.status).toBe(400)
      const r = response.body;
      expect(r.statusid).toBe("NOT OK");
      expect(r.message).toBe("Tyyppi Vanhentunut ei ole käytössä");  
    });  
});

describe("Tehtävä 17", () => {

    test('Tehtävä 17, haetaan opiskelija etunimellä', async () => {
      const response = await request.get("/api/student?etunimi=M*");
  
      // Status koodi pitää olla 200
      expect(response.status).toBe(200)
  
      const data = response.body;
    
      // Palautetaan taulukko, jossa on vähintään 2 riviä
      expect(data.length).toBeGreaterThan(1);
  
      const a = data[0];
      console.log("a:", a)
  
      // Tarkistetaan että 1. objektissa on vaaditut datat
      expect(a.etunimi).toBe("Maija");
      expect(a.sukunimi).toBe("Mehiläinen");
      expect(a.lahiosoite).toBe("Opistotie 2");
      expect(a.postinro).toBe("70100");
      expect(a.postitoimipaikka).toBe("Kuopio");
      expect(a.tyyppi_id).toBe(2);
      expect(a.tyyppi_selite).toBe("Avoimen AMK:n opiskelija");
    });

    test('Tehtävä 17, haetaan opiskelija sukunimellä', async () => {
        const response = await request.get("/api/student?sukunimi=M*");
    
        // Status koodi pitää olla 200
        expect(response.status).toBe(200)
    
        const data = response.body;
      
        // Palautetaan taulukko, jossa on vähintään 2 riviä
        expect(data.length).toBeGreaterThan(1);
    
        const a = data[1];
        console.log("a:", a)
    
        // Tarkistetaan että 1. objektissa on vaaditut datat
        expect(a.etunimi).toBe("Maija");
        expect(a.sukunimi).toBe("Makkonen");
        expect(a.lahiosoite).toBe("Microkatu 1");
        expect(a.postinro).toBe("00100");
        expect(a.postitoimipaikka).toBe("Helsinki");
        expect(a.tyyppi_id).toBe(3);
        expect(a.tyyppi_selite).toBe("Muu opiskelija");
      });

      test('Tehtävä 17, haetaan opiskelija tyypillä', async () => {
        const response = await request.get("/api/student?typeid=1");
    
        // Status koodi pitää olla 200
        expect(response.status).toBe(200)
    
        const data = response.body;
      
        // Palautetaan taulukko, jossa on vähintään 2 riviä
        expect(data.length).toBeGreaterThan(1);
    
        const a = data[1];
        console.log("a:", a)
    
        // Tarkistetaan että 1. objektissa on vaaditut datat
        expect(a.etunimi).toBe("Teija");
        expect(a.sukunimi).toBe("Testaaja 13-20");
        expect(a.lahiosoite).toBe("Tekniikkapolku 23");
        expect(a.postinro).toBe("70100");
        expect(a.postitoimipaikka).toBe("Kuopio");
        expect(a.tyyppi_id).toBe(1);
        expect(a.tyyppi_selite).toBe("Varsinainen opiskelija");
      });


      test('Tehtävä 17, haetaan opiskelija etu- ja sukunimellä ja typeid:llä', async () => {
        const response = await request.get("/api/student?typeid=2&etunimi=M*&sukunimi=M*");
    
        // Status koodi pitää olla 200
        expect(response.status).toBe(200)
    
        const data = response.body;
      
        // Palautetaan taulukko, jossa on vähintään 2 riviä
        expect(data.length).toBe(1)
    
        const a = data[0];
        console.log("a:", a)
    
        // Tarkistetaan että 1. objektissa on vaaditut datat
        expect(a.etunimi).toBe("Maija");
        expect(a.sukunimi).toBe("Mehiläinen");
        expect(a.lahiosoite).toBe("Opistotie 2");
        expect(a.postinro).toBe("70100");
        expect(a.postitoimipaikka).toBe("Kuopio");
        expect(a.tyyppi_id).toBe(2);
        expect(a.tyyppi_selite).toBe("Avoimen AMK:n opiskelija");
    });

});
 
describe("Tehtävä 18", () => {

    test('Tehtävä 18, haetaan vain käytössä olevat studenttype:t', async () => {
        const response = await request.get("/api/studenttype?all=10");
                          
      expect(response.status).toBe(200)
      const data = response.body;
      
      expect(data.length).toBe(3)
  
      const a = data[1];
      console.log("a:", a)
  
      // Tarkistetaan että 1. objektissa on vaaditut datat
      expect(a.typeid).toBe(2);
      expect(a.selite).toBe("Avoimen AMK:n opiskelija");
      expect(a.status).toBe("KAYTOSSA");
  });  

  test('Tehtävä 18, haetaan kaikki studenttype:t', async () => {
    const response = await request.get("/api/studenttype?all=1");
                      
    expect(response.status).toBe(200)
    const data = response.body;

    expect(data.length).toBe(5)
    const a = data[4];

    // Tarkistetaan että 4. objektissa on vaaditut datat
    expect(a.typeid).toBe(5);
    expect(a.selite).toBe("Väärä");
    expect(a.status).toBe("EI KAYTOSSA");
    });  

});


describe("Tehtävä 19-20", () => {

  beforeEach(async () => {
    await init.initializeDatabase();
  });
  

    test('Tehtävä 19-20, haetaan opiskelijat postinumeroittain, kaikki postinumerot', async () => {
        const response = await request.get("/api/student/by/postinumero/-100");
                          
      expect(response.status).toBe(200)
      const data = response.body;
      
      expect(data.length).toBe(4)
  
      expect(data[1].postinumero).toBe("70100");
      expect(data[1].count).toBe(3);

      expect(data[2].postinumero).toBe("70200");
      expect(data[2].count).toBe(1);

      expect(data[3].postinumero).toBe("71800");
      expect(data[3].count).toBe(0);

  });  

  test('Tehtävä 19-20, haetaan opiskelijat postinumeroittain, tietty postinumerot, jolla on opiskelijoita', async () => {
    const response = await request.get("/api/student/by/postinumero/70100");
                      
    expect(response.status).toBe(200)
    const data = response.body;
    
    expect(data.length).toBe(1)

    expect(data[0].postinumero).toBe("70100");
    expect(data[0].count).toBe(3);
    });  

    test('Tehtävä 19-20, haetaan opiskelijat postinumeroittain, tietty postinumerot, jolla EI ole opiskelijoita', async () => {
        const response = await request.get("/api/student/by/postinumero/71800");
                          
        expect(response.status).toBe(200)
        const data = response.body;
        
        expect(data.length).toBe(1)
    
        expect(data[0].postinumero).toBe("71800");
        expect(data[0].count).toBe(0);
    });  
    
})
