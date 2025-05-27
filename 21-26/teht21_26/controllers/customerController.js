const sql = require('../db/customerSQL');

module.exports = {

    fetch: async (req, res) => {
        console.log("fetch started ...");

        try {
            let nimi = req.query.nimi;
            let osoite = "";

            let c = await sql.getCustomers(nimi, osoite);
            console.log("Next")
            let t = await sql.getCustomerTypesByLyhenne("YA");
            console.log("done")

            res.status = 200;
            res.json({ status: "OK", customers : c, types : t  });
        }
        catch (err) {
            console.log("Error in server")
            res.status = 400;
            res.json({status : "NOT OK", msg : err});
        }
    },

    fetchTypes: async (req, res) => {
        console.log("fetchTypes started ...");

        try {
            let lyhenne = req.query.lyhenne || '';

            let c = [];
            if ( !lyhenne )
                c = await sql.getCustomerTypes();
            else 
                c = await sql.getCustomerTypesByLyhenne(lyhenne);
                
            res.status = 200;
            res.json(c);
        }
        catch (err) {
            console.log("Error in server")
            res.status = 400;
            res.json({status : "NOT OK", msg : err});
        }
    },

  fetchCustomersWithOrderInfo: async (req, res) => {
    try {
        const all = req.query.all;
        const onlyActive = all === "1";
        const customers = await sql.getCustomersWithOrderInfo(onlyActive);
        res.status(200).json(customers); 
    } catch (err) {
        res.status(400).json({ message: err.message || "Virhe haettaessa asiakkaita" });
    }
},

 fetchOrdersAndRowsByCustomerId: async (req, res) => {
    try {
        const asiakasid = req.params.asiakasid;
        const data = await sql.getOrdersAndRowsByCustomerId(asiakasid);
        res.status(200).json(data);
    } catch (err) {
        res.status(400).json({ message: err.message || "Virhe haettaessa tilauksia" });
    }
},
    addOrderWithRows: async (req, res) => {
        try {
            const { tilaus, tilausrivit } = req.body;
            if (!tilausrivit || tilausrivit.length === 0) {
                return res.status(400).json({ message: "Tilausta ei lisätty, tilausrivit puuttuvat" });
            }
            await sql.addOrderWithRows(tilaus, tilausrivit);
            res.status(201).end();
        } catch (err) {
            res.status(400).json({ message: err.message || "Virhe lisättäessä tilausta" });
        }
    },

        deleteCustomer: async (req, res) => {
        try {
            const asiakasid = req.params.id;
            await sql.deleteCustomer(asiakasid);
            res.status(204).end();
        } catch (err) {
            if (err.tilausrivit) {
                res.status(400).json({ message: err.message, tilausrivit: err.tilausrivit });
            } else {
                res.status(400).json({ message: err.message || "Virhe poistettaessa asiakasta" });
            }
        }
    },

        updateOrderRows: async (req, res) => {
        try {
            const tilausid = req.params.tilausid;
            const rivit = req.body;
            await sql.updateOrderRows(tilausid, rivit);
            res.status(204).end();
        } catch (err) {
            res.status(400).json({ message: err.message || "Virhe muokatessa tilausrivejä" });
        }
    },
}